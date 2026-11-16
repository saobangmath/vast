"""Periodic crawl scheduler (runs inside the API process)."""

from __future__ import annotations

import asyncio
import logging
from datetime import datetime, timezone
from threading import Lock

from app.config import get_settings
from app.crawler.runner import CrawlStats, run_crawl
from app.database import SessionLocal

logger = logging.getLogger(__name__)

_lock = Lock()
_task: asyncio.Task | None = None
_last_started_at: datetime | None = None
_last_finished_at: datetime | None = None
_last_error: str | None = None
_last_stats: CrawlStats | None = None
_running = False


def scheduler_status() -> dict:
    settings = get_settings()
    return {
        "enabled": settings.scheduler_should_run,
        "vercel": settings.is_vercel,
        "interval_seconds": settings.crawl_interval_seconds,
        "running": _running,
        "last_started_at": _last_started_at.isoformat() if _last_started_at else None,
        "last_finished_at": _last_finished_at.isoformat() if _last_finished_at else None,
        "last_error": _last_error,
        "last_stats": (
            {
                "fetched": _last_stats.fetched,
                "inserted": _last_stats.inserted,
                "updated": _last_stats.updated,
                "skipped": _last_stats.skipped,
                "clusters_updated": _last_stats.clusters_updated,
            }
            if _last_stats
            else None
        ),
    }


def run_crawl_safe() -> CrawlStats | None:
    """Run one crawl cycle; skip if another cycle is already in progress."""
    global _running, _last_started_at, _last_finished_at, _last_error, _last_stats

    if not _lock.acquire(blocking=False):
        logger.info("Crawl skipped: previous cycle still running")
        return None

    _running = True
    _last_started_at = datetime.now(timezone.utc)
    _last_error = None
    db = SessionLocal()
    try:
        stats = run_crawl(db)
        _last_stats = stats
        _last_finished_at = datetime.now(timezone.utc)
        logger.info(
            "Crawl finished fetched=%s inserted=%s updated=%s skipped=%s clusters=%s",
            stats.fetched,
            stats.inserted,
            stats.updated,
            stats.skipped,
            stats.clusters_updated,
        )
        return stats
    except Exception as exc:  # noqa: BLE001 - keep scheduler alive
        _last_error = str(exc)
        _last_finished_at = datetime.now(timezone.utc)
        logger.exception("Crawl failed: %s", exc)
        return None
    finally:
        db.close()
        _running = False
        _lock.release()


async def _periodic_loop() -> None:
    settings = get_settings()
    interval = max(settings.crawl_interval_seconds, 30)

    if settings.crawl_on_startup:
        logger.info("Running initial crawl on startup")
        await asyncio.to_thread(run_crawl_safe)

    while True:
        await asyncio.sleep(interval)
        logger.info("Running scheduled crawl (every %ss)", interval)
        await asyncio.to_thread(run_crawl_safe)


def start_scheduler() -> None:
    global _task
    settings = get_settings()
    if not settings.scheduler_should_run:
        reason = "vercel serverless" if settings.is_vercel else "disabled by config"
        logger.info("Crawl in-process scheduler off (%s)", reason)
        return
    if _task and not _task.done():
        return
    logger.info(
        "Starting crawl scheduler every %ss (startup_crawl=%s)",
        settings.crawl_interval_seconds,
        settings.crawl_on_startup,
    )
    _task = asyncio.create_task(_periodic_loop(), name="crawl-scheduler")


async def stop_scheduler() -> None:
    global _task
    if not _task:
        return
    _task.cancel()
    try:
        await _task
    except asyncio.CancelledError:
        pass
    _task = None
