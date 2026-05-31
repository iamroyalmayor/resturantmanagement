"""Fine-grained module permissions for staff users."""

from __future__ import annotations

import uuid
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, Enum, ForeignKey, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.enums import ModulePermission
from app.db.base import Base, TimestampMixin, UUIDPrimaryKeyMixin

if TYPE_CHECKING:
    from app.models.user import User


class StaffPermission(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "staff_permissions"
    __table_args__ = (UniqueConstraint("user_id", "module", name="uq_staff_permissions_user_module"),)

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    module: Mapped[ModulePermission] = mapped_column(
        Enum(ModulePermission, name="module_permission", native_enum=True, create_constraint=True),
        nullable=False,
    )
    granted: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    user: Mapped["User"] = relationship(back_populates="staff_permissions")
