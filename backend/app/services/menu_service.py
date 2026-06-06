"""Business logic for the Menu domain."""

from typing import List, Optional, Sequence
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.enums import ModulePermission, UserRole
from app.core.exceptions import NotFoundError, AuthorizationError
from app.core.security import RequestContext
from app.models.menu import MenuCategory, MenuItem, MenuModifier, MenuModifierOption, MenuVariant
from app.repositories.menu_repository import MenuRepository
from app.schemas.menu import (
    MenuCategoryCreate, MenuCategorySchema,
    MenuItemCreate, MenuItemSchema,
    MenuModifierCreate, MenuModifierSchema,
    PublicMenuResponse, PublicMenuCategorySchema, PublicMenuItemSchema,
    PublicModifierSchema, PublicModifierOptionSchema, MenuVariantSchema
)


class MenuService:
    def __init__(self, session: AsyncSession) -> None:
        self._repo = MenuRepository(session)

    # --- Categories ---

    async def create_category(self, context: RequestContext, data: MenuCategoryCreate) -> MenuCategorySchema:
        self._require_menu_management(context)
        
        category = MenuCategory(
            restaurant_id=context.restaurant_id,
            **data.model_dump()
        )
        category = await self._repo.create_category(category)
        return MenuCategorySchema.model_validate(category)

    async def list_categories(self, context: RequestContext) -> List[MenuCategorySchema]:
        categories = await self._repo.list_categories(context.restaurant_id)
        return [MenuCategorySchema.model_validate(c) for c in categories]

    # --- Modifiers ---

    async def create_modifier(self, context: RequestContext, data: MenuModifierCreate) -> MenuModifierSchema:
        self._require_menu_management(context)
        
        options = [
            MenuModifierOption(**opt.model_dump())
            for opt in data.options
        ]
        
        modifier = MenuModifier(
            restaurant_id=context.restaurant_id,
            name=data.name,
            description=data.description,
            category=data.category,
            is_required=data.is_required,
            max_selections=data.max_selections,
            options=options
        )
        
        modifier = await self._repo.create_modifier(modifier)
        return MenuModifierSchema.model_validate(modifier)

    async def list_modifiers(self, context: RequestContext) -> List[MenuModifierSchema]:
        modifiers = await self._repo.list_modifiers(context.restaurant_id)
        return [MenuModifierSchema.model_validate(m) for m in modifiers]

    # --- Items ---

    async def create_item(self, context: RequestContext, data: MenuItemCreate) -> MenuItemSchema:
        self._require_menu_management(context)
        
        # Verify category exists
        if data.category_id:
            category = await self._repo.get_category(context.restaurant_id, data.category_id)
            if not category:
                raise NotFoundError(message="Category not found")

        # Fetch modifiers
        modifiers = []
        if data.modifier_ids:
            modifiers = await self._repo.get_modifiers_by_ids(context.restaurant_id, data.modifier_ids)

        variants = [
            MenuVariant(**v.model_dump())
            for v in data.variants
        ]

        item = MenuItem(
            restaurant_id=context.restaurant_id,
            category_id=data.category_id,
            name=data.name,
            description=data.description,
            price=data.price,
            cost=data.cost,
            preparation_time=data.preparation_time,
            serving_size=data.serving_size,
            is_available=data.is_available,
            is_popular=data.is_popular,
            is_featured=data.is_featured,
            spice_level=data.spice_level,
            ingredients=data.ingredients,
            allergens=data.allergens,
            dietary_tags=data.dietary_tags,
            nutritional_info=data.nutritional_info,
            display_order=data.display_order,
            image_url=data.image_url,
            modifiers=list(modifiers),
            variants=variants
        )
        
        item = await self._repo.create_item(item)
        return MenuItemSchema.model_validate(item)

    async def get_item(self, context: RequestContext, item_id: UUID) -> MenuItemSchema:
        item = await self._repo.get_item(context.restaurant_id, item_id)
        if not item:
            raise NotFoundError(message="Menu item not found")
        return MenuItemSchema.model_validate(item)

    async def list_items(
        self, 
        context: RequestContext, 
        category_id: Optional[UUID] = None
    ) -> List[MenuItemSchema]:
        items = await self._repo.list_items(context.restaurant_id, category_id=category_id)
        return [MenuItemSchema.model_validate(i) for i in items]

    async def update_item_availability_bulk(
        self, 
        context: RequestContext, 
        item_ids: List[UUID], 
        is_available: bool
    ) -> int:
        self._require_menu_management(context)
        return await self._repo.update_item_availability_bulk(context.restaurant_id, item_ids, is_available)

    # --- Public ---

    async def get_public_menu(self, restaurant_id: UUID, table_token: Optional[UUID] = None) -> PublicMenuResponse:
        # Future: Use table_token for specific pricing or availability rules
        categories = await self._repo.get_public_menu(restaurant_id)
        
        projected_categories = []
        for cat in categories:
            projected_items = []
            for item in cat.items:
                projected_items.append(
                    PublicMenuItemSchema(
                        id=item.id,
                        name=item.name,
                        description=item.description,
                        price=item.price,
                        image_url=item.image_url,
                        is_popular=item.is_popular,
                        is_featured=item.is_featured,
                        preparation_time=item.preparation_time,
                        spice_level=item.spice_level,
                        dietary_tags=item.dietary_tags,
                        allergens=item.allergens,
                        modifiers=[
                            PublicModifierSchema(
                                id=m.id,
                                name=m.name,
                                description=m.description,
                                category=m.category,
                                is_required=m.is_required,
                                max_selections=m.max_selections,
                                options=[
                                    PublicModifierOptionSchema(
                                        id=opt.id,
                                        name=opt.name,
                                        price=opt.price,
                                        is_default=opt.is_default
                                    ) for opt in m.options
                                ]
                            ) for m in item.modifiers
                        ],
                        variants=[
                            MenuVariantSchema.model_validate(v) for v in item.variants
                        ]
                    )
                )
            
            projected_categories.append(
                PublicMenuCategorySchema(
                    id=cat.id,
                    name=cat.name,
                    description=cat.description,
                    image_url=cat.image_url,
                    items=projected_items
                )
            )
            
        return PublicMenuResponse(categories=projected_categories)

    @staticmethod
    def _require_menu_management(context: RequestContext) -> None:
        if context.role in (UserRole.ADMIN, UserRole.MANAGER):
            return
        context.require_permission(ModulePermission.MENU)
