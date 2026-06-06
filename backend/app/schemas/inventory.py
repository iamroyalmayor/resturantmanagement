"""Pydantic schemas for the Inventory domain."""

from decimal import Decimal
from typing import List, Optional
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field

from app.models.inventory import MovementType


# --- Inventory Item Schemas ---

class InventoryItemBase(BaseModel):
    name: str
    unit: str
    reorder_level: Decimal = Field(default=Decimal("0.000"), ge=Decimal("0"))
    cost_per_unit: Decimal = Field(default=Decimal("0.00"), ge=Decimal("0"))
    is_active: bool = True


class InventoryItemCreate(InventoryItemBase):
    initial_stock: Decimal = Field(default=Decimal("0.000"), ge=Decimal("0"))


class InventoryItemUpdate(BaseModel):
    name: Optional[str] = None
    unit: Optional[str] = None
    reorder_level: Optional[Decimal] = None
    cost_per_unit: Optional[Decimal] = None
    is_active: Optional[bool] = None


class InventoryItemSchema(InventoryItemBase):
    id: UUID
    restaurant_id: UUID
    current_stock: Decimal
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# --- Stock Movement Schemas ---

class StockAdjustmentRequest(BaseModel):
    quantity: Decimal
    type: MovementType
    reason: Optional[str] = None


class StockMovementSchema(BaseModel):
    id: UUID
    inventory_item_id: UUID
    type: MovementType
    quantity: Decimal
    reason: Optional[str] = None
    actor_id: Optional[UUID] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# --- Recipe Schemas ---

class RecipeIngredientBase(BaseModel):
    menu_item_id: UUID
    menu_variant_id: Optional[UUID] = None
    inventory_item_id: UUID
    quantity_required: Decimal = Field(..., gt=Decimal("0"))


class RecipeIngredientCreate(RecipeIngredientBase):
    pass


class RecipeIngredientSchema(RecipeIngredientBase):
    id: UUID
    restaurant_id: UUID

    model_config = ConfigDict(from_attributes=True)
