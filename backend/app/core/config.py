"""Application configuration via environment variables."""

from functools import lru_cache
from typing import Literal

from pydantic import Field, PostgresDsn, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Validated settings loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # Application
    app_env: Literal["development", "staging", "production"] = "development"
    app_name: str = "RestaurantOS API"
    api_host: str = "0.0.0.0"
    api_port: int = 8000
    log_level: str = "INFO"
    log_json: bool = False

    cors_origins: str = "http://localhost:5173"

    restaurant_id: str | None = None

    # Database
    database_url: PostgresDsn = Field(
        default="postgresql+asyncpg://postgres:postgres@localhost:5432/restaurantos"
    )
    db_pool_size: int = 5
    db_max_overflow: int = 10
    db_pool_timeout: int = 30
    db_echo: bool = False

    # Firebase
    firebase_enabled: bool = True
    firebase_project_id: str | None = None
    google_application_credentials: str | None = None
    firebase_auth_emulator_host: str | None = None

    # FCM
    fcm_enabled: bool = True

    # Supabase (later phases)
    supabase_url: str | None = None
    supabase_service_role_key: str | None = None
    storage_bucket_menu: str = "menu-images"

    # API docs
    docs_enabled: bool = True

    # Readiness
    ready_check_migrations: bool = False

    # Development auth bypass (never enable in production)
    dev_auth_enabled: bool = False
    dev_auth_token: str = "dev-local-token"
    dev_auth_firebase_uid: str = "dev-firebase-uid"
    dev_auth_email: str = "admin@restaurantos.local"
    dev_auth_name: str = "Dev Admin"
    dev_auth_role: str = "admin"

    @property
    def is_production(self) -> bool:
        return self.app_env == "production"

    @property
    def is_development(self) -> bool:
        return self.app_env == "development"

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    @field_validator("database_url", mode="before")
    @classmethod
    def validate_database_url(cls, value: str) -> str:
        url = str(value)
        if url.startswith("postgresql://"):
            return url.replace("postgresql://", "postgresql+asyncpg://", 1)
        return url

    def validate_startup(self) -> None:
        """Fail fast when required production settings are missing."""
        if self.is_production and self.dev_auth_enabled:
            raise ValueError("DEV_AUTH_ENABLED cannot be true in production")
        if self.is_production:
            if self.firebase_enabled and not self.firebase_project_id:
                raise ValueError("FIREBASE_PROJECT_ID is required when FIREBASE_ENABLED=true in production")
            if self.firebase_enabled and not self.google_application_credentials:
                raise ValueError(
                    "GOOGLE_APPLICATION_CREDENTIALS is required when FIREBASE_ENABLED=true in production"
                )


@lru_cache
def get_settings() -> Settings:
    return Settings()
