"""Unit tests for TableService."""

from uuid import UUID, uuid4
from datetime import datetime, timezone
from unittest.mock import AsyncMock, MagicMock

import pytest

from app.core.security import RequestContext
from app.core.enums import UserRole
from app.models.table import Table, TableStatus, TableShape
from app.services.table_service import TableService
from app.schemas.table import TableCreate


@pytest.fixture
def mock_session():
    return AsyncMock()


@pytest.fixture
def table_service(mock_session):
    return TableService(mock_session)


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
async def test_create_table(table_service, admin_context, mock_session):
    data = TableCreate(number=10, capacity=4)
    
    mock_table = Table(
        id=uuid4(),
        restaurant_id=admin_context.restaurant_id,
        number=data.number,
        capacity=data.capacity,
        status=TableStatus.AVAILABLE,
        shape=TableShape.SQUARE,
        is_active=True,
        qr_token="secure-token",
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc)
    )
    
    table_service._repo.get_by_number = AsyncMock(return_value=None)
    table_service._repo.create = AsyncMock(return_value=mock_table)
    
    result = await table_service.create_table(admin_context, data)
    assert result.number == 10
    assert result.qr_token == "secure-token"


@pytest.mark.asyncio
async def test_regenerate_qr_token(table_service, admin_context, mock_session):
    table_id = uuid4()
    mock_table = Table(
        id=table_id,
        restaurant_id=admin_context.restaurant_id,
        number=1,
        capacity=2,
        status=TableStatus.AVAILABLE,
        shape=TableShape.SQUARE,
        is_active=True,
        qr_token="old-token",
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc)
    )
    
    table_service._repo.get_by_id = AsyncMock(return_value=mock_table)
    
    result = await table_service.regenerate_qr_token(admin_context, table_id)
    assert result.qr_token != "old-token"
    assert len(result.qr_token) > 10


@pytest.mark.asyncio
async def test_resolve_table_context(table_service, mock_session):
    restaurant_id = uuid4()
    mock_table = Table(
        restaurant_id=restaurant_id,
        number=5,
        capacity=2,
        status=TableStatus.AVAILABLE,
        shape=TableShape.SQUARE,
        is_active=True,
        qr_token="token123"
    )
    
    # We also need to mock the restaurant lookup
    mock_restaurant = MagicMock()
    mock_restaurant.id = restaurant_id
    mock_restaurant.name = "Test Bistro"
    
    table_service._repo.get_by_qr_token = AsyncMock(return_value=mock_table)
    table_service._restaurants.get_by_id = AsyncMock(return_value=mock_restaurant)
    
    result = await table_service.resolve_table_context("token123")
    assert result.restaurant.name == "Test Bistro"
    assert result.table.number == 5
