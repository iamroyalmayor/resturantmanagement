"""Service for Kitchen management and real-time operational workflows."""

import datetime
from typing import List, Optional
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_
from sqlalchemy.orm import selectinload

from app.core.exceptions import NotFoundError, ValidationAppError
from app.core.security import RequestContext
from app.models.order import Order, OrderItem, OrderStatus, ItemStatus
from app.repositories.order_repository import OrderRepository
from app.schemas.kitchen import (
    KitchenOrderSchema, KitchenItemSchema, 
    KitchenItemStatusUpdate, KitchenOrderAction
)
from app.core.websockets import manager


class KitchenService:
    def __init__(self, session: AsyncSession) -> None:
        self._repo = OrderRepository(session)
        self._session = session

    async def get_queue(self, context: RequestContext) -> List[KitchenOrderSchema]:
        """
        Fetch active orders for the kitchen.
        Active = CONFIRMED, PREPARING, READY.
        PENDING orders are shown if they don't require manual confirmation (config dependent),
        but here we follow the standard: CONFIRMED start the kitchen flow.
        """
        stmt = (
            select(Order)
            .where(
                and_(
                    Order.restaurant_id == context.restaurant_id,
                    Order.status.in_([
                        OrderStatus.CONFIRMED, 
                        OrderStatus.PREPARING, 
                        OrderStatus.READY
                    ])
                )
            )
            .order_by(Order.created_at.asc()) # FIFO
            .options(
                selectinload(Order.items).selectinload(OrderItem.modifiers)
            )
        )
        result = await self._session.execute(stmt)
        orders = result.scalars().all()
        return [KitchenOrderSchema.model_validate(o) for o in orders]

    async def update_item_status(
        self, context: RequestContext, item_id: UUID, data: KitchenItemStatusUpdate
    ) -> KitchenOrderSchema:
        """
        Updates an individual item's status (e.g. Burger is Ready).
        Sets preparation timestamps at item level.
        """
        # We need to find the item and its order
        stmt = (
            select(OrderItem)
            .where(OrderItem.id == item_id)
            .options(selectinload(OrderItem.order))
        )
        result = await self._session.execute(stmt)
        item = result.scalar_one_or_none()
        
        if not item or item.order.restaurant_id != context.restaurant_id:
            raise NotFoundError(message="Order item not found")

        now = datetime.datetime.now(datetime.timezone.utc)
        old_status = item.status
        item.status = data.new_status

        if data.new_status == ItemStatus.PREPARING:
            item.preparing_at = now
        elif data.new_status == ItemStatus.READY:
            item.ready_at = now
        elif data.new_status == ItemStatus.SERVED:
            item.served_at = now

        await self._session.flush()
        
        # Broadcast update
        await manager.broadcast_to_restaurant(
            context.restaurant_id, 
            "kitchen.queue.updated", 
            {"item_id": str(item_id), "new_status": data.new_status}
        )
        
        # Reload full order for return
        return await self._get_kitchen_order(context.restaurant_id, item.order_id)

    async def handle_order_action(
        self, context: RequestContext, order_id: UUID, action_data: KitchenOrderAction
    ) -> KitchenOrderSchema:
        """
        State machine actions for orders in the kitchen.
        """
        order = await self._repo.get_by_id(context.restaurant_id, order_id)
        if not order:
            raise NotFoundError(message="Order not found")

        now = datetime.datetime.now(datetime.timezone.utc)
        action = action_data.action
        event_type = f"order.{action}" # Map to documented events

        if action == "confirm":
            self._validate_transition(order.status, OrderStatus.CONFIRMED)
            order.status = OrderStatus.CONFIRMED
            order.confirmed_at = now
            event_type = "order.confirmed"
        elif action == "start_prep":
            self._validate_transition(order.status, OrderStatus.PREPARING)
            order.status = OrderStatus.PREPARING
            order.preparing_at = now
            # Automatically start prep for all items if they are pending
            for item in order.items:
                if item.status == ItemStatus.PENDING:
                    item.status = ItemStatus.PREPARING
                    item.preparing_at = now
            event_type = "order.preparing"
        elif action == "mark_ready":
            self._validate_transition(order.status, OrderStatus.READY)
            order.status = OrderStatus.READY
            order.ready_at = now
            # All items ready
            for item in order.items:
                if item.status in [ItemStatus.PENDING, ItemStatus.PREPARING]:
                    item.status = ItemStatus.READY
                    item.ready_at = now
            event_type = "order.ready"
        elif action == "complete":
            self._validate_transition(order.status, OrderStatus.COMPLETED)
            order.status = OrderStatus.COMPLETED
            order.completed_at = now
            event_type = "order.completed"
        else:
            raise ValidationAppError(message=f"Unknown kitchen action: {action}")

        await self._session.flush()
        
        # Broadcast specialized event
        await manager.broadcast_to_restaurant(
            context.restaurant_id, 
            event_type, 
            {"order_id": str(order_id), "order_number": order.order_number}
        )
        
        # Broadcast general queue update
        await manager.broadcast_to_restaurant(
            context.restaurant_id, "kitchen.queue.updated", {}
        )

        return KitchenOrderSchema.model_validate(order)

    async def _get_kitchen_order(self, restaurant_id: UUID, order_id: UUID) -> KitchenOrderSchema:
        stmt = (
            select(Order)
            .where(and_(Order.restaurant_id == restaurant_id, Order.id == order_id))
            .options(selectinload(Order.items).selectinload(OrderItem.modifiers))
        )
        result = await self._session.execute(stmt)
        order = result.scalar_one_or_none()
        if not order:
            raise NotFoundError(message="Order not found")
        return KitchenOrderSchema.model_validate(order)

    def _validate_transition(self, current: OrderStatus, target: OrderStatus) -> None:
        """Enforce kitchen lifecycle."""
        # Reuse logic from OrderService if possible, or define here for kitchen specifically
        allowed = {
            OrderStatus.PENDING: {OrderStatus.CONFIRMED, OrderStatus.CANCELLED},
            OrderStatus.CONFIRMED: {OrderStatus.PREPARING, OrderStatus.CANCELLED},
            OrderStatus.PREPARING: {OrderStatus.READY, OrderStatus.CANCELLED},
            OrderStatus.READY: {OrderStatus.COMPLETED, OrderStatus.CANCELLED},
            OrderStatus.COMPLETED: set(),
            OrderStatus.CANCELLED: set(),
        }
        if target not in allowed.get(current, set()):
            raise ValidationAppError(message=f"Kitchen: Invalid transition from {current} to {target}")
