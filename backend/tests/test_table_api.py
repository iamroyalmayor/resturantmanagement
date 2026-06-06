"""Integration tests for Table API endpoints."""

from typing import Generator
from uuid import uuid4
from unittest.mock import AsyncMock

import pytest
from fastapi.testclient import TestClient

from app.api.deps import get_auth_service, get_request_context, get_table_service
from app.core.enums import ModulePermission, UserRole
from app.core.security import RequestContext
from app.main import create_app
from app.schemas.table import TableSchema, PublicTableContextResponse, RestaurantPublicSchema, TablePublicSchema
from app.core.config import get_settings

RESTAURANT_ID = uuid4()


def _admin_context() -> RequestContext:
    return RequestContext(
        firebase_uid="firebase-admin",
        user_id=uuid4(),
        restaurant_id=RESTAURANT_ID,
        role=UserRole.ADMIN,
        permissions=frozenset(ModulePermission),
        correlation_id="test-correlation",
        email="admin@test.com",
    )


@pytest.fixture
def table_client() -> Generator[TestClient, None, None]:
    settings = get_settings()
    app = create_app(settings)

    mock_auth = AsyncMock()
    mock_auth.build_request_context.return_value = _admin_context()

    async def override_context() -> RequestContext:
        return _admin_context()

    app.dependency_overrides[get_auth_service] = lambda: mock_auth
    app.dependency_overrides[get_request_context] = override_context

    with TestClient(app) as client:
        yield client

    app.dependency_overrides.clear()


def test_list_tables(table_client: TestClient) -> None:
    mock_service = AsyncMock()
    mock_service.list_tables.return_value = [
        TableSchema(
            id=uuid4(),
            restaurant_id=RESTAURANT_ID,
            number=1,
            capacity=2,
            qr_token="token123",
            created_at="2026-06-05T00:00:00Z",
            updated_at="2026-06-05T00:00:00Z"
        )
    ]
    table_client.app.dependency_overrides[get_table_service] = lambda: mock_service

    response = table_client.get("/api/v1/tables")
    assert response.status_code == 200
    assert len(response.json()["data"]) == 1


def test_resolve_public_table(table_client: TestClient) -> None:
    mock_service = AsyncMock()
    mock_service.resolve_table_context.return_value = PublicTableContextResponse(
        restaurant=RestaurantPublicSchema(id=RESTAURANT_ID, name="Test Restaurant"),
        table=TablePublicSchema(number=1, capacity=2),
        is_ordering_available=True
    )
    table_client.app.dependency_overrides[get_table_service] = lambda: mock_service

    response = table_client.get("/api/v1/public/table/token123")
    assert response.status_code == 200
    assert response.json()["data"]["restaurant"]["name"] == "Test Restaurant"
