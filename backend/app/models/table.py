"""SQLAlchemy models for the Floor Plan domain."""

import secrets
from enum import Enum
from typing import Optional, TYPE_CHECKING
from uuid import UUID

if TYPE_CHECKING:
    from app.models.restaurant import Restaurant

from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import UUID as PostgresUUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, RestaurantScopedMixin, TimestampMixin, UUIDPrimaryKeyMixin


class TableStatus(str, Enum):
    """Current status of a restaurant table."""

    AVAILABLE = "available"
    OCCUPIED = "occupied"
    RESERVED = "reserved"
    MAINTENANCE = "maintenance"


class TableShape(str, Enum):
    """Physical shape of a table."""

    ROUND = "round"
    SQUARE = "square"
    RECTANGLE = "rectangle"


class Table(Base, UUIDPrimaryKeyMixin, RestaurantScopedMixin, TimestampMixin):
    """Restaurant table model."""

    __tablename__ = "tables"

    number: Mapped[int] = mapped_column(Integer, nullable=False)
    capacity: Mapped[int] = mapped_column(Integer, default=2)
    status: Mapped[TableStatus] = mapped_column(String(20), default=TableStatus.AVAILABLE)
    location: Mapped[Optional[str]] = mapped_column(String(100))
    shape: Mapped[TableShape] = mapped_column(String(20), default=TableShape.SQUARE)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    notes: Mapped[Optional[str]] = mapped_column(Text)
    
    # Secure QR token for ordering
    qr_token: Mapped[str] = mapped_column(String(64), unique=True, index=True, nullable=False)
    
    # Room for future table sessions
    current_session_id: Mapped[Optional[UUID]] = mapped_column(PostgresUUID(as_uuid=True), nullable=True)

    # Relationships
    from sqlalchemy.orm import relationship
    restaurant: Mapped["Restaurant"] = relationship("Restaurant")

    def generate_new_token(self) -> str:
        """Generates a new secure QR token."""
        return secrets.token_urlsafe(16)
