"""Application user profile linked to Firebase Auth."""

from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, String, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.enums import UserRole
from app.db.base import Base, RestaurantScopedMixin, TimestampMixin, UUIDPrimaryKeyMixin

if TYPE_CHECKING:
    from app.models.fcm_device_token import FcmDeviceToken
    from app.models.restaurant import Restaurant
    from app.models.staff_permission import StaffPermission


class User(Base, UUIDPrimaryKeyMixin, RestaurantScopedMixin, TimestampMixin):
    __tablename__ = "users"
    __table_args__ = (
        UniqueConstraint("firebase_uid", name="uq_users_firebase_uid"),
        UniqueConstraint("restaurant_id", "email", name="uq_users_restaurant_email"),
    )

    firebase_uid: Mapped[str | None] = mapped_column(String(128), nullable=True, index=True)
    email: Mapped[str] = mapped_column(String(255), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    phone: Mapped[str | None] = mapped_column(String(50), nullable=True)
    avatar_url: Mapped[str | None] = mapped_column(String(512), nullable=True)
    role: Mapped[UserRole] = mapped_column(
        Enum(UserRole, name="user_role", native_enum=True, create_constraint=True),
        nullable=False,
        default=UserRole.CUSTOMER,
    )
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    restaurant: Mapped["Restaurant"] = relationship(back_populates="users")
    staff_permissions: Mapped[list["StaffPermission"]] = relationship(
        back_populates="user",
        cascade="all, delete-orphan",
    )
    fcm_device_tokens: Mapped[list["FcmDeviceToken"]] = relationship(
        back_populates="user",
        cascade="all, delete-orphan",
    )
