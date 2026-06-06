"""Integration tests for Menu API endpoints."""

from uuid import UUID, uuid4
from unittest.mock import AsyncMock

import pytest
from fastapi.testclient import TestClient

from app.api.deps import get_auth_service, get_request_context, get_menu_service
from app.core.enums import ModulePermission, UserRole
from app.core.security import RequestContext
from app.main import create_app
from app.schemas.menu import MenuCategorySchema, MenuItemSchema
from app.core.config import get_settings

RESTAURANT_ID = uuid4()
USER_ID = uuid4()


def _admin_context() -> RequestContext:
    return RequestContext(
        firebase_uid="firebase-admin",
        user_id=USER_ID,
        restaurant_id=RESTAURANT_ID,
        role=UserRole.ADMIN,
        permissions=frozenset(ModulePermission),
        correlation_id="test-correlation",
        email="admin@test.com",
    )


@pytest.fixture
def menu_client() -> TestClient:
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


def test_list_categories(menu_client: TestClient) -> None:
    # Prepare mock service
    mock_menu_service = AsyncMock()
    mock_menu_service.list_categories.return_value = [
        MenuCategorySchema(
            id=uuid4(),
            restaurant_id=RESTAURANT_ID,
            name="Appetizers",
            description="Starters",
            display_order=0,
            is_active=True,
            created_at="2026-06-05T00:00:00Z",
            updated_at="2026-06-05T00:00:00Z"
        )
    ]
    menu_client.app.dependency_overrides[get_menu_service] = lambda: mock_menu_service

    # Execute
    response = menu_client.get(
        "/api/v1/menu/categories",
        headers={"Authorization": "Bearer dev-token"}
    )

    # Assert
    assert response.status_code == 200
    data = response.json()["data"]
    assert len(data) == 1
    assert data[0]["name"] == "Appetizers"


def test_create_category(menu_client: TestClient) -> None:
    # Prepare mock service
    mock_menu_service = AsyncMock()
    mock_menu_service.create_category.return_value = MenuCategorySchema(
        id=uuid4(),
        restaurant_id=RESTAURANT_ID,
        name="Desserts",
        display_order=1,
        is_active=True,
        created_at="2026-06-05T00:00:00Z",
        updated_at="2026-06-05T00:00:00Z"
    )
    menu_client.app.dependency_overrides[get_menu_service] = lambda: mock_menu_service

    # Execute
    response = menu_client.post(
        "/api/v1/menu/categories",
        headers={"Authorization": "Bearer dev-token"},
        json={"name": "Desserts"}
    )

    # Assert
    assert response.status_code == 200
    assert response.json()["data"]["name"] == "Desserts"


def test_public_menu(menu_client: TestClient) -> None:
    # Prepare mock service
    mock_menu_service = AsyncMock()
    mock_menu_service.get_public_menu.return_value = {"categories": []}
    menu_client.app.dependency_overrides[get_menu_service] = lambda: mock_menu_service

    # Execute
    response = menu_client.get("/api/v1/public/menu")

    # Assert
    assert response.status_code == 200
    assert "categories" in response.json()["data"]
