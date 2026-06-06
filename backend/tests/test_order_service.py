"""Unit tests for OrderService."""

from uuid import UUID, uuid4
from decimal import Decimal
from datetime import datetime, timezone
from unittest.mock import AsyncMock, MagicMock

import pytest

from app.core.security import RequestContext
from app.core.enums import UserRole
from app.models.order import Order, OrderStatus, OrderSource, OrderType
from app.models.menu import MenuItem, MenuModifierOption
from app.services.order_service import OrderService
from app.schemas.order import OrderCreate, OrderItemCreate, OrderStatusUpdate
from app.core.exceptions import ValidationAppError


@pytest.fixture
def mock_session():
    return AsyncMock()


@pytest.fixture
def order_service(mock_session):
    return OrderService(mock_session)


@pytest.fixture
def admin_context():
    return RequestContext(
        firebase_uid="admin-uid",
        user_id=uuid4(),
        restaurant_id=uuid4(),
        role=UserRole.ADMIN,
        permissions=frozenset(),
        correlation_id="test-id",
        email="admin@test.com"
    )


@pytest.mark.asyncio
async def test_place_order_snapshots(order_service, admin_context, mock_session):
    # Mock Menu Item
    menu_item_id = uuid4()
    mock_menu_item = MagicMock()
    mock_menu_item.id = menu_item_id
    mock_menu_item.name = "Burger"
    mock_menu_item.price = 10.0
    mock_menu_item.is_available = True
    mock_menu_item.modifiers = []

    order_service._menu.get_item = AsyncMock(return_value=mock_menu_item)
    order_service._repo.get_latest_order_number = AsyncMock(return_value=None)
    
    # Place Order
    data = OrderCreate(
        items=[OrderItemCreate(menu_item_id=menu_item_id, quantity=2)],
        source=OrderSource.POS,
        order_type=OrderType.DINE_IN
    )
    
    # Setup repo create to return a saved order with all fields
    def mock_create(order):
        order.id = uuid4()
        order.created_at = datetime.now(timezone.utc)
        order.updated_at = datetime.now(timezone.utc)
        # Ensure relationships are initialized for Pydantic
        order.status_history = []
        return order
    
    order_service._repo.create = AsyncMock(side_effect=mock_create)
    
    result = await order_service.place_order(admin_context, data)
    
    # Assertions
    assert result.items[0].item_name_snapshot == "Burger"
    assert result.items[0].unit_price_snapshot == Decimal("10.00")
    assert result.subtotal == Decimal("20.00")
    # Service charge 10% for DINE_IN = 2.0
    assert result.service_charge == Decimal("2.00")


@pytest.mark.asyncio
async def test_status_transition_enforcement(order_service, admin_context):
    order_id = uuid4()
    # Use real Order object to avoid MagicMock validation issues
    mock_order = Order(
        id=order_id,
        restaurant_id=admin_context.restaurant_id,
        order_number="ORD-TEST-001",
        status=OrderStatus.PENDING,
        source=OrderSource.POS,
        order_type=OrderType.DINE_IN,
        subtotal=Decimal("10.00"),
        tax_amount=Decimal("1.00"),
        discount_amount=Decimal("0.00"),
        service_charge=Decimal("0.00"),
        total_amount=Decimal("11.00"),
        items=[],
        status_history=[],
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc)
    )
    
    order_service._repo.get_by_id = AsyncMock(return_value=mock_order)
    order_service._repo.add_status_history = AsyncMock()
    
    # Valid transition
    await order_service.update_status(
        admin_context, order_id, OrderStatusUpdate(new_status=OrderStatus.CONFIRMED)
    )
    assert mock_order.status == OrderStatus.CONFIRMED
    
    # Invalid transition (Confirmed -> Ready, skipping Preparing)
    with pytest.raises(ValidationAppError):
        await order_service.update_status(
            admin_context, order_id, OrderStatusUpdate(new_status=OrderStatus.READY)
        )
