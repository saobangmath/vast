#!/usr/bin/env python3
"""Optional local/always-on crawler loop (default: every 1 hour).

Production auto-crawl uses GitHub Actions → POST /api/crawl/run hourly.
Use this script only if you want a local worker instead:

  make crawl-loop
  python -m scripts.crawl_loop
"""

from __future__ import annotations

import os
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from app.config import get_settings
from app.crawler.scheduler import run_crawl_safe
from app.database import init_db


def main() -> None:
    settings = get_settings()
    interval = int(os.getenv("CRAWL_INTERVAL_SECONDS", settings.crawl_interval_seconds))
    interval = max(interval, 30)

    init_db()
    print(f"crawl_loop started interval={interval}s", flush=True)

    # Run once immediately, then every interval.
    while True:
        started = time.time()
        stats = run_crawl_safe()
        if stats is None:
            print("crawl skipped or failed", flush=True)
        else:
            print(
                f"crawl ok fetched={stats.fetched} inserted={stats.inserted} "
                f"updated={stats.updated} skipped={stats.skipped} "
                f"clusters={stats.clusters_updated}",
                flush=True,
            )
        elapsed = time.time() - started
        sleep_for = max(interval - elapsed, 1)
        time.sleep(sleep_for)


if __name__ == "__main__":
    main()
