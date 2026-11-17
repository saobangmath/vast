from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone

import feedparser
import httpx
from bs4 import BeautifulSoup
from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from app.config import get_settings
from app.crawler.normalize import canonicalize_url, parse_datetime, strip_html
from app.crawler.related import rebuild_clusters
from app.crawler.relevance import is_science_tech
from app.crawler.sources import ALLOWLIST, TOPICS, SourceConfig
from app.models import Article, Source, Topic


@dataclass
class CrawlStats:
    fetched: int = 0
    inserted: int = 0
    updated: int = 0
    skipped: int = 0
    clusters_updated: int = 0


def ensure_catalog(db: Session) -> dict[str, Source]:
    topic_slugs = {t["slug"] for t in TOPICS}
    for topic_data in TOPICS:
        topic = db.scalar(select(Topic).where(Topic.slug == topic_data["slug"]))
        if not topic:
            topic = Topic(**topic_data)
            db.add(topic)
            db.flush()

    # Drop topics no longer in catalog (e.g. former VAST-only topic).
    for topic in list(db.scalars(select(Topic).where(Topic.slug.not_in(topic_slugs))).all()):
        db.execute(
            Article.__table__.update().where(Article.topic_id == topic.id).values(topic_id=None)
        )
        db.delete(topic)

    source_by_key: dict[str, Source] = {}
    allowlist_keys = {cfg.key for cfg in ALLOWLIST}
    for cfg in ALLOWLIST:
        source = db.scalar(select(Source).where(Source.key == cfg.key))
        if not source:
            source = Source(
                key=cfg.key,
                name=cfg.name,
                homepage_url=cfg.homepage_url,
                feed_url=cfg.feed_url,
                is_official=cfg.is_official,
            )
            db.add(source)
            db.flush()
        else:
            source.name = cfg.name
            source.homepage_url = cfg.homepage_url
            source.feed_url = cfg.feed_url
            source.is_official = cfg.is_official
        source_by_key[cfg.key] = source

    # Drop retired sources (e.g. former VAST crawl) and their articles.
    retired = list(db.scalars(select(Source).where(Source.key.not_in(allowlist_keys))).all())
    for source in retired:
        db.execute(delete(Article).where(Article.source_id == source.id))
        db.delete(source)

    db.commit()
    return source_by_key


def _topic_for(db: Session, cfg: SourceConfig) -> Topic | None:
    if not cfg.default_topic:
        return None
    return db.scalar(select(Topic).where(Topic.slug == cfg.default_topic))


def _upsert_article(
    db: Session,
    *,
    source: Source,
    topic: Topic | None,
    title: str,
    summary: str,
    url: str,
    image_url: str | None,
    published_at: datetime | None,
    stats: CrawlStats,
    existing_map: dict[str, Article] | None = None,
) -> None:
    canonical = canonicalize_url(url)
    # `existing_map` is preloaded with ONE query per source; the per-row SELECT is only a fallback.
    if existing_map is not None:
        existing = existing_map.get(canonical)
    else:
        existing = db.scalar(select(Article).where(Article.canonical_url == canonical))
    if existing:
        # Only touch rows that really changed: on a remote DB every UPDATE is a network round trip.
        changed = False
        new_title = title[:512]
        if existing.title != new_title:
            existing.title = new_title
            changed = True
        if existing.summary != summary:
            existing.summary = summary
            changed = True
        if image_url and existing.image_url != image_url:
            existing.image_url = image_url
            changed = True
        if published_at and not _same_instant(existing.published_at, published_at):
            existing.published_at = published_at
            changed = True
        if topic and existing.topic_id != topic.id:
            existing.topic = topic
            changed = True
        if changed:
            existing.crawled_at = datetime.now(timezone.utc)
            stats.updated += 1
        return

    article = Article(
        source_id=source.id,
        topic_id=topic.id if topic else None,
        title=title[:512],
        summary=summary,
        canonical_url=canonical,
        image_url=image_url,
        published_at=published_at,
    )
    db.add(article)
    if existing_map is not None:
        existing_map[canonical] = article
    stats.inserted += 1


