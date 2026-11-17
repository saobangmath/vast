"""Periodic crawl scheduler (runs inside the API process)."""

from __future__ import annotations

import asyncio
import logging
from datetime import datetime, timedelta, timezone
from threading import Lock

from sqlalchemy import delete, select

from app.config import get_settings
from app.crawler.runner import CrawlStats, run_crawl
from app.database import SessionLocal
from app.models import CrawlRun

logger = logging.getLogger(__name__)

# "healthy" = a crawl finished OK recently (3 missed 5-minute cycles tolerated).
HEALTHY_WITHIN = timedelta(minutes=15)
# A run without finished_at older than this is considered dead (e.g. the function was killed).
STUCK_AFTER = timedelta(minutes=10)


def _aware(dt: datetime | None) -> datetime | None:
    if dt is not None and dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt


def _record_start() -> int | None:
    """Persist the start of a cycle. Never lets bookkeeping break the crawl itself."""
    try:
        with SessionLocal() as s:
            run = CrawlRun(started_at=datetime.now(timezone.utc))
            s.add(run)
            s.commit()
            return run.id
    except Exception as exc:  # noqa: BLE001
        logger.warning("Could not record crawl start: %s", exc)
        return None


def _record_end(run_id: int | None, stats: CrawlStats | None, error: str | None) -> None:
    if run_id is None:
        return
    try:
        with SessionLocal() as s:
            run = s.get(CrawlRun, run_id)
            if run is not None:
                run.finished_at = datetime.now(timezone.utc)
                run.ok = error is None
                run.error = error[:2000] if error else None
                if stats is not None:
                    run.fetched = stats.fetched
                    run.inserted = stats.inserted
                    run.updated = stats.updated
                    run.skipped = stats.skipped
                    run.clusters_updated = stats.clusters_updated
            s.execute(delete(CrawlRun).where(CrawlRun.id < run_id - 200))  # keep the table small
            s.commit()
    except Exception as exc:  # noqa: BLE001
        logger.warning("Could not record crawl end: %s", exc)

_lock = Lock()
_task: asyncio.Task | None = None
_last_started_at: datetime | None = None
_last_finished_at: datetime | None = None
_last_error: str | None = None
_last_stats: CrawlStats | None = None
_running = False


def _db_status() -> dict:
    """Crawl health from the persisted runs (works on serverless, unlike in-process state)."""
    try:
        with SessionLocal() as s:
            latest = s.scalar(select(CrawlRun).order_by(CrawlRun.id.desc()).limit(1))
            last_ok = s.scalar(select(CrawlRun).where(CrawlRun.ok.is_(True)).order_by(CrawlRun.id.desc()).limit(1))
    except Exception as exc:  # noqa: BLE001
        logger.warning("Could not read crawl runs: %s", exc)
        return {}
    now = datetime.now(timezone.utc)
    out: dict = {"healthy": False, "last_success_at": None, "minutes_since_last_success": None}
    if latest is not None:
        started, finished = _aware(latest.started_at), _aware(latest.finished_at)
        out.update(
            running=finished is None and now - started < STUCK_AFTER,
            last_started_at=started.isoformat() if started else None,
            last_finished_at=finished.isoformat() if finished else None,
            last_error=latest.error,
            last_stats=(
                {
                    "fetched": latest.fetched,
                    "inserted": latest.inserted,
                    "updated": latest.updated,
                    "skipped": latest.skipped,
                    "clusters_updated": latest.clusters_updated,
                }
                if latest.ok
                else None
            ),
        )
    if last_ok is not None and last_ok.finished_at is not None:
        done = _aware(last_ok.finished_at)
        out["last_success_at"] = done.isoformat()
        out["minutes_since_last_success"] = int((now - done).total_seconds() // 60)
        out["healthy"] = now - done < HEALTHY_WITHIN
    return out


def scheduler_status() -> dict:
    settings = get_settings()
    return {
        **_memory_status(settings),
        **_db_status(),
    }


def _memory_status(settings) -> dict:
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
    run_id = _record_start()
    db = SessionLocal()
    try:
        stats = run_crawl(db)
        _last_stats = stats
        _last_finished_at = datetime.now(timezone.utc)
        _record_end(run_id, stats, None)
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
        _record_end(run_id, None, str(exc))
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
