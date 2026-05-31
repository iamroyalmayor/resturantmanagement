"""Restaurant configuration entity (single row in MVP)."""

from __future__ import annotations

from decimal import Decimal
from typing import TYPE_CHECKING

from sqlalchemy import Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, UUIDPrimaryKeyMixin

if TYPE_CHECKING:
    from app.models.operating_hour import OperatingHour
    from app.models.user import User


class Restaurant(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "restaurants"

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    phone: Mapped[str | None] = mapped_column(String(50), nullable=True)
    address: Mapped[str | None] = mapped_column(Text, nullable=True)
    timezone: Mapped[str] = mapped_column(String(64), nullable=False, default="UTC")
    currency_code: Mapped[str] = mapped_column(String(3), nullable=False, default="NGN")
    tax_rate: Mapped[Decimal] = mapped_column(Numeric(8, 6), nullable=False, default=Decimal("0.085"))
    service_charge_rate: Mapped[Decimal] = mapped_column(
        Numeric(8, 6), nullable=False, default=Decimal("0.18")
    )
    whatsapp_number: Mapped[str | None] = mapped_column(String(32), nullable=True)

    users: Mapped[list["User"]] = relationship(back_populates="restaurant")
    operating_hours: Mapped[list["OperatingHour"]] = relationship(
        back_populates="restaurant",
        cascade="all, delete-orphan",
        order_by="OperatingHour.day_of_week",
    )
