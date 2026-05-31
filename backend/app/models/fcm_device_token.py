"""FCM device registration tokens."""

from __future__ import annotations

import uuid
from typing import TYPE_CHECKING

from sqlalchemy import Enum, ForeignKey, String, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.enums import DevicePlatform
from app.db.base import Base, RestaurantScopedMixin, TimestampMixin, UUIDPrimaryKeyMixin

if TYPE_CHECKING:
    from app.models.user import User


class FcmDeviceToken(Base, UUIDPrimaryKeyMixin, RestaurantScopedMixin, TimestampMixin):
    __tablename__ = "fcm_device_tokens"
    __table_args__ = (UniqueConstraint("token", name="uq_fcm_device_tokens_token"),)

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    token: Mapped[str] = mapped_column(String(512), nullable=False)
    platform: Mapped[DevicePlatform] = mapped_column(
        Enum(DevicePlatform, name="device_platform", native_enum=True, create_constraint=True),
        nullable=False,
        default=DevicePlatform.WEB,
    )

    user: Mapped["User"] = relationship(back_populates="fcm_device_tokens")
