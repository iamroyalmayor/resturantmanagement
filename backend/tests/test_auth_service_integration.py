"""Integration tests for AuthService (requires PostgreSQL)."""

import os
import uuid

import pytest
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.config import Settings
from app.core.enums import UserRole
from app.core.security import FirebaseTokenPayload
from app.services.auth_service import AuthService

pytestmark = pytest.mark.skipif(
    os.getenv("RUN_DB_INTEGRATION_TESTS", "").lower() != "true",
    reason="Set RUN_DB_INTEGRATION_TESTS=true with a running Postgres database",
)


@pytest.fixture
async def db_session() -> AsyncSession:
    settings = Settings(
        database_url=os.environ.get(
            "DATABASE_URL",
            "postgresql+asyncpg://postgres:postgres@localhost:5432/restaurantos_test",
        ),
    )
    engine = create_async_engine(str(settings.database_url))
    session_factory = async_sessionmaker(engine, expire_on_commit=False)
    async with session_factory() as session:
        yield session
        await session.rollback()
    await engine.dispose()


@pytest.mark.asyncio
async def test_bootstrap_creates_customer(db_session: AsyncSession) -> None:
    settings = Settings(
        database_url=os.environ["DATABASE_URL"],
        restaurant_id=None,
    )
    service = AuthService(db_session, settings)
    unique = uuid.uuid4().hex[:8]
    payload = FirebaseTokenPayload(
        firebase_uid=f"test-uid-{unique}",
        email=f"customer-{unique}@test.com",
        email_verified=True,
    )
    session = await service.create_session(payload, display_name="Test Customer")
    assert session.role == UserRole.CUSTOMER
    assert session.user.email == f"customer-{unique}@test.com"
