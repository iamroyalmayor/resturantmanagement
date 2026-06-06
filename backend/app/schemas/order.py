"""Pydantic schemas for the Orders Domain."""

from decimal import Decimal
from enum import Enum
from typing import List, Optional
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field

from app.models.order import OrderStatus, OrderSource, OrderType, ItemStatus


# --- Input Schemas ---

class OrderItemModifierCreate(BaseModel):
    modifier_option_id: UUID


class OrderItemCreate(BaseModel):
    menu_item_id: UUID
    variant_id: Optional[UUID] = None
    quantity: int = Field(..., gt=0)
    special_instructions: Optional[str] = None
    modifiers: List[OrderItemModifierCreate] = []


class OrderCreate(BaseModel):
    table_id: Optional[UUID] = None
    customer_id: Optional[UUID] = None
    order_type: OrderType = OrderType.DINE_IN
    source: OrderSource = OrderSource.POS
    notes: Optional[str] = None
    items: List[OrderItemCreate]


class OrderStatusUpdate(BaseModel):
    new_status: OrderStatus
    notes: Optional[str] = None


class OrderPreviewResponse(BaseModel):
    subtotal: Decimal
    tax_amount: Decimal
    service_charge: Decimal
    total_amount: Decimal
    
    # Optional breakdowns
    item_count: int


# --- Output Schemas ---

class OrderItemModifierSchema(BaseModel):
    id: UUID
    modifier_option_id: UUID
    modifier_name_snapshot: str
    price_snapshot: Decimal

    model_config = ConfigDict(from_attributes=True)


class OrderItemSchema(BaseModel):
    id: UUID
    menu_item_id: UUID
    variant_id: Optional[UUID] = None
    item_name_snapshot: str
    variant_name_snapshot: Optional[str] = None
    unit_price_snapshot: Decimal
    quantity: int
    total_price: Decimal
    special_instructions: Optional[str] = None
    status: ItemStatus
    modifiers: List[OrderItemModifierSchema]

    model_config = ConfigDict(from_attributes=True)


class OrderStatusHistorySchema(BaseModel):
    id: UUID
    old_status: Optional[str] = None
    new_status: str
    actor_id: Optional[UUID] = None
    event_type: str
    notes: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class OrderSchema(BaseModel):
    id: UUID
    restaurant_id: UUID
    order_number: str
    table_id: Optional[UUID] = None
    customer_id: Optional[UUID] = None
    status: OrderStatus
    source: OrderSource
    order_type: OrderType
    
    table_name_snapshot: Optional[str] = None
    customer_name_snapshot: Optional[str] = None
    customer_phone_snapshot: Optional[str] = None
    
    subtotal: Decimal
    tax_amount: Decimal
    discount_amount: Decimal
    service_charge: Decimal
    total_amount: Decimal
    
    notes: Optional[str] = None
    items: List[OrderItemSchema]
    status_history: List[OrderStatusHistorySchema]
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
