"""Kitchen-optimized schemas for the RestaurantOS backend."""

from decimal import Decimal
from enum import Enum
from typing import List, Optional
from uuid import UUID
from datetime import datetime, timezone
from pydantic import BaseModel, ConfigDict, Field

from app.models.order import OrderStatus, OrderSource, OrderType, ItemStatus


# --- Kitchen Metrics Config ---
# These can move to settings later
WARNING_THRESHOLD_MINUTES = 15
CRITICAL_THRESHOLD_MINUTES = 25


class KitchenItemModifierSchema(BaseModel):
    modifier_name_snapshot: str
    
    model_config = ConfigDict(from_attributes=True)


class KitchenItemSchema(BaseModel):
    id: UUID
    item_name_snapshot: str
    variant_name_snapshot: Optional[str] = None
    quantity: int
    special_instructions: Optional[str] = None
    status: ItemStatus
    modifiers: List[KitchenItemModifierSchema]
    
    # Timing
    created_at: datetime
    preparing_at: Optional[datetime] = None
    ready_at: Optional[datetime] = None
    
    @property
    def age_minutes(self) -> int:
        delta = datetime.now(timezone.utc) - self.created_at
        return int(delta.total_seconds() / 60)

    model_config = ConfigDict(from_attributes=True)


class KitchenOrderSchema(BaseModel):
    id: UUID
    order_number: str
    table_name_snapshot: Optional[str] = None
    status: OrderStatus
    source: OrderSource
    order_type: OrderType
    
    items: List[KitchenItemSchema]
    notes: Optional[str] = None
    
    # Timing
    created_at: datetime
    confirmed_at: Optional[datetime] = None
    preparing_at: Optional[datetime] = None
    
    @property
    def age_minutes(self) -> int:
        delta = datetime.now(timezone.utc) - self.created_at
        return int(delta.total_seconds() / 60)
    
    @property
    def is_warning(self) -> bool:
        return self.age_minutes >= WARNING_THRESHOLD_MINUTES and self.status != OrderStatus.READY
    
    @property
    def is_critical(self) -> bool:
        return self.age_minutes >= CRITICAL_THRESHOLD_MINUTES and self.status != OrderStatus.READY

    model_config = ConfigDict(from_attributes=True)


class KitchenItemStatusUpdate(BaseModel):
    new_status: ItemStatus


class KitchenOrderAction(BaseModel):
    action: str # e.g., "confirm", "start_prep", "mark_ready", "complete"
    notes: Optional[str] = None
