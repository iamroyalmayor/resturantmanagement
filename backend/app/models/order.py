import datetime
from enum import Enum
from typing import List, Optional
from uuid import UUID
from decimal import Decimal

import sqlalchemy as sa
from sqlalchemy import Column, ForeignKey, Integer, String, Text, Numeric, Table
from sqlalchemy.dialects.postgresql import UUID as PostgresUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, RestaurantScopedMixin, TimestampMixin, UUIDPrimaryKeyMixin


class OrderStatus(str, Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    PREPARING = "preparing"
    READY = "ready"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class OrderSource(str, Enum):
    QR = "qr"
    POS = "pos"
    WAITER = "waiter"


class OrderType(str, Enum):
    DINE_IN = "dine_in"
    TAKEAWAY = "takeaway"
    DELIVERY = "delivery"


class ItemStatus(str, Enum):
    """Kitchen tracking status for individual items."""
    PENDING = "pending"
    PREPARING = "preparing"
    READY = "ready"
    SERVED = "served"


class Order(Base, UUIDPrimaryKeyMixin, RestaurantScopedMixin, TimestampMixin):
    """Canonical Order record."""

    __tablename__ = "orders"

    order_number: Mapped[str] = mapped_column(String(20), unique=True, index=True, nullable=False)
    
    # External associations
    table_id: Mapped[Optional[UUID]] = mapped_column(PostgresUUID(as_uuid=True), ForeignKey("tables.id"), nullable=True)
    customer_id: Mapped[Optional[UUID]] = mapped_column(PostgresUUID(as_uuid=True), ForeignKey("customers.id"), nullable=True)
    
    # Core state
    status: Mapped[OrderStatus] = mapped_column(String(20), default=OrderStatus.PENDING, index=True)
    source: Mapped[OrderSource] = mapped_column(String(20), nullable=False)
    order_type: Mapped[OrderType] = mapped_column(String(20), nullable=False)
    
    # Snapshots - preserving context if original entities change
    table_name_snapshot: Mapped[Optional[str]] = mapped_column(String(50))
    customer_name_snapshot: Mapped[Optional[str]] = mapped_column(String(100))
    customer_phone_snapshot: Mapped[Optional[str]] = mapped_column(String(20))
    
    # Financial snapshots
    subtotal: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    tax_amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    discount_amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=0.0)
    service_charge: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=0.0)
    total_amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    
    notes: Mapped[Optional[str]] = mapped_column(Text)

    # Metrics/Timestamps
    confirmed_at: Mapped[Optional[datetime.datetime]] = mapped_column(sa.DateTime(timezone=True))
    preparing_at: Mapped[Optional[datetime.datetime]] = mapped_column(sa.DateTime(timezone=True))
    ready_at: Mapped[Optional[datetime.datetime]] = mapped_column(sa.DateTime(timezone=True))
    completed_at: Mapped[Optional[datetime.datetime]] = mapped_column(sa.DateTime(timezone=True))
    cancelled_at: Mapped[Optional[datetime.datetime]] = mapped_column(sa.DateTime(timezone=True))

    # Relationships
    items: Mapped[List["OrderItem"]] = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")
    status_history: Mapped[List["OrderStatusHistory"]] = relationship("OrderStatusHistory", back_populates="order", cascade="all, delete-orphan")


class OrderItem(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """Single item in an order with pricing snapshots."""

    __tablename__ = "order_items"

    order_id: Mapped[UUID] = mapped_column(PostgresUUID(as_uuid=True), sa.ForeignKey("orders.id", ondelete="CASCADE"), nullable=False, index=True)
    menu_item_id: Mapped[UUID] = mapped_column(PostgresUUID(as_uuid=True), sa.ForeignKey("menu_items.id"), nullable=False)
    variant_id: Mapped[Optional[UUID]] = mapped_column(PostgresUUID(as_uuid=True), sa.ForeignKey("menu_variants.id"), nullable=True)
    
    # Snapshots
    item_name_snapshot: Mapped[str] = mapped_column(sa.String(100), nullable=False)
    variant_name_snapshot: Mapped[Optional[str]] = mapped_column(sa.String(100))
    unit_price_snapshot: Mapped[Decimal] = mapped_column(sa.Numeric(12, 2), nullable=False)
    
    quantity: Mapped[int] = mapped_column(sa.Integer, nullable=False)
    total_price: Mapped[Decimal] = mapped_column(sa.Numeric(12, 2), nullable=False)
    
    special_instructions: Mapped[Optional[str]] = mapped_column(sa.Text)
    status: Mapped[ItemStatus] = mapped_column(sa.String(20), default=ItemStatus.PENDING)

    # Metrics/Timestamps
    preparing_at: Mapped[Optional[datetime.datetime]] = mapped_column(sa.DateTime(timezone=True))
    ready_at: Mapped[Optional[datetime.datetime]] = mapped_column(sa.DateTime(timezone=True))
    served_at: Mapped[Optional[datetime.datetime]] = mapped_column(sa.DateTime(timezone=True))

    # Relationships
    order: Mapped["Order"] = relationship("Order", back_populates="items")
    modifiers: Mapped[List["OrderItemModifier"]] = relationship("OrderItemModifier", back_populates="order_item", cascade="all, delete-orphan")


class OrderItemModifier(Base, UUIDPrimaryKeyMixin):
    """Modifier chosen for an order item with pricing snapshot."""

    __tablename__ = "order_item_modifiers"

    order_item_id: Mapped[UUID] = mapped_column(PostgresUUID(as_uuid=True), ForeignKey("order_items.id", ondelete="CASCADE"), nullable=False, index=True)
    modifier_option_id: Mapped[UUID] = mapped_column(PostgresUUID(as_uuid=True), ForeignKey("menu_modifier_options.id"), nullable=False)
    
    # Snapshots
    modifier_name_snapshot: Mapped[str] = mapped_column(String(100), nullable=False)
    price_snapshot: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)

    # Relationships
    order_item: Mapped["OrderItem"] = relationship("OrderItem", back_populates="modifiers")


class OrderStatusHistory(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """Audit log for order status changes."""

    __tablename__ = "order_status_history"

    order_id: Mapped[UUID] = mapped_column(PostgresUUID(as_uuid=True), ForeignKey("orders.id", ondelete="CASCADE"), nullable=False, index=True)
    old_status: Mapped[Optional[str]] = mapped_column(String(20))
    new_status: Mapped[str] = mapped_column(String(20), nullable=False)
    
    actor_id: Mapped[Optional[UUID]] = mapped_column(PostgresUUID(as_uuid=True)) # Staff user ID
    event_type: Mapped[str] = mapped_column(String(50), default="status_change")
    notes: Mapped[Optional[str]] = mapped_column(Text)

    # Relationships
    order: Mapped["Order"] = relationship("Order", back_populates="status_history")
