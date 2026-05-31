"""Pytest fixtures."""

import os
from collections.abc import Generator

import pytest
from fastapi.testclient import TestClient

# Configure test environment before app import
os.environ.setdefault("APP_ENV", "development")
os.environ.setdefault("FIREBASE_ENABLED", "false")
os.environ.setdefault("FCM_ENABLED", "false")
os.environ.setdefault("LOG_JSON", "false")
os.environ.setdefault(
    "DATABASE_URL",
    "postgresql+asyncpg://postgres:postgres@localhost:5432/restaurantos_test",
)

from app.core.config import Settings, get_settings
from app.main import create_app


@pytest.fixture
def settings() -> Settings:
    return Settings(
        app_env="development",
        firebase_enabled=False,
        fcm_enabled=False,
        docs_enabled=True,
        ready_check_migrations=False,
        database_url=os.environ["DATABASE_URL"],
    )


@pytest.fixture
def client(settings: Settings) -> Generator[TestClient, None, None]:
    get_settings.cache_clear()
    app = create_app(settings)
    with TestClient(app) as test_client:
        yield test_client
    get_settings.cache_clear()
