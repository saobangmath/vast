from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone

import feedparser
import httpx
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
) -> None:
    canonical = canonicalize_url(url)
    existing = db.scalar(select(Article).where(Article.canonical_url == canonical))
    if existing:
        existing.title = title[:512]
        existing.summary = summary
        existing.image_url = image_url
        if published_at:
            existing.published_at = published_at
        if topic:
            existing.topic = topic
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
    stats.inserted += 1


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
    purge_offtopic(db)

    for cfg in ALLOWLIST:
        source = sources[cfg.key]
        topic = _topic_for(db, cfg)
        try:
            items = fetch_rss(cfg)
        except Exception:
            # Keep crawl resilient; one bad source should not fail the batch.
            continue

        stats.fetched += len(items)
        for item in items:
            if not is_science_tech(item["title"], item.get("summary") or ""):
                stats.skipped += 1
                continue
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
            )
        db.commit()

    stats.clusters_updated = rebuild_clusters(db)
    return stats
