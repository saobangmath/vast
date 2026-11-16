import logging

from fastapi import APIRouter, HTTPException, Request

from app.crawler.scheduler import run_crawl_safe, scheduler_status
from app.schemas import CrawlResult

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/crawl", tags=["crawl"])


@router.get("/status")
def crawl_status() -> dict:
    return scheduler_status()


@router.api_route("/run", methods=["GET", "POST"], response_model=CrawlResult)
def trigger_crawl(request: Request) -> CrawlResult:
    """Triggered by GitHub Actions schedule, manual curl, or local tools."""
    logger.info(
        "Crawl API called method=%s client=%s path=%s",
        request.method,
        request.client.host if request.client else "unknown",
        request.url.path,
    )
    stats = run_crawl_safe()
    if stats is None:
        logger.warning("Crawl API finished with no stats (busy or failed)")
        raise HTTPException(
            status_code=409,
            detail="Crawl already running or failed; check GET /api/crawl/status",
        )
    logger.info(
        "Crawl API done fetched=%s inserted=%s updated=%s skipped=%s clusters=%s",
        stats.fetched,
        stats.inserted,
        stats.updated,
        stats.skipped,
        stats.clusters_updated,
    )
    return CrawlResult(
        fetched=stats.fetched,
        inserted=stats.inserted,
        updated=stats.updated,
        skipped=stats.skipped,
        clusters_updated=stats.clusters_updated,
    )
