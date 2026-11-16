from collections.abc import Generator
from pathlib import Path

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from app.config import get_settings
from app.db_url import normalize_database_url

settings = get_settings()
database_url = normalize_database_url(settings.database_url)

connect_args: dict = {}
engine_kwargs: dict = {"pool_pre_ping": True}

if database_url.startswith("sqlite"):
    db_path = database_url.replace("sqlite:///", "", 1)
    Path(db_path).parent.mkdir(parents=True, exist_ok=True)
    connect_args = {"check_same_thread": False}
    engine_kwargs = {}
else:
    # Small pool for free Neon / Render Postgres
    engine_kwargs.update({"pool_size": 3, "max_overflow": 2})

engine = create_engine(database_url, connect_args=connect_args, **engine_kwargs)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db() -> None:
    from app import models  # noqa: F401

    Base.metadata.create_all(bind=engine)