def _same_instant(a: datetime | None, b: datetime | None) -> bool:
    """Compare datetimes treating naive values (SQLite) as UTC."""
    if a is None or b is None:
        return a is b
    if a.tzinfo is None:
        a = a.replace(tzinfo=timezone.utc)
    if b.tzinfo is None:
        b = b.replace(tzinfo=timezone.utc)
    return a == b


def first_image_in_html(raw: str | None) -> str | None:
    """Thanh Nien, Genk and VietnamNet put the picture as an <img> inside the item description
    instead of media:content / enclosure."""
    if not raw:
        return None
    img = BeautifulSoup(raw, "html.parser").find("img")
    src = (img.get("src") or "").strip() if img else ""
    return src if src.startswith(("http://", "https://")) else None


def fetch_rss(cfg: SourceConfig) -> list[dict]:
    if not cfg.feed_url:
        return []

    settings = get_settings()
    headers = {"User-Agent": settings.crawl_user_agent}
    with httpx.Client(timeout=settings.crawl_timeout_seconds, follow_redirects=True, headers=headers) as client:
        response = client.get(cfg.feed_url)
        response.raise_for_status()
        payload = response.text

    parsed = feedparser.parse(payload)
    items: list[dict] = []
    for entry in parsed.entries[:80]:
        link = getattr(entry, "link", None) or ""
        title = strip_html(getattr(entry, "title", "") or "")
        if not link or not title:
            continue
        summary = strip_html(
            getattr(entry, "summary", None)
            or getattr(entry, "description", None)
            or ""
        )
        image_url = None
        media = getattr(entry, "media_content", None) or getattr(entry, "media_thumbnail", None)
        if media and isinstance(media, list) and media:
            image_url = media[0].get("url")
        elif getattr(entry, "enclosures", None):
            for enc in entry.enclosures:
                if str(enc.get("type", "")).startswith("image"):
                    image_url = enc.get("href")
                    break
        if not image_url:
            image_url = first_image_in_html(
                getattr(entry, "summary", None) or getattr(entry, "description", None)
            )

        published = parse_datetime(
            getattr(entry, "published", None) or getattr(entry, "updated", None)
        )
        items.append(
            {
                "title": title,
                "summary": summary[:1200],
                "url": link,
                "image_url": image_url,
                "published_at": published,
            }
        )
    return items


def purge_offtopic(db: Session) -> int:
    """Remove stored articles that fail the science/tech relevance check."""
    removed = 0
    for article in list(db.scalars(select(Article)).all()):
        if not is_science_tech(article.title, article.summary or ""):
            db.delete(article)
            removed += 1
    if removed:
        db.commit()
    return removed


def run_crawl(db: Session) -> CrawlStats:
    stats = CrawlStats()
    sources = ensure_catalog(db)
    removed = purge_offtopic(db)

    for cfg in ALLOWLIST:
        source = sources[cfg.key]
        topic = _topic_for(db, cfg)
        try:
            items = fetch_rss(cfg)
        except Exception:
            # Keep crawl resilient; one bad source should not fail the batch.
            continue

        stats.fetched += len(items)
        kept = []
        for item in items:
            if is_science_tech(item["title"], item.get("summary") or ""):
                kept.append(item)
            else:
                stats.skipped += 1

        # One query for all already-known articles of this batch (instead of one per article).
        urls = {canonicalize_url(item["url"]) for item in kept}
        existing_map = (
            {a.canonical_url: a for a in db.scalars(select(Article).where(Article.canonical_url.in_(urls)))}
            if urls
            else {}
        )
        for item in kept:
            _upsert_article(
                db,
                source=source,
                topic=topic,
                title=item["title"],
                summary=item["summary"],
                url=item["url"],
                image_url=item.get("image_url"),
                published_at=item.get("published_at"),
                stats=stats,
                existing_map=existing_map,
            )
        db.commit()

    # Clusters depend on the set of articles: rebuild only when it changed. Most 5-minute cycles
    # bring nothing new, and rebuilding is by far the most expensive step on a remote database.
    stats.clusters_updated = rebuild_clusters(db) if (stats.inserted or removed) else 0
    return stats
