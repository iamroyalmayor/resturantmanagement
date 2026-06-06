"""Business logic for the Orders Domain."""

import datetime
import secrets
from typing import List, Optional, Set
from uuid import UUID
from decimal import Decimal

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundError, AuthorizationError, ValidationAppError
from app.core.security import RequestContext
from app.models.order import (
    Order, OrderItem, OrderItemModifier, OrderStatus, 
    OrderStatusHistory, ItemStatus, OrderSource, OrderType
)
from app.models.menu import MenuItem, MenuModifierOption
from app.models.table import Table
from app.repositories.order_repository import OrderRepository
from app.repositories.menu_repository import MenuRepository
from app.repositories.table_repository import TableRepository
from app.schemas.order import OrderCreate, OrderSchema, OrderStatusUpdate


class OrderService:
    def __init__(self, session: AsyncSession) -> None:
        self._repo = OrderRepository(session)
        self._menu = MenuRepository(session)
        self._tables = TableRepository(session)

    # --- Order Placement ---

    async def place_order(self, context: RequestContext, data: OrderCreate) -> OrderSchema:
        """
        Creates a new order aggregate with immutable pricing and name snapshots.
        Supports MenuVariants and OrderItemModifiers.
        """
        # Validate table if provided
        table_name = None
        if data.table_id:
            table = await self._tables.get_by_id(context.restaurant_id, data.table_id)
            if not table:
                raise NotFoundError(message="Table not found")
            table_name = f"Table {table.number}"

        # 1. Resolve all menu items, variants, and modifiers to take snapshots
        order_items: List[OrderItem] = []
        total_subtotal = Decimal("0.00")

        for item_data in data.items:
            menu_item = await self._menu.get_item(context.restaurant_id, item_data.menu_item_id)
            if not menu_item or not menu_item.is_available:
                raise ValidationAppError(message=f"Item {item_data.menu_item_id} is unavailable")

            # Resolve variant if provided
            variant_name = None
            base_price = Decimal(str(menu_item.price))
            
            if item_data.variant_id:
                variant = next((v for v in menu_item.variants if v.id == item_data.variant_id), None)
                if not variant:
                    raise ValidationAppError(message=f"Variant {item_data.variant_id} not found for item {menu_item.name}")
                variant_name = variant.name
                base_price = Decimal(str(variant.price))

            # Resolve modifiers
            item_modifiers: List[OrderItemModifier] = []
            item_modifier_total = Decimal("0.00")
            
            # Map modifier IDs for faster lookup
            available_options = {opt.id: opt for mod in menu_item.modifiers for opt in mod.options}
            
            for mod_data in item_data.modifiers:
                if mod_data.modifier_option_id not in available_options:
                    raise ValidationAppError(message=f"Modifier {mod_data.modifier_option_id} not valid for item {menu_item.name}")
                
                option = available_options[mod_data.modifier_option_id]
                item_modifiers.append(
                    OrderItemModifier(
                        modifier_option_id=option.id,
                        modifier_name_snapshot=option.name,
                        price_snapshot=Decimal(str(option.price))
                    )
                )
                item_modifier_total += Decimal(str(option.price))

            unit_price = base_price + item_modifier_total
            item_total = unit_price * item_data.quantity
            total_subtotal += item_total

            order_items.append(
                OrderItem(
                    menu_item_id=menu_item.id,
                    variant_id=item_data.variant_id,
                    item_name_snapshot=menu_item.name,
                    variant_name_snapshot=variant_name,
                    unit_price_snapshot=unit_price,
                    quantity=item_data.quantity,
                    total_price=item_total,
                    special_instructions=item_data.special_instructions,
                    status=ItemStatus.PENDING,
                    modifiers=item_modifiers
                )
            )

        # 2. Financial Calculations
        financials = self._calculate_financials(total_subtotal, data.order_type)

        # 3. Generate Order Number
        order_number = await self._generate_order_number(context.restaurant_id)

        # 4. Create Order Aggregate
        order = Order(
            restaurant_id=context.restaurant_id,
            order_number=order_number,
            table_id=data.table_id,
            customer_id=data.customer_id,
            status=OrderStatus.PENDING,
            source=data.source,
            order_type=data.order_type,
            table_name_snapshot=table_name,
            subtotal=total_subtotal,
            tax_amount=financials["tax_amount"],
            discount_amount=Decimal("0.00"),
            service_charge=financials["service_charge"],
            total_amount=financials["total_amount"],
            notes=data.notes,
            items=order_items
        )
        
        # Ensure IDs for schema validation if not already set (e.g. in unit tests)
        if not order.id:
            from uuid import uuid4
            order.id = uuid4()
            for item in order.items:
                item.id = uuid4()
                for mod in item.modifiers:
                    mod.id = uuid4()

        # Initial History
        order.status_history.append(
            OrderStatusHistory(
                new_status=OrderStatus.PENDING,
                actor_id=context.user_id,
                event_type="order_placed",
                notes="Initial order placement"
            )
        )

        order = await self._repo.create(order)
        return OrderSchema.model_validate(order)

    async def preview_order(self, restaurant_id: UUID, data: OrderCreate) -> dict:
        """
        Calculates totals for a proposed order without persisting it.
        """
        total_subtotal = Decimal("0.00")

        for item_data in data.items:
            menu_item = await self._menu.get_item(restaurant_id, item_data.menu_item_id)
            if not menu_item or not menu_item.is_available:
                raise ValidationAppError(message=f"Item {item_data.menu_item_id} is unavailable")

            # Resolve variant if provided
            base_price = Decimal(str(menu_item.price))
            if item_data.variant_id:
                variant = next((v for v in menu_item.variants if v.id == item_data.variant_id), None)
                if not variant:
                    raise ValidationAppError(message=f"Variant {item_data.variant_id} not found")
                base_price = Decimal(str(variant.price))

            # Resolve modifiers
            item_modifier_total = Decimal("0.00")
            available_options = {opt.id: opt for mod in menu_item.modifiers for opt in mod.options}
            
            for mod_data in item_data.modifiers:
                if mod_data.modifier_option_id in available_options:
                    option = available_options[mod_data.modifier_option_id]
                    item_modifier_total += Decimal(str(option.price))

            unit_price = base_price + item_modifier_total
            total_subtotal += unit_price * item_data.quantity

        financials = self._calculate_financials(total_subtotal, data.order_type)
        return {
            "subtotal": total_subtotal,
            **financials,
            "item_count": sum(item.quantity for item in data.items)
        }

    # --- Status Management ---

    async def update_status(self, context: RequestContext, order_id: UUID, data: OrderStatusUpdate) -> OrderSchema:
        """
        Transition order status with strict state machine enforcement.
        """
        order = await self._repo.get_by_id(context.restaurant_id, order_id)
        if not order:
            raise NotFoundError(message="Order not found")

        self._validate_transition(order.status, data.new_status)

        old_status = order.status
        order.status = data.new_status

        # If transition is to COMPLETED or CANCELLED, handle final bookkeeping
        # (Reserved for P2.4/P3)

        # Add history record
        history = OrderStatusHistory(
            order_id=order.id,
            old_status=old_status,
            new_status=data.new_status,
            actor_id=context.user_id,
            event_type="status_change",
            notes=data.notes
        )
        await self._repo.add_status_history(history)
        
        await self._repo.session.flush()
        # Refresh to get full aggregate
        order = await self._repo.get_by_id(context.restaurant_id, order_id)
        return OrderSchema.model_validate(order)

    # --- Querying ---

    async def get_order(self, context: RequestContext, order_id: UUID) -> OrderSchema:
        order = await self._repo.get_by_id(context.restaurant_id, order_id)
        if not order:
            raise NotFoundError(message="Order not found")
        return OrderSchema.model_validate(order)

    async def list_orders(
        self, 
        context: RequestContext, 
        status: Optional[OrderStatus] = None,
        order_number: Optional[str] = None,
        table_id: Optional[UUID] = None,
        source: Optional[str] = None,
        limit: int = 50,
        offset: int = 0
    ) -> dict:
        orders, total = await self._repo.list_orders(
            context.restaurant_id, 
            status=status,
            order_number=order_number,
            table_id=table_id,
            source=source,
            limit=limit,
            offset=offset
        )
        return {
            "items": [OrderSchema.model_validate(o) for o in orders],
            "total": total,
            "limit": limit,
            "offset": offset
        }

    # --- Helpers ---

    async def _generate_order_number(self, restaurant_id: UUID) -> str:
        """Generates a sequential order number for the day."""
        # Simple implementation for MVP: Prefix + Date + Count
        today = datetime.date.today().strftime("%y%m%d")
        latest = await self._repo.get_latest_order_number(restaurant_id)
        
        count = 1
        if latest and latest.startswith(f"ORD-{today}-"):
            try:
                count = int(latest.split("-")[-1]) + 1
            except (ValueError, IndexError):
                pass
                
        return f"ORD-{today}-{count:04d}"

    def _validate_transition(self, current: OrderStatus, target: OrderStatus) -> None:
        """
        Enforce strict lifecycle:
        PENDING -> CONFIRMED -> PREPARING -> READY -> COMPLETED
        Any state -> CANCELLED (if not completed)
        """
        allowed = {
            OrderStatus.PENDING: {OrderStatus.CONFIRMED, OrderStatus.CANCELLED},
            OrderStatus.CONFIRMED: {OrderStatus.PREPARING, OrderStatus.CANCELLED},
            OrderStatus.PREPARING: {OrderStatus.READY, OrderStatus.CANCELLED},
            OrderStatus.READY: {OrderStatus.COMPLETED, OrderStatus.CANCELLED},
            OrderStatus.COMPLETED: set(),  # Terminal
            OrderStatus.CANCELLED: set(),  # Terminal
        }

        if target not in allowed.get(current, set()):
            raise ValidationAppError(
                message=f"Invalid status transition from {current} to {target}"
            )

    def _calculate_financials(self, subtotal: Decimal, order_type: OrderType) -> dict:
        """Centralized pricing engine for tax and service charges."""
        tax_rate = Decimal("0.075") # Example 7.5%
        tax_amount = (subtotal * tax_rate).quantize(Decimal("0.01"))
        
        service_charge = Decimal("0.00")
        if order_type == OrderType.DINE_IN:
            service_charge = (subtotal * Decimal("0.10")).quantize(Decimal("0.01")) # 10% service charge
            
        return {
            "tax_amount": tax_amount,
            "service_charge": service_charge,
            "total_amount": subtotal + tax_amount + service_charge
        }
