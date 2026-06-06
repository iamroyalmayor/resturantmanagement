"""Menu management endpoints for staff."""

from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Query

from app.api.deps import RequestContextDep, MenuServiceDep
from app.schemas.common import SuccessResponse
from app.schemas.menu import (
    MenuCategoryCreate, MenuCategorySchema,
    MenuItemCreate, MenuItemSchema,
    MenuModifierCreate, MenuModifierSchema
)

router = APIRouter(prefix="/menu", tags=["Menu Management"])


# --- Categories ---

@router.post(
    "/categories",
    response_model=SuccessResponse[MenuCategorySchema],
    summary="Create menu category",
)
async def create_category(
    data: MenuCategoryCreate,
    context: RequestContextDep,
    menu_service: MenuServiceDep,
) -> SuccessResponse[MenuCategorySchema]:
    category = await menu_service.create_category(context, data)
    return SuccessResponse(data=category)


@router.get(
    "/categories",
    response_model=SuccessResponse[List[MenuCategorySchema]],
    summary="List all categories",
)
async def list_categories(
    context: RequestContextDep,
    menu_service: MenuServiceDep,
) -> SuccessResponse[List[MenuCategorySchema]]:
    categories = await menu_service.list_categories(context)
    return SuccessResponse(data=categories)


# --- Modifiers ---

@router.post(
    "/modifiers",
    response_model=SuccessResponse[MenuModifierSchema],
    summary="Create menu modifier group",
)
async def create_modifier(
    data: MenuModifierCreate,
    context: RequestContextDep,
    menu_service: MenuServiceDep,
) -> SuccessResponse[MenuModifierSchema]:
    modifier = await menu_service.create_modifier(context, data)
    return SuccessResponse(data=modifier)


@router.get(
    "/modifiers",
    response_model=SuccessResponse[List[MenuModifierSchema]],
    summary="List all modifier groups",
)
async def list_modifiers(
    context: RequestContextDep,
    menu_service: MenuServiceDep,
) -> SuccessResponse[List[MenuModifierSchema]]:
    modifiers = await menu_service.list_modifiers(context)
    return SuccessResponse(data=modifiers)


# --- Items ---

@router.post(
    "/items",
    response_model=SuccessResponse[MenuItemSchema],
    summary="Create menu item",
)
async def create_item(
    data: MenuItemCreate,
    context: RequestContextDep,
    menu_service: MenuServiceDep,
) -> SuccessResponse[MenuItemSchema]:
    item = await menu_service.create_item(context, data)
    return SuccessResponse(data=item)


@router.get(
    "/items",
    response_model=SuccessResponse[List[MenuItemSchema]],
    summary="List menu items",
)
async def list_items(
    context: RequestContextDep,
    menu_service: MenuServiceDep,
    category_id: Optional[UUID] = Query(None),
) -> SuccessResponse[List[MenuItemSchema]]:
    items = await menu_service.list_items(context, category_id=category_id)
    return SuccessResponse(data=items)


@router.get(
    "/items/{item_id}",
    response_model=SuccessResponse[MenuItemSchema],
    summary="Get menu item detail",
)
async def get_item(
    item_id: UUID,
    context: RequestContextDep,
    menu_service: MenuServiceDep,
) -> SuccessResponse[MenuItemSchema]:
    item = await menu_service.get_item(context, item_id)
    return SuccessResponse(data=item)


@router.patch(
    "/items/bulk-availability",
    response_model=SuccessResponse[int],
    summary="Update item availability in bulk (86 logic)",
)
async def update_item_availability(
    item_ids: List[UUID],
    is_available: bool,
    context: RequestContextDep,
    menu_service: MenuServiceDep,
) -> SuccessResponse[int]:
    count = await menu_service.update_item_availability_bulk(context, item_ids, is_available)
    return SuccessResponse(data=count)
