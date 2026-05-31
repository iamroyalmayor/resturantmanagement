"""API tests for P1 identity and access endpoints (dependency overrides)."""

from datetime import datetime, timezone
from uuid import UUID, uuid4
from unittest.mock import AsyncMock

import pytest
from fastapi.testclient import TestClient

from app.api.deps import get_auth_service, get_request_context, get_user_service
from app.core.config import get_settings
from app.core.enums import ModulePermission, UserRole
from app.core.security import RequestContext
from app.main import create_app
from app.schemas.auth import SessionResponse, UserProfileSchema
from app.schemas.settings import OperatingHourSchema, RestaurantSettingsResponse
from app.schemas.user import UserListResponse, UserResponse

RESTAURANT_ID = UUID("11111111-1111-1111-1111-111111111111")
USER_ID = UUID("22222222-2222-2222-2222-222222222222")
NOW = datetime.now(timezone.utc)


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


def _session_response() -> SessionResponse:
    return SessionResponse(
        user=UserProfileSchema(
            id=USER_ID,
            restaurant_id=RESTAURANT_ID,
            email="admin@test.com",
            name="Admin User",
            phone=None,
            avatar_url=None,
            role=UserRole.ADMIN,
            is_active=True,
            firebase_uid="firebase-admin",
            created_at=NOW,
            updated_at=NOW,
        ),
        restaurant_id=RESTAURANT_ID,
        role=UserRole.ADMIN,
        permissions=list(ModulePermission),
    )


@pytest.fixture
def auth_client() -> TestClient:
    import os

    from app.services.firebase_service import clear_firebase_service_cache

    os.environ["FIREBASE_ENABLED"] = "false"
    os.environ["DEV_AUTH_ENABLED"] = "true"
    get_settings.cache_clear()
    clear_firebase_service_cache()
    settings = get_settings()
    app = create_app(settings)

    mock_auth = AsyncMock()
    mock_auth.create_session.return_value = _session_response()
    mock_auth.get_session_for_user.return_value = _session_response()
    mock_auth.build_request_context.return_value = _admin_context()

    mock_user_service = AsyncMock()
    mock_user_service.get_me.return_value = UserResponse(
        id=USER_ID,
        restaurant_id=RESTAURANT_ID,
        email="admin@test.com",
        name="Admin User",
        phone=None,
        avatar_url=None,
        role=UserRole.ADMIN,
        is_active=True,
        created_at=NOW,
        updated_at=NOW,
    )
    mock_user_service.list_staff.return_value = UserListResponse(items=[], total=0)
    mock_user_service.get_by_id.return_value = mock_user_service.get_me.return_value

    async def override_context() -> RequestContext:
        return _admin_context()

    app.dependency_overrides[get_auth_service] = lambda: mock_auth
    app.dependency_overrides[get_request_context] = override_context
    app.dependency_overrides[get_user_service] = lambda: mock_user_service

    with TestClient(app) as client:
        yield client

    app.dependency_overrides.clear()
    get_settings.cache_clear()


def test_post_auth_session(auth_client: TestClient) -> None:
    response = auth_client.post(
        "/api/v1/auth/session",
        headers={"Authorization": "Bearer dev-local-token"},
        json={"name": "Admin"},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["data"]["role"] == "admin"
    assert body["data"]["user"]["email"] == "admin@test.com"
    assert "settings" in body["data"]["permissions"]


def test_get_auth_me(auth_client: TestClient) -> None:
    response = auth_client.get(
        "/api/v1/auth/me",
        headers={"Authorization": "Bearer dev-local-token"},
    )
    assert response.status_code == 200
    assert response.json()["data"]["user"]["id"] == str(USER_ID)


def test_get_users_me(auth_client: TestClient) -> None:
    response = auth_client.get(
        "/api/v1/users/me",
        headers={"Authorization": "Bearer dev-local-token"},
    )
    assert response.status_code == 200
    assert response.json()["data"]["email"] == "admin@test.com"


def test_list_users(auth_client: TestClient) -> None:
    response = auth_client.get(
        "/api/v1/users",
        headers={"Authorization": "Bearer dev-local-token"},
    )
    assert response.status_code == 200
    assert response.json()["data"]["total"] == 0


def test_get_settings(auth_client: TestClient) -> None:
    from app.api.deps import get_settings_service

    app = auth_client.app
    mock_settings_service = AsyncMock()
    mock_settings_service.get_settings.return_value = RestaurantSettingsResponse(
        id=RESTAURANT_ID,
        name="RestaurantOS",
        email="info@test.com",
        phone=None,
        address=None,
        timezone="UTC",
        currency_code="NGN",
        tax_rate="0.085",
        service_charge_rate="0.18",
        whatsapp_number=None,
        operating_hours=[
            OperatingHourSchema(day_of_week=0, open_time=None, close_time=None, is_closed=False)
        ],
    )
    app.dependency_overrides[get_settings_service] = lambda: mock_settings_service

    response = auth_client.get(
        "/api/v1/settings",
        headers={"Authorization": "Bearer dev-local-token"},
    )
    assert response.status_code == 200
    assert response.json()["data"]["name"] == "RestaurantOS"
