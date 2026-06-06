"""Repository for Menu domain entities."""

from typing import List, Optional, Sequence
from uuid import UUID

from sqlalchemy import select, and_, delete
from sqlalchemy.orm import selectinload

from app.models.menu import MenuCategory, MenuItem, MenuModifier, MenuModifierOption, MenuVariant, menu_item_modifiers
from app.repositories.base import BaseRepository


class MenuRepository(BaseRepository):
    """Repository for Menu categories, items, and modifiers."""

    # --- Categories ---

    async def get_category(self, restaurant_id: UUID, category_id: UUID) -> Optional[MenuCategory]:
        stmt = select(MenuCategory).where(
            and_(MenuCategory.restaurant_id == restaurant_id, MenuCategory.id == category_id)
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def list_categories(self, restaurant_id: UUID, active_only: bool = False) -> Sequence[MenuCategory]:
        filters = [MenuCategory.restaurant_id == restaurant_id]
        if active_only:
            filters.append(MenuCategory.is_active == True)
            
        stmt = select(MenuCategory).where(and_(*filters)).order_by(MenuCategory.display_order)
        result = await self.session.execute(stmt)
        return result.scalars().all()

    async def create_category(self, category: MenuCategory) -> MenuCategory:
        self.session.add(category)
        await self.session.flush()
        return category

    # --- Modifiers ---

    async def get_modifier(self, restaurant_id: UUID, modifier_id: UUID) -> Optional[MenuModifier]:
        stmt = select(MenuModifier).where(
            and_(MenuModifier.restaurant_id == restaurant_id, MenuModifier.id == modifier_id)
        ).options(selectinload(MenuModifier.options))
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def list_modifiers(self, restaurant_id: UUID) -> Sequence[MenuModifier]:
        stmt = select(MenuModifier).where(
            MenuModifier.restaurant_id == restaurant_id
        ).options(selectinload(MenuModifier.options))
        result = await self.session.execute(stmt)
        return result.scalars().all()

    async def create_modifier(self, modifier: MenuModifier) -> MenuModifier:
        self.session.add(modifier)
        await self.session.flush()
        return modifier

    async def get_modifiers_by_ids(self, restaurant_id: UUID, modifier_ids: List[UUID]) -> Sequence[MenuModifier]:
        stmt = select(MenuModifier).where(
            and_(MenuModifier.restaurant_id == restaurant_id, MenuModifier.id.in_(modifier_ids))
        )
        result = await self.session.execute(stmt)
        return result.scalars().all()

    # --- Items ---

    async def get_item(self, restaurant_id: UUID, item_id: UUID) -> Optional[MenuItem]:
        stmt = select(MenuItem).where(
            and_(MenuItem.restaurant_id == restaurant_id, MenuItem.id == item_id)
        ).options(
            selectinload(MenuItem.category),
            selectinload(MenuItem.modifiers).selectinload(MenuModifier.options),
            selectinload(MenuItem.variants)
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def list_items(
        self, 
        restaurant_id: UUID, 
        category_id: Optional[UUID] = None,
        available_only: bool = False
    ) -> Sequence[MenuItem]:
        filters = [MenuItem.restaurant_id == restaurant_id]
        if category_id:
            filters.append(MenuItem.category_id == category_id)
        if available_only:
            filters.append(MenuItem.is_available == True)
            
        stmt = select(MenuItem).where(and_(*filters)).options(
            selectinload(MenuItem.category),
            selectinload(MenuItem.modifiers).selectinload(MenuModifier.options),
            selectinload(MenuItem.variants)
        ).order_by(MenuItem.display_order)
        
        result = await self.session.execute(stmt)
        return result.scalars().all()

    async def create_item(self, item: MenuItem) -> MenuItem:
        self.session.add(item)
        await self.session.flush()
        return item

    async def update_item_availability_bulk(self, restaurant_id: UUID, item_ids: List[UUID], is_available: bool) -> int:
        from sqlalchemy import update
        stmt = update(MenuItem).where(
            and_(MenuItem.restaurant_id == restaurant_id, MenuItem.id.in_(item_ids))
        ).values(is_available=is_available)
        result = await self.session.execute(stmt)
        return result.rowcount if hasattr(result, "rowcount") else 0

    # --- Public View ---

    async def get_public_menu(self, restaurant_id: UUID) -> Sequence[MenuCategory]:
        """Returns active categories with their available items for the public menu."""
        stmt = select(MenuCategory).where(
            and_(MenuCategory.restaurant_id == restaurant_id, MenuCategory.is_active == True)
        ).options(
            selectinload(MenuCategory.items.and_(MenuItem.is_available == True)).options(
                selectinload(MenuItem.modifiers).selectinload(MenuModifier.options),
                selectinload(MenuItem.variants)
            )
        ).order_by(MenuCategory.display_order)
        
        result = await self.session.execute(stmt)
        return result.scalars().all()
