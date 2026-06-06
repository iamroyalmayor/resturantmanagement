"""Unit tests for InventoryService."""

from uuid import uuid4
from decimal import Decimal
from unittest.mock import AsyncMock, MagicMock
from datetime import datetime, timezone

import pytest

from app.core.security import RequestContext
from app.core.enums import UserRole
from app.models.inventory import InventoryItem, StockMovement, MovementType, RecipeIngredient
from app.services.inventory_service import InventoryService
from app.schemas.inventory import InventoryItemCreate, StockAdjustmentRequest, RecipeIngredientCreate


@pytest.fixture
def mock_session():
    return AsyncMock()


@pytest.fixture
def inventory_service(mock_session):
    return InventoryService(mock_session)


@pytest.fixture
def staff_context():
    return RequestContext(
        firebase_uid="staff-uid",
        user_id=uuid4(),
        restaurant_id=uuid4(),
        role=UserRole.MANAGER,
        permissions=frozenset(),
        correlation_id="test-id",
        email="staff@test.com"
    )


@pytest.mark.asyncio
async def test_create_inventory_item(inventory_service, staff_context, mock_session):
    data = InventoryItemCreate(
        name="Flour",
        unit="kg",
        initial_stock=Decimal("10.5"),
        reorder_level=Decimal("5.0"),
        cost_per_unit=Decimal("1.2")
    )
    
    # Mock repo create
    item_id = uuid4()
    def side_effect(item):
        item.id = item_id
        return item
        
    inventory_service._repo.create_item = AsyncMock(side_effect=side_effect)
    inventory_service._repo.add_movement = AsyncMock()
    
    # Mock timestamps for schema validation
    item_res = InventoryItem(
        id=item_id,
        restaurant_id=staff_context.restaurant_id,
        name="Flour",
        unit="kg",
        current_stock=Decimal("10.5"),
        reorder_level=Decimal("5.0"),
        cost_per_unit=Decimal("1.2"),
        is_active=True,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc)
    )
    inventory_service._repo.create_item = AsyncMock(return_value=item_res)

    result = await inventory_service.create_item(staff_context, data)
    
    assert result.name == "Flour"
    assert result.current_stock == Decimal("10.5")
    # Verify initial movement was recorded
    assert inventory_service._repo.add_movement.called
    movement = inventory_service._repo.add_movement.call_args[0][0]
    assert movement.type == MovementType.IN
    assert movement.quantity == Decimal("10.5")


@pytest.mark.asyncio
async def test_stock_adjustment_waste(inventory_service, staff_context, mock_session):
    item_id = uuid4()
    mock_item = InventoryItem(
        id=item_id,
        restaurant_id=staff_context.restaurant_id,
        name="Milk",
        unit="liters",
        current_stock=Decimal("20.0"),
        reorder_level=Decimal("5.0"),
        cost_per_unit=Decimal("1.0"),
        is_active=True,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc)
    )
    
    inventory_service._repo.get_item = AsyncMock(return_value=mock_item)
    inventory_service._repo.add_movement = AsyncMock()
    
    # Action: record 2L waste
    adj_data = StockAdjustmentRequest(
        quantity=Decimal("2.0"),
        type=MovementType.WASTE,
        reason="Spilled"
    )
    
    result = await inventory_service.adjust_stock(staff_context, item_id, adj_data)
    
    assert result.current_stock == Decimal("18.0")
    movement = inventory_service._repo.add_movement.call_args[0][0]
    assert movement.type == MovementType.WASTE
    assert movement.quantity == Decimal("2.0")


@pytest.mark.asyncio
async def test_recipe_ingredient_creation(inventory_service, staff_context, mock_session):
    menu_item_id = uuid4()
    inventory_item_id = uuid4()
    
    mock_item = InventoryItem(id=inventory_item_id, name="Sugar")
    inventory_service._repo.get_item = AsyncMock(return_value=mock_item)
    
    ingredient_id = uuid4()
    def side_effect(ing):
        ing.id = ingredient_id
        return ing
    inventory_service._repo.add_recipe_ingredient = AsyncMock(side_effect=side_effect)
    
    data = RecipeIngredientCreate(
        menu_item_id=menu_item_id,
        inventory_item_id=inventory_item_id,
        quantity_required=Decimal("0.5")
    )
    
    result = await inventory_service.add_recipe_ingredient(staff_context, data)
    
    assert result.menu_item_id == menu_item_id
    assert result.quantity_required == Decimal("0.5")
