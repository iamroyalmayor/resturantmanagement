"""Unit tests for MenuService."""

from uuid import UUID, uuid4
from datetime import datetime, timezone
from unittest.mock import AsyncMock, MagicMock

import pytest

from app.core.security import RequestContext
from app.core.enums import UserRole
from app.models.menu import MenuCategory, MenuItem
from app.services.menu_service import MenuService
from app.schemas.menu import MenuCategoryCreate, MenuItemCreate


@pytest.fixture
def mock_session():
    return AsyncMock()


@pytest.fixture
def menu_service(mock_session):
    return MenuService(mock_session)


@pytest.fixture
def admin_context():
    return RequestContext(
        firebase_uid="test-uid",
        user_id=uuid4(),
        restaurant_id=uuid4(),
        role=UserRole.ADMIN,
        permissions=frozenset(),
        correlation_id="test-id",
        email="test@test.com"
    )


@pytest.mark.asyncio
async def test_create_category(menu_service, admin_context, mock_session):
    data = MenuCategoryCreate(name="Appetizers")
    
    mock_cat = MenuCategory(
        id=uuid4(),
        restaurant_id=admin_context.restaurant_id,
        name=data.name,
        display_order=0,
        is_active=True,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc)
    )
    
    # Mock the repo's create_category
    menu_service._repo.create_category = AsyncMock(return_value=mock_cat)
    
    result = await menu_service.create_category(admin_context, data)
    assert result.name == "Appetizers"
    assert isinstance(result.id, UUID)


@pytest.mark.asyncio
async def test_create_item(menu_service, admin_context, mock_session):
    cat_id = uuid4()
    data = MenuItemCreate(name="Spring Rolls", description="Crispy", price=12.5, category_id=cat_id)
    
    mock_item = MenuItem(
        id=uuid4(),
        restaurant_id=admin_context.restaurant_id,
        category_id=cat_id,
        name=data.name,
        description=data.description,
        price=data.price,
        cost=0.0,
        preparation_time=15,
        is_available=True,
        is_popular=False,
        is_featured=False,
        ingredients=[],
        allergens=[],
        dietary_tags=[],
        nutritional_info={},
        display_order=0,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc)
    )
    
    menu_service._repo.get_category = AsyncMock(return_value=MenuCategory(id=cat_id))
    menu_service._repo.create_item = AsyncMock(return_value=mock_item)
    
    result = await menu_service.create_item(admin_context, data)
    assert result.name == "Spring Rolls"
    assert result.price == 12.5
    assert result.cost == 0.0
