#!/usr/bin/env python3
"""Run one crawl cycle from CLI: python -m scripts.crawl"""

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from app.crawler.runner import run_crawl
from app.database import SessionLocal, init_db


def main() -> None:
    init_db()
    db = SessionLocal()
    try:
        stats = run_crawl(db)
        print(
            f"fetched={stats.fetched} inserted={stats.inserted} "
            f"updated={stats.updated} skipped={stats.skipped} "
            f"clusters={stats.clusters_updated}"
        )
    finally:
        db.close()


if __name__ == "__main__":
    main()
