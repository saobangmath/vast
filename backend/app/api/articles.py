from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.models import Article, Topic
from app.schemas import ArticleCard, ArticleDetail, FeedResponse

router = APIRouter(prefix="/articles", tags=["articles"])


def _article_options():
    return joinedload(Article.source), joinedload(Article.topic)


def _apply_topic_filter(query, topic: str | None):
    if topic:
        query = query.join(Topic, Article.topic_id == Topic.id).where(Topic.slug == topic)
    return query


@router.get("/hot", response_model=FeedResponse)
def hot_feed(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=50),
    topic: str | None = None,
    db: Session = Depends(get_db),
) -> FeedResponse:
    query = _apply_topic_filter(select(Article).options(*_article_options()), topic)
    count_query = _apply_topic_filter(select(func.count(Article.id)), topic)

    total = db.scalar(count_query) or 0
    items = db.scalars(
        query.order_by(Article.hot_score.desc(), Article.published_at.desc().nullslast())
        .offset((page - 1) * page_size)
        .limit(page_size)
    ).unique().all()
    return FeedResponse(items=list(items), total=total, page=page, page_size=page_size)


@router.get("/new", response_model=FeedResponse)
def new_feed(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=50),
    topic: str | None = None,
    db: Session = Depends(get_db),
) -> FeedResponse:
    query = _apply_topic_filter(select(Article).options(*_article_options()), topic)
    count_query = _apply_topic_filter(select(func.count(Article.id)), topic)

    total = db.scalar(count_query) or 0
    items = db.scalars(
        query.order_by(Article.published_at.desc().nullslast(), Article.id.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    ).unique().all()
    return FeedResponse(items=list(items), total=total, page=page, page_size=page_size)


@router.get("/{article_id}", response_model=ArticleDetail)
def article_detail(article_id: int, db: Session = Depends(get_db)) -> ArticleDetail:
    article = db.scalar(
        select(Article).options(*_article_options()).where(Article.id == article_id)
    )
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")

    related: list[Article] = []
    if article.cluster_id:
        related = list(
            db.scalars(
                select(Article)
                .options(*_article_options())
                .where(Article.cluster_id == article.cluster_id, Article.id != article.id)
                .order_by(Article.published_at.desc().nullslast())
                .limit(12)
            ).unique().all()
        )

    detail = ArticleDetail.model_validate(article)
    detail.related_articles = [ArticleCard.model_validate(a) for a in related]
    return detail
