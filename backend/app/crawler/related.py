from datetime import datetime, timezone

from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from app.config import get_settings
from app.crawler.normalize import tokenize
from app.models import Article, Cluster


def jaccard(a: set[str], b: set[str]) -> float:
    if not a or not b:
        return 0.0
    inter = len(a & b)
    union = len(a | b)
    return inter / union if union else 0.0


def hot_score(related_count: int, published_at: datetime | None) -> float:
    now = datetime.now(timezone.utc)
    if published_at is None:
        age_hours = 72.0
    else:
        if published_at.tzinfo is None:
            published_at = published_at.replace(tzinfo=timezone.utc)
        age_hours = max((now - published_at.astimezone(timezone.utc)).total_seconds() / 3600.0, 0.0)
    freshness = 1.0 / (1.0 + age_hours / 24.0)
    return related_count * 2.0 + freshness * 5.0


def rebuild_clusters(db: Session) -> int:
    """Greedy clustering by title token Jaccard similarity."""
    settings = get_settings()
    articles = list(db.scalars(select(Article).order_by(Article.published_at.desc().nullslast())).all())
    if not articles:
        return 0

    # Old clusters are deleted only AFTER the articles point at the new ones, so the whole rebuild
    # is one flush (new clusters + article updates) instead of one round trip per cluster.
    old_cluster_ids = list(db.scalars(select(Cluster.id)).all())

    clusters: list[tuple[Cluster, set[str], list[Article]]] = []
    for article in articles:
        tokens = tokenize(article.title)
        best_idx = -1
        best_score = 0.0
        for idx, (_, cluster_tokens, _) in enumerate(clusters):
            score = jaccard(tokens, cluster_tokens)
            if score > best_score:
                best_score = score
                best_idx = idx

        if best_idx >= 0 and best_score >= settings.related_similarity_threshold:
            cluster, cluster_tokens, members = clusters[best_idx]
            members.append(article)
            cluster_tokens |= tokens
            article.cluster = cluster
        else:
            cluster = Cluster(representative_title=article.title, article_count=1)
            db.add(cluster)
            article.cluster = cluster
            clusters.append((cluster, set(tokens), [article]))

    updated = 0
    for cluster, _, members in clusters:
        cluster.article_count = len(members)
        for article in members:
            article.related_count = max(len(members) - 1, 0)
            article.hot_score = hot_score(article.related_count, article.published_at)
        updated += 1

    db.flush()
    if old_cluster_ids:
        db.execute(delete(Cluster).where(Cluster.id.in_(old_cluster_ids)))
    db.commit()
    return updated
