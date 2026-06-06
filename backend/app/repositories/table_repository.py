"""Repository for the Table domain."""

from typing import List, Optional, Sequence
from uuid import UUID

from sqlalchemy import select, and_
from sqlalchemy.orm import selectinload

from app.models.table import Table
from app.repositories.base import BaseRepository


class TableRepository(BaseRepository):
    """Repository for managing restaurant tables."""

    async def get_by_id(self, restaurant_id: UUID, table_id: UUID) -> Optional[Table]:
        stmt = select(Table).where(
            and_(Table.restaurant_id == restaurant_id, Table.id == table_id)
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_number(self, restaurant_id: UUID, number: int) -> Optional[Table]:
        stmt = select(Table).where(
            and_(Table.restaurant_id == restaurant_id, Table.number == number)
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_qr_token(self, token: str) -> Optional[Table]:
        """Resolves a table by its secure QR token (cross-restaurant lookup)."""
        stmt = select(Table).where(Table.qr_token == token).options(
            selectinload(Table.restaurant)  # Assuming relationship exists
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def list_tables(self, restaurant_id: UUID, active_only: bool = False) -> Sequence[Table]:
        filters = [Table.restaurant_id == restaurant_id]
        if active_only:
            filters.append(Table.is_active == True)
            
        stmt = select(Table).where(and_(*filters)).order_by(Table.number)
        result = await self.session.execute(stmt)
        return result.scalars().all()

    async def create(self, table: Table) -> Table:
        self.session.add(table)
        await self.session.flush()
        return table

    async def delete(self, table: Table) -> None:
        await self.session.delete(table)
        await self.session.flush()
