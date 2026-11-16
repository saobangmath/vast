import os
from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_name: str = "VAST Tin nóng KHCN"
    database_url: str = "sqlite:///./data/vast_news.db"
    # Comma-separated exact origins. Optional on first deploy — see cors_origin_regex.
    cors_origins: str = "http://localhost:3000"
    # Allows unknown Vercel frontend URLs before you know the exact hostname.
    # Set empty string to disable. Example: https://.*\.vercel\.app
    cors_origin_regex: str = r"https://.*\.vercel\.app"
    crawl_user_agent: str = (
        "VAST-NewsHubDemo/1.0 (+https://vast.gov.vn; research-demo; contact=demo@local)"
    )
    crawl_timeout_seconds: float = 20.0
    related_similarity_threshold: float = 0.35
    # In-API asyncio scheduler (off by default — prod uses GitHub Actions)
    crawl_scheduler_enabled: bool = False
    crawl_interval_seconds: int = 300  # 5 minutes (used if scheduler enabled)
    crawl_on_startup: bool = True

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    @property
    def is_vercel(self) -> bool:
        return bool(os.getenv("VERCEL"))

    @property
    def scheduler_should_run(self) -> bool:
        # Vercel Functions are request-scoped; use Vercel Cron /api/crawl/run instead.
        if self.is_vercel:
            return False
        return self.crawl_scheduler_enabled


@lru_cache
def get_settings() -> Settings:
    return Settings()
