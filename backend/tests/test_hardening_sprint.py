"""Tests for MVP Hardening Sprint features."""

import pytest
from decimal import Decimal
from uuid import uuid4
from unittest.mock import MagicMock, AsyncMock
from app.services.order_service import OrderService
from app.models.order import OrderStatus, OrderSource, OrderType
from app.schemas.order import OrderCreate, OrderItemCreate


@pytest.mark.asyncio
async def test_order_variant_pricing():
    # Setup mock items and variants
    mock_session = MagicMock()
    item_id = uuid4()
    variant_id = uuid4()
    
    mock_variant = MagicMock()
    mock_variant.id = variant_id
    mock_variant.name = "Large"
    mock_variant.price = Decimal("15.00")
    
    mock_item = MagicMock()
    mock_item.id = item_id
    mock_item.name = "Pizza"
    mock_item.price = Decimal("10.00")
    mock_item.is_available = True
    mock_item.variants = [mock_variant]
    mock_item.modifiers = []
    
    order_service = OrderService(mock_session)
    order_service._menu.get_item = AsyncMock(return_value=mock_item)
    
    # Action: Preview Order with Variant
    data = OrderCreate(
        items=[OrderItemCreate(menu_item_id=item_id, variant_id=variant_id, quantity=1)],
        order_type=OrderType.TAKEAWAY
    )
    
    preview = await order_service.preview_order(uuid4(), data)
    
    # Result: Should use variant price (15.00) not base price (10.00)
    assert preview["subtotal"] == Decimal("15.00")
    assert preview["total_amount"] == (Decimal("15.00") * Decimal("1.075")).quantize(Decimal("0.01"))


@pytest.mark.asyncio
async def test_order_search_logic():
    # Mock repository list_orders return
    mock_session = MagicMock()
    repo_mock = AsyncMock()
    repo_mock.list_orders.return_value = ([], 0)
    
    order_service = OrderService(mock_session)
    order_service._repo = repo_mock
    
    context = MagicMock()
    context.restaurant_id = uuid4()
    
    await order_service.list_orders(context, order_number="ORD-123", limit=10)
    
    # Verify repository was called with the filter
    repo_mock.list_orders.assert_called_once()
    args, kwargs = repo_mock.list_orders.call_args
    assert kwargs["order_number"] == "ORD-123"
    assert kwargs["limit"] == 10
