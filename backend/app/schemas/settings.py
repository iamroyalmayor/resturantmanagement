"""Restaurant settings API schemas."""

from datetime import time
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class OperatingHourSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    day_of_week: int = Field(ge=0, le=6, description="0=Monday through 6=Sunday")
    open_time: time | None = None
    close_time: time | None = None
    is_closed: bool = False


class OperatingHourUpdateSchema(BaseModel):
    day_of_week: int = Field(ge=0, le=6)
    open_time: time | None = None
    close_time: time | None = None
    is_closed: bool = False


class RestaurantSettingsResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    email: str | None
    phone: str | None
    address: str | None
    timezone: str
    currency_code: str
    tax_rate: Decimal
    service_charge_rate: Decimal
    whatsapp_number: str | None
    operating_hours: list[OperatingHourSchema]


class RestaurantSettingsUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=255)
    email: str | None = Field(default=None, max_length=255)
    phone: str | None = Field(default=None, max_length=50)
    address: str | None = None
    timezone: str | None = Field(default=None, max_length=64)
    currency_code: str | None = Field(default=None, min_length=3, max_length=3)
    tax_rate: Decimal | None = Field(default=None, ge=0, le=1)
    service_charge_rate: Decimal | None = Field(default=None, ge=0, le=1)
    whatsapp_number: str | None = Field(default=None, max_length=32)
    operating_hours: list[OperatingHourUpdateSchema] | None = None
