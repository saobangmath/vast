"""Normalize DATABASE_URL for SQLAlchemy (Neon/Supabase/Render Postgres)."""

from __future__ import annotations

from urllib.parse import parse_qsl, urlencode, urlparse, urlunparse


def normalize_database_url(url: str) -> str:
    """Convert common provider URLs into a SQLAlchemy-friendly form."""
    raw = url.strip()
    if raw.startswith("postgres://"):
        raw = "postgresql://" + raw[len("postgres://") :]

    if raw.startswith("postgresql://") and "+psycopg2" not in raw and "+psycopg" not in raw:
        raw = "postgresql+psycopg2://" + raw[len("postgresql://") :]

    if not raw.startswith("postgresql"):
        return raw

    parsed = urlparse(raw)
    query = dict(parse_qsl(parsed.query, keep_blank_values=True))
    # Neon / most managed Postgres require TLS
    query.setdefault("sslmode", "require")
    return urlunparse(parsed._replace(query=urlencode(query)))
