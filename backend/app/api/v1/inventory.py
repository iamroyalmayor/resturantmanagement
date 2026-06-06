"""Inventory management endpoints."""

from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Query

from app.api.deps import RequestContextDep, InventoryServiceDep
from app.schemas.common import SuccessResponse
from app.schemas.inventory import (
    InventoryItemSchema, InventoryItemCreate, StockAdjustmentRequest,
    StockMovementSchema, RecipeIngredientSchema, RecipeIngredientCreate
)

router = APIRouter(prefix="/inventory", tags=["Inventory Management"])


@router.get(
    "",
    response_model=SuccessResponse[List[InventoryItemSchema]],
    summary="List inventory items",
)
async def list_inventory(
    context: RequestContextDep,
    inventory_service: InventoryServiceDep,
    is_active: Optional[bool] = Query(None),
) -> SuccessResponse[List[InventoryItemSchema]]:
    items = await inventory_service.list_items(context, is_active=is_active)
    return SuccessResponse(data=items)


@router.get(
    "/low-stock",
    response_model=SuccessResponse[List[InventoryItemSchema]],
    summary="List items below reorder level",
)
async def list_low_stock(
    context: RequestContextDep,
    inventory_service: InventoryServiceDep,
) -> SuccessResponse[List[InventoryItemSchema]]:
    items = await inventory_service.list_items(context, low_stock_only=True)
    return SuccessResponse(data=items)


@router.post(
    "",
    response_model=SuccessResponse[InventoryItemSchema],
    summary="Create inventory item",
)
async def create_inventory_item(
    data: InventoryItemCreate,
    context: RequestContextDep,
    inventory_service: InventoryServiceDep,
) -> SuccessResponse[InventoryItemSchema]:
    item = await inventory_service.create_item(context, data)
    return SuccessResponse(data=item)


@router.post(
    "/{item_id}/adjust",
    response_model=SuccessResponse[InventoryItemSchema],
    summary="Adjust stock level",
)
async def adjust_stock(
    item_id: UUID,
    data: StockAdjustmentRequest,
    context: RequestContextDep,
    inventory_service: InventoryServiceDep,
) -> SuccessResponse[InventoryItemSchema]:
    item = await inventory_service.adjust_stock(context, item_id, data)
    return SuccessResponse(data=item)


@router.get(
    "/{item_id}/movements",
    response_model=SuccessResponse[List[StockMovementSchema]],
    summary="Get movement history",
)
async def get_movements(
    item_id: UUID,
    context: RequestContextDep,
    inventory_service: InventoryServiceDep,
) -> SuccessResponse[List[StockMovementSchema]]:
    movements = await inventory_service.get_movements(context, item_id)
    return SuccessResponse(data=movements)


# Recipes

@router.get(
    "/recipes",
    response_model=SuccessResponse[List[RecipeIngredientSchema]],
    summary="Get recipe for a menu item",
)
async def get_recipe(
    menu_item_id: UUID,
    context: RequestContextDep,
    inventory_service: InventoryServiceDep,
    variant_id: Optional[UUID] = Query(None),
) -> SuccessResponse[List[RecipeIngredientSchema]]:
    ingredients = await inventory_service.get_recipe(context, menu_item_id, variant_id)
    return SuccessResponse(data=ingredients)


@router.post(
    "/recipes",
    response_model=SuccessResponse[RecipeIngredientSchema],
    summary="Add ingredient to recipe",
)
async def add_recipe_ingredient(
    data: RecipeIngredientCreate,
    context: RequestContextDep,
    inventory_service: InventoryServiceDep,
) -> SuccessResponse[RecipeIngredientSchema]:
    ingredient = await inventory_service.add_recipe_ingredient(context, data)
    return SuccessResponse(data=ingredient)
