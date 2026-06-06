"""Integration tests for Order API endpoints."""

from uuid import uuid4
from decimal import Decimal
from typing import Generator
from unittest.mock import AsyncMock

import pytest
from fastapi.testclient import TestClient

from app.api.deps import get_auth_service, get_request_context, get_order_service
from app.core.enums import ModulePermission, UserRole
from app.core.security import RequestContext
from app.main import create_app
from app.schemas.order import OrderSchema, OrderStatus, OrderType, OrderSource
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
def order_client() -> Generator[TestClient, None, None]:
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


def test_list_orders(order_client: TestClient) -> None:
    mock_service = AsyncMock()
    mock_service.list_orders.return_value = [
        OrderSchema(
            id=uuid4(),
            restaurant_id=RESTAURANT_ID,
            order_number="ORD-231001-0001",
            status=OrderStatus.PENDING,
            source=OrderSource.POS,
            order_type=OrderType.DINE_IN,
            subtotal=Decimal("20.00"),
            tax_amount=Decimal("1.50"),
            discount_amount=Decimal("0.00"),
            service_charge=Decimal("2.00"),
            total_amount=Decimal("23.50"),
            items=[],
            status_history=[],
            created_at="2026-06-05T00:00:00Z",
            updated_at="2026-06-05T00:00:00Z"
        )
    ]
    order_client.app.dependency_overrides[get_order_service] = lambda: mock_service

    response = order_client.get("/api/v1/orders")
    assert response.status_code == 200
    assert len(response.json()["data"]) == 1


def test_place_public_order(order_client: TestClient) -> None:
    mock_service = AsyncMock()
    mock_service.place_order.return_value = OrderSchema(
        id=uuid4(),
        restaurant_id=RESTAURANT_ID,
        order_number="ORD-231001-0002",
        status=OrderStatus.PENDING,
        source=OrderSource.QR,
        order_type=OrderType.DINE_IN,
        subtotal=Decimal("10.00"),
        tax_amount=Decimal("0.75"),
        discount_amount=Decimal("0.00"),
        service_charge=Decimal("1.00"),
        total_amount=Decimal("11.75"),
        items=[],
        status_history=[],
        created_at="2026-06-05T00:00:00Z",
        updated_at="2026-06-05T00:00:00Z"
    )
    order_client.app.dependency_overrides[get_order_service] = lambda: mock_service

    payload = {
        "items": [{"menu_item_id": str(uuid4()), "quantity": 1}],
        "source": "qr",
        "order_type": "dine_in"
    }

    response = order_client.post("/api/v1/public/orders", json=payload)
    assert response.status_code == 200
    assert response.json()["data"]["order_number"] == "ORD-231001-0002"
