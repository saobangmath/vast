from fastapi import APIRouter, HTTPException

from app.crawler.scheduler import run_crawl_safe, scheduler_status
from app.schemas import CrawlResult

router = APIRouter(prefix="/crawl", tags=["crawl"])


@router.get("/status")
def crawl_status() -> dict:
    return scheduler_status()


@router.api_route("/run", methods=["GET", "POST"], response_model=CrawlResult)
def trigger_crawl() -> CrawlResult:
    """GET is used by Vercel Cron; POST remains for manual triggers."""
    stats = run_crawl_safe()
    if stats is None:
        raise HTTPException(
            status_code=409,
            detail="Crawl already running or failed; check GET /api/crawl/status",
        )
    return CrawlResult(
        fetched=stats.fetched,
        inserted=stats.inserted,
        updated=stats.updated,
        skipped=stats.skipped,
        clusters_updated=stats.clusters_updated,
    )
