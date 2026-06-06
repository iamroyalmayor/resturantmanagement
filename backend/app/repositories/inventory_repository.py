"""Inventory data access."""

from typing import List, Optional, Sequence
from uuid import UUID
from sqlalchemy import select, and_, or_
from sqlalchemy.orm import selectinload

from app.models.inventory import InventoryItem, StockMovement, RecipeIngredient
from app.repositories.base import BaseRepository


class InventoryRepository(BaseRepository):
    """Repository for inventory and recipes."""

    async def get_item(self, restaurant_id: UUID, item_id: UUID) -> Optional[InventoryItem]:
        stmt = select(InventoryItem).where(
            InventoryItem.restaurant_id == restaurant_id,
            InventoryItem.id == item_id
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def list_items(
        self, 
        restaurant_id: UUID, 
        is_active: Optional[bool] = None,
        low_stock_only: bool = False
    ) -> Sequence[InventoryItem]:
        filters = [InventoryItem.restaurant_id == restaurant_id]
        if is_active is not None:
            filters.append(InventoryItem.is_active == is_active)
        if low_stock_only:
            filters.append(InventoryItem.current_stock <= InventoryItem.reorder_level)

        stmt = select(InventoryItem).where(and_(*filters)).order_by(InventoryItem.name)
        result = await self.session.execute(stmt)
        return result.scalars().all()

    async def create_item(self, item: InventoryItem) -> InventoryItem:
        self.session.add(item)
        await self.session.flush()
        await self.session.refresh(item)
        return item

    async def add_movement(self, movement: StockMovement) -> StockMovement:
        self.session.add(movement)
        await self.session.flush()
        return movement

    async def list_movements(self, restaurant_id: UUID, item_id: UUID) -> Sequence[StockMovement]:
        stmt = (
            select(StockMovement)
            .where(
                StockMovement.restaurant_id == restaurant_id,
                StockMovement.inventory_item_id == item_id
            )
            .order_by(StockMovement.created_at.desc())
        )
        result = await self.session.execute(stmt)
        return result.scalars().all()

    # Recipe Logic
    async def get_recipe(self, restaurant_id: UUID, menu_item_id: UUID, variant_id: Optional[UUID] = None) -> Sequence[RecipeIngredient]:
        filters = [
            RecipeIngredient.restaurant_id == restaurant_id,
            RecipeIngredient.menu_item_id == menu_item_id
        ]
        if variant_id:
            filters.append(RecipeIngredient.menu_variant_id == variant_id)
        else:
            filters.append(RecipeIngredient.menu_variant_id.is_(None))

        stmt = select(RecipeIngredient).where(and_(*filters)).options(selectinload(RecipeIngredient.inventory_item))
        result = await self.session.execute(stmt)
        return result.scalars().all()

    async def add_recipe_ingredient(self, ingredient: RecipeIngredient) -> RecipeIngredient:
        self.session.add(ingredient)
        await self.session.flush()
        return ingredient
