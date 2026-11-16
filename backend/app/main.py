import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import articles, crawl, topics
from app.config import get_settings
from app.crawler.runner import ensure_catalog
from app.crawler.scheduler import scheduler_status, start_scheduler, stop_scheduler
from app.database import SessionLocal, init_db
from app.schemas import HealthOut

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s [%(name)s] %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(_: FastAPI):
    logger.info("API starting app=%s", get_settings().app_name)
    init_db()
    db = SessionLocal()
    try:
        ensure_catalog(db)
    finally:
        db.close()
    start_scheduler()
    try:
        yield
    finally:
        await stop_scheduler()
        logger.info("API shutting down")


settings = get_settings()
app = FastAPI(title=settings.app_name, lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_origin_regex=settings.cors_origin_regex or None,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(articles.router, prefix="/api")
app.include_router(topics.router, prefix="/api")
app.include_router(crawl.router, prefix="/api")


@app.get("/")
def root() -> dict[str, str]:
    return {"message": "hello"}


@app.get("/api/health", response_model=HealthOut)
def health() -> HealthOut:
    return HealthOut(status="ok", app=settings.app_name, crawl=scheduler_status())
