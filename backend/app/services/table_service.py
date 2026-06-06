"""Business logic for Tables and QR Ordering."""

import secrets
from typing import List, Optional
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.enums import ModulePermission, UserRole
from app.core.exceptions import NotFoundError, AuthorizationError
from app.core.security import RequestContext
from app.models.table import Table, TableStatus
from app.repositories.table_repository import TableRepository
from app.repositories.restaurant_repository import RestaurantRepository
from app.schemas.table import (
    TableCreate, TableUpdate, TableSchema,
    PublicTableContextResponse, RestaurantPublicSchema, TablePublicSchema
)


class TableService:
    def __init__(self, session: AsyncSession) -> None:
        self._repo = TableRepository(session)
        self._restaurants = RestaurantRepository(session)

    # --- Admin Operations ---

    async def create_table(self, context: RequestContext, data: TableCreate) -> TableSchema:
        self._require_table_management(context)
        
        # Check if table number already exists
        existing = await self._repo.get_by_number(context.restaurant_id, data.number)
        if existing:
            raise AuthorizationError(message=f"Table number {data.number} already exists")

        table = Table(
            restaurant_id=context.restaurant_id,
            qr_token=secrets.token_urlsafe(16),
            **data.model_dump()
        )
        table = await self._repo.create(table)
        return TableSchema.model_validate(table)

    async def update_table(self, context: RequestContext, table_id: UUID, data: TableUpdate) -> TableSchema:
        self._require_table_management(context)
        
        table = await self._repo.get_by_id(context.restaurant_id, table_id)
        if not table:
            raise NotFoundError(message="Table not found")

        update_data = data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(table, field, value)
            
        await self._repo.session.flush()
        return TableSchema.model_validate(table)

    async def list_tables(self, context: RequestContext, active_only: bool = False) -> List[TableSchema]:
        # Waiters/Staff can list tables too
        tables = await self._repo.list_tables(context.restaurant_id, active_only=active_only)
        return [TableSchema.model_validate(t) for t in tables]

    async def regenerate_qr_token(self, context: RequestContext, table_id: UUID) -> TableSchema:
        self._require_table_management(context)
        
        table = await self._repo.get_by_id(context.restaurant_id, table_id)
        if not table:
            raise NotFoundError(message="Table not found")
            
        table.qr_token = secrets.token_urlsafe(16)
        await self._repo.session.flush()
        return TableSchema.model_validate(table)

    async def delete_table(self, context: RequestContext, table_id: UUID) -> None:
        self._require_table_management(context)
        
        table = await self._repo.get_by_id(context.restaurant_id, table_id)
        if not table:
            raise NotFoundError(message="Table not found")
            
        await self._repo.delete(table)

    # --- Public Operations ---

    async def resolve_table_context(self, token: str) -> PublicTableContextResponse:
        """Resolves the context (restaurant + table) from a secure QR token."""
        table = await self._repo.get_by_qr_token(token)
        if not table or not table.is_active:
            raise NotFoundError(message="Invalid or inactive QR code")
            
        restaurant = await self._restaurants.get_by_id(table.restaurant_id)
        if not restaurant:
            raise NotFoundError(message="Restaurant not found")

        return PublicTableContextResponse(
            restaurant=RestaurantPublicSchema(
                id=restaurant.id,
                name=restaurant.name
            ),
            table=TablePublicSchema(
                number=table.number,
                capacity=table.capacity,
                location=table.location
            ),
            is_ordering_available=table.status == TableStatus.AVAILABLE
        )

    def _require_table_management(self, context: RequestContext) -> None:
        if context.role in (UserRole.ADMIN, UserRole.MANAGER):
            return
        # Assuming P2 adds a TABLES permission, but using MENU for now as a fallback if not defined
        context.require_permission(ModulePermission.MENU)
