"""Authentication API schemas."""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.core.enums import ModulePermission, UserRole


class SessionCreateRequest(BaseModel):
    """Optional profile hints on first login (display name)."""

    name: str | None = Field(default=None, max_length=255)


class UserProfileSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    restaurant_id: UUID
    email: str
    name: str
    phone: str | None
    avatar_url: str | None
    role: UserRole
    is_active: bool
    firebase_uid: str | None
    created_at: datetime
    updated_at: datetime


class SessionResponse(BaseModel):
    """Authenticated session returned after token exchange."""

    user: UserProfileSchema
    restaurant_id: UUID
    role: UserRole
    permissions: list[ModulePermission]
