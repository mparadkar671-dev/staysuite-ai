"""Application settings, loaded from environment variables / .env."""
from functools import lru_cache

from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

_DEV_SECRET_MARKER = "dev-only-secret"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_name: str = "StaySuite AI"
    environment: str = "development"  # development | staging | production

    database_url: str = "postgresql+asyncpg://staysuite:staysuite@localhost:5432/staysuite"
    redis_url: str | None = "redis://localhost:6379/0"

    jwt_secret: str = "dev-only-secret-change-me-dev-only-secret-change-me"
    jwt_algorithm: str = "HS256"
    access_token_minutes: int = 60
    refresh_token_days: int = 30

    cors_origins: str = "http://localhost:3000,http://localhost:3001,http://localhost:3002,http://localhost:3003,http://localhost:8080"

    trial_days: int = 30

    # AI Copilot (Gemini 2.5 Flash)
    gemini_api_key: str | None = None
    gemini_model: str = "gemini-2.5-flash"

    # Meta WhatsApp Cloud API
    whatsapp_cloud_api_token: str | None = None
    whatsapp_phone_number_id: str | None = None
    whatsapp_api_version: str = "v21.0"

    # Guest Web Storefront Base URL
    guest_web_base_url: str = "https://staysuite.in"

    # Delta-pull safety window. Rows are stamped with the app-server clock before the
    # transaction commits, so a slow transaction can commit "in the past" relative to a
    # client's cursor. Re-sending the last N seconds on each pull is harmless (idempotent
    # upserts) and closes that gap.
    sync_pull_overlap_seconds: int = 10
    sync_max_push_batch: int = 500
    sync_max_client_clock_skew_seconds: int = 300

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    @property
    def is_production(self) -> bool:
        return self.environment.lower() == "production"

    @model_validator(mode="after")
    def _reject_insecure_production(self) -> "Settings":
        if self.is_production:
            if _DEV_SECRET_MARKER in self.jwt_secret or len(self.jwt_secret) < 32:
                raise ValueError("JWT_SECRET must be a strong, unique value (>=32 chars) in production")
            if self.cors_origins.strip() == "*":
                raise ValueError("CORS_ORIGINS must list explicit origins in production")
        return self


@lru_cache
def get_settings() -> Settings:
    return Settings()
