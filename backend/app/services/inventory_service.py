"""Inventory business logic."""

from typing import List, Optional, Sequence
from uuid import UUID
from decimal import Decimal

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import RequestContext
from app.models.inventory import InventoryItem, StockMovement, RecipeIngredient, MovementType
from app.repositories.inventory_repository import InventoryRepository
from app.schemas.inventory import (
    InventoryItemCreate, InventoryItemUpdate, InventoryItemSchema,
    StockAdjustmentRequest, StockMovementSchema,
    RecipeIngredientCreate, RecipeIngredientSchema
)
from app.core.exceptions import ValidationAppError


class InventoryService:
    """Service for managing inventory, movements, and recipes."""

    def __init__(self, session: AsyncSession) -> None:
        self._repo = InventoryRepository(session)

    async def create_item(self, context: RequestContext, data: InventoryItemCreate) -> InventoryItemSchema:
        """Create a new inventory item and record initial stock if provided."""
        item = InventoryItem(
            restaurant_id=context.restaurant_id,
            name=data.name,
            unit=data.unit,
            current_stock=data.initial_stock,
            reorder_level=data.reorder_level,
            cost_per_unit=data.cost_per_unit,
            is_active=data.is_active
        )
        item = await self._repo.create_item(item)

        if data.initial_stock > 0:
            movement = StockMovement(
                restaurant_id=context.restaurant_id,
                inventory_item_id=item.id,
                type=MovementType.IN,
                quantity=data.initial_stock,
                reason="Initial stock setup",
                actor_id=context.user_id
            )
            await self._repo.add_movement(movement)

        return InventoryItemSchema.model_validate(item)

    async def list_items(
        self, 
        context: RequestContext, 
        is_active: Optional[bool] = None,
        low_stock_only: bool = False
    ) -> List[InventoryItemSchema]:
        items = await self._repo.list_items(
            context.restaurant_id, 
            is_active=is_active,
            low_stock_only=low_stock_only
        )
        return [InventoryItemSchema.model_validate(i) for i in items]

    async def adjust_stock(
        self, 
        context: RequestContext, 
        item_id: UUID, 
        data: StockAdjustmentRequest
    ) -> InventoryItemSchema:
        """Adjust stock levels and record movement."""
        item = await self._repo.get_item(context.restaurant_id, item_id)
        if not item:
            raise ValidationAppError(message="Inventory item not found")

        # Update stock based on type
        # IN adds, others subtract (logic depends on business preference, 
        # but generally WASTE and OUT reduce stock, ADJUSTMENT depends on sign)
        # For simplicity, we'll treat IN as positive and others as specified by user
        
        if data.type == MovementType.IN:
            item.current_stock += data.quantity
        elif data.type in [MovementType.OUT, MovementType.WASTE]:
            item.current_stock -= data.quantity
        elif data.type == MovementType.ADJUSTMENT:
            # For adjustment, the quantity provided is the delta
            item.current_stock += data.quantity

        movement = StockMovement(
            restaurant_id=context.restaurant_id,
            inventory_item_id=item.id,
            type=data.type,
            quantity=data.quantity,
            reason=data.reason,
            actor_id=context.user_id
        )
        await self._repo.add_movement(movement)
        
        return InventoryItemSchema.model_validate(item)

    async def get_movements(self, context: RequestContext, item_id: UUID) -> List[StockMovementSchema]:
        movements = await self._repo.list_movements(context.restaurant_id, item_id)
        return [StockMovementSchema.model_validate(m) for m in movements]

    # Recipe Management
    async def add_recipe_ingredient(self, context: RequestContext, data: RecipeIngredientCreate) -> RecipeIngredientSchema:
        # Verify item exists
        item = await self._repo.get_item(context.restaurant_id, data.inventory_item_id)
        if not item:
            raise ValidationAppError(message="Inventory item not found")

        ingredient = RecipeIngredient(
            restaurant_id=context.restaurant_id,
            menu_item_id=data.menu_item_id,
            menu_variant_id=data.menu_variant_id,
            inventory_item_id=data.inventory_item_id,
            quantity_required=data.quantity_required
        )
        ingredient = await self._repo.add_recipe_ingredient(ingredient)
        return RecipeIngredientSchema.model_validate(ingredient)

    async def get_recipe(self, context: RequestContext, menu_item_id: UUID, variant_id: Optional[UUID] = None) -> List[RecipeIngredientSchema]:
        ingredients = await self._repo.get_recipe(context.restaurant_id, menu_item_id, variant_id)
        return [RecipeIngredientSchema.model_validate(i) for i in ingredients]
