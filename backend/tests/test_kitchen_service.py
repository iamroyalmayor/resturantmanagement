"""Unit tests for KitchenService."""

import datetime
from uuid import uuid4
from decimal import Decimal
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from app.core.security import RequestContext
from app.core.enums import UserRole
from app.models.order import Order, OrderItem, OrderStatus, ItemStatus, OrderSource, OrderType
from app.services.kitchen_service import KitchenService
from app.schemas.kitchen import KitchenItemStatusUpdate, KitchenOrderAction


@pytest.fixture
def mock_session():
    return AsyncMock()


@pytest.fixture
def kitchen_service(mock_session):
    return KitchenService(mock_session)


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
async def test_get_queue_ordering(kitchen_service, admin_context, mock_session):
    # Use real Order objects
    order1 = Order(
        id=uuid4(),
        restaurant_id=admin_context.restaurant_id,
        order_number="ORD-1",
        status=OrderStatus.CONFIRMED,
        source=OrderSource.POS,
        order_type=OrderType.DINE_IN,
        subtotal=Decimal("10.00"),
        tax_amount=Decimal("1.00"),
        total_amount=Decimal("11.00"),
        items=[],
        created_at=datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(minutes=10)
    )
    
    order2 = Order(
        id=uuid4(),
        restaurant_id=admin_context.restaurant_id,
        order_number="ORD-2",
        status=OrderStatus.CONFIRMED,
        source=OrderSource.POS,
        order_type=OrderType.DINE_IN,
        subtotal=Decimal("10.00"),
        tax_amount=Decimal("1.00"),
        total_amount=Decimal("11.00"),
        items=[],
        created_at=datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(minutes=5)
    )
    
    mock_result = MagicMock()
    mock_result.scalars().all.return_value = [order1, order2]
    mock_session.execute.return_value = mock_result
    
    queue = await kitchen_service.get_queue(admin_context)
    assert len(queue) == 2


@pytest.mark.asyncio
@patch("app.services.kitchen_service.manager.broadcast_to_restaurant")
async def test_update_item_ready(mock_broadcast, kitchen_service, admin_context, mock_session):
    item_id = uuid4()
    order_id = uuid4()
    
    mock_order = Order(
        id=order_id,
        restaurant_id=admin_context.restaurant_id,
        order_number="ORD-1",
        status=OrderStatus.PREPARING,
        source=OrderSource.POS,
        order_type=OrderType.DINE_IN,
        subtotal=Decimal("10.00"),
        tax_amount=Decimal("1.00"),
        total_amount=Decimal("11.00"),
        items=[],
        created_at=datetime.datetime.now(datetime.timezone.utc)
    )
    
    mock_item = OrderItem(
        id=item_id,
        order_id=order_id,
        status=ItemStatus.PREPARING,
        item_name_snapshot="Burger",
        unit_price_snapshot=Decimal("10.00"),
        quantity=1,
        total_price=Decimal("10.00"),
        created_at=datetime.datetime.now(datetime.timezone.utc),
        order=mock_order
    )
    
    # Mock item lookup then order reload
    mock_item_res = MagicMock()
    mock_item_res.scalar_one_or_none.return_value = mock_item
    
    mock_order_res = MagicMock()
    mock_order_res.scalar_one_or_none.return_value = mock_order
    
    mock_session.execute.side_effect = [mock_item_res, mock_order_res]
    
    # Action: Mark Ready
    result = await kitchen_service.update_item_status(
        admin_context, item_id, KitchenItemStatusUpdate(new_status=ItemStatus.READY)
    )
    
    assert mock_item.status == ItemStatus.READY
    assert mock_item.ready_at is not None
    mock_broadcast.assert_called_with(
        admin_context.restaurant_id, "kitchen.queue.updated", {"item_id": str(item_id), "new_status": ItemStatus.READY}
    )


@pytest.mark.asyncio
@patch("app.services.kitchen_service.manager.broadcast_to_restaurant")
async def test_order_prep_start(mock_broadcast, kitchen_service, admin_context, mock_session):
    order_id = uuid4()
    item_id = uuid4()
    
    mock_item = OrderItem(
        id=item_id,
        status=ItemStatus.PENDING,
        item_name_snapshot="Burger",
        unit_price_snapshot=Decimal("10.00"),
        quantity=1,
        total_price=Decimal("10.00"),
        created_at=datetime.datetime.now(datetime.timezone.utc)
    )
    
    mock_order = Order(
        id=order_id,
        restaurant_id=admin_context.restaurant_id,
        order_number="ORD-1",
        status=OrderStatus.CONFIRMED,
        source=OrderSource.POS,
        order_type=OrderType.DINE_IN,
        subtotal=Decimal("10.00"),
        tax_amount=Decimal("1.00"),
        total_amount=Decimal("11.00"),
        items=[mock_item],
        status_history=[],
        created_at=datetime.datetime.now(datetime.timezone.utc)
    )
    
    kitchen_service._repo.get_by_id = AsyncMock(return_value=mock_order)
    
    # Action: Start Prep
    await kitchen_service.handle_order_action(
        admin_context, order_id, KitchenOrderAction(action="start_prep")
    )
    
    assert mock_order.status == OrderStatus.PREPARING
    assert mock_order.preparing_at is not None
    assert mock_item.status == ItemStatus.PREPARING
    assert mock_item.preparing_at is not None
    
    # Verify events
    # 1. order.preparing
    # 2. kitchen.queue.updated
    assert mock_broadcast.call_count == 2
