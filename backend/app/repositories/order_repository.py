"""Repository for the Order aggregate root."""

from typing import List, Optional, Sequence
from uuid import UUID

from sqlalchemy import select, and_
from sqlalchemy.orm import selectinload

from app.models.order import Order, OrderItem, OrderItemModifier, OrderStatusHistory
from app.repositories.base import BaseRepository


class OrderRepository(BaseRepository):
    """Repository for managing the Order aggregate."""

    async def get_by_id(self, restaurant_id: UUID, order_id: UUID) -> Optional[Order]:
        """Fetch a full order aggregate with all nested items and modifiers."""
        stmt = (
            select(Order)
            .where(and_(Order.restaurant_id == restaurant_id, Order.id == order_id))
            .options(
                selectinload(Order.items).selectinload(OrderItem.modifiers),
                selectinload(Order.status_history)
            )
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_number(self, restaurant_id: UUID, order_number: str) -> Optional[Order]:
        stmt = (
            select(Order)
            .where(and_(Order.restaurant_id == restaurant_id, Order.order_number == order_number))
            .options(
                selectinload(Order.items).selectinload(OrderItem.modifiers)
            )
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def list_orders(
        self, 
        restaurant_id: UUID, 
        status: Optional[str] = None,
        order_number: Optional[str] = None,
        table_id: Optional[UUID] = None,
        source: Optional[str] = None,
        limit: int = 50,
        offset: int = 0
    ) -> tuple[Sequence[Order], int]:
        filters = [Order.restaurant_id == restaurant_id]
        if status:
            filters.append(Order.status == status)
        if order_number:
            filters.append(Order.order_number.ilike(f"%{order_number}%"))
        if table_id:
            filters.append(Order.table_id == table_id)
        if source:
            filters.append(Order.source == source)
            
        # Count total matches
        from sqlalchemy import func
        count_stmt = select(func.count()).select_from(Order).where(and_(*filters))
        total_result = await self.session.execute(count_stmt)
        total_count = total_result.scalar_one()

        stmt = (
            select(Order)
            .where(and_(*filters))
            .order_by(Order.created_at.desc())
            .limit(limit)
            .offset(offset)
            .options(selectinload(Order.items))
        )
        result = await self.session.execute(stmt)
        return result.scalars().all(), total_count

    async def create(self, order: Order) -> Order:
        """Saves a new order aggregate."""
        self.session.add(order)
        await self.session.flush()
        return order

    async def add_status_history(self, history: OrderStatusHistory) -> None:
        self.session.add(history)
        await self.session.flush()
        
    async def get_latest_order_number(self, restaurant_id: UUID) -> Optional[str]:
        """Fetch the most recent order number to generate the next one."""
        stmt = (
            select(Order.order_number)
            .where(Order.restaurant_id == restaurant_id)
            .order_by(Order.created_at.desc())
            .limit(1)
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()
