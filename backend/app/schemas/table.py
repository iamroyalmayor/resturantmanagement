"""Pydantic schemas for Tables and QR Ordering."""

from enum import Enum
from typing import Optional, List
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field

from app.models.table import TableStatus, TableShape


class TableBase(BaseModel):
    number: int = Field(..., gt=0)
    capacity: int = Field(2, gt=0)
    status: TableStatus = TableStatus.AVAILABLE
    location: Optional[str] = None
    shape: TableShape = TableShape.SQUARE
    is_active: bool = True
    notes: Optional[str] = None


class TableCreate(TableBase):
    pass


class TableUpdate(BaseModel):
    number: Optional[int] = Field(None, gt=0)
    capacity: Optional[int] = Field(None, gt=0)
    status: Optional[TableStatus] = None
    location: Optional[str] = None
    shape: Optional[TableShape] = None
    is_active: Optional[bool] = None
    notes: Optional[str] = None


class TableSchema(TableBase):
    id: UUID
    restaurant_id: UUID
    qr_token: str
    current_session_id: Optional[UUID] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class TablePublicSchema(BaseModel):
    """Simplified table info for public ordering site."""
    number: int
    capacity: int
    location: Optional[str] = None


class RestaurantPublicSchema(BaseModel):
    """Simplified restaurant info for public ordering site."""
    id: UUID
    name: str


class PublicTableContextResponse(BaseModel):
    """The context resolved when a guest scans a QR code."""
    restaurant: RestaurantPublicSchema
    table: TablePublicSchema
    # Future: menu availability flags or specific menu overrides per table
    is_ordering_available: bool = True
