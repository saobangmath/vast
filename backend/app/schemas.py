from datetime import datetime

from pydantic import BaseModel, ConfigDict, HttpUrl


class SourceOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    key: str
    name: str
    homepage_url: str
    is_official: bool


class TopicOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    slug: str
    name: str
    description: str | None = None


class ArticleCard(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    summary: str
    canonical_url: str
    image_url: str | None = None
    published_at: datetime | None = None
    related_count: int
    hot_score: float
    source: SourceOut
    topic: TopicOut | None = None


class ArticleDetail(ArticleCard):
    crawled_at: datetime
    cluster_id: int | None = None
    related_articles: list[ArticleCard] = []


class FeedResponse(BaseModel):
    items: list[ArticleCard]
    total: int
    page: int
    page_size: int


class CrawlResult(BaseModel):
    fetched: int
    inserted: int
    updated: int
    skipped: int = 0
    clusters_updated: int


class HealthOut(BaseModel):
    status: str
    app: str
    crawl: dict | None = None
