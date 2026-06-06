"""SQLAlchemy models for the Inventory domain."""

from enum import Enum
from typing import List, Optional
from decimal import Decimal

from sqlalchemy import Boolean, Column, DECIMAL, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, RestaurantScopedMixin, TimestampMixin, UUIDPrimaryKeyMixin


class MovementType(str, Enum):
    """Types of stock movements."""
    IN = "in"
    OUT = "out"
    ADJUSTMENT = "adjustment"
    WASTE = "waste"


class InventoryItem(Base, UUIDPrimaryKeyMixin, RestaurantScopedMixin, TimestampMixin):
    """Inventory item model (ingredients, supplies, etc.)."""

    __tablename__ = "inventory_items"

    name: Mapped[str] = mapped_column(String(100), nullable=False)
    unit: Mapped[str] = mapped_column(String(50), nullable=False)  # e.g., kg, liters, units
    current_stock: Mapped[Decimal] = mapped_column(DECIMAL(12, 3), default=0.000)
    reorder_level: Mapped[Decimal] = mapped_column(DECIMAL(12, 3), default=0.000)
    cost_per_unit: Mapped[Decimal] = mapped_column(DECIMAL(12, 2), default=0.00)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    # Relationships
    movements: Mapped[List["StockMovement"]] = relationship(
        "StockMovement", back_populates="item", cascade="all, delete-orphan"
    )
    recipes: Mapped[List["RecipeIngredient"]] = relationship(
        "RecipeIngredient", back_populates="inventory_item", cascade="all, delete-orphan"
    )


class StockMovement(Base, UUIDPrimaryKeyMixin, RestaurantScopedMixin, TimestampMixin):
    """Audit log of all stock changes."""

    __tablename__ = "stock_movements"

    inventory_item_id: Mapped[UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("inventory_items.id", ondelete="CASCADE"), nullable=False
    )
    type: Mapped[MovementType] = mapped_column(String(20), nullable=False)
    quantity: Mapped[Decimal] = mapped_column(DECIMAL(12, 3), nullable=False)
    reason: Mapped[Optional[str]] = mapped_column(Text)
    actor_id: Mapped[Optional[UUID]] = mapped_column(UUID(as_uuid=True), nullable=True)

    # Relationships
    item: Mapped["InventoryItem"] = relationship("InventoryItem", back_populates="movements")


class RecipeIngredient(Base, UUIDPrimaryKeyMixin, RestaurantScopedMixin, TimestampMixin):
    """Mapping between Menu Items/Variants and Inventory Items."""

    __tablename__ = "recipe_ingredients"

    menu_item_id: Mapped[UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("menu_items.id", ondelete="CASCADE"), nullable=False
    )
    # Optional variant scoping
    menu_variant_id: Mapped[Optional[UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("menu_variants.id", ondelete="CASCADE"), nullable=True
    )
    inventory_item_id: Mapped[UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("inventory_items.id", ondelete="CASCADE"), nullable=False
    )
    quantity_required: Mapped[Decimal] = mapped_column(DECIMAL(12, 3), nullable=False)

    # Relationships
    inventory_item: Mapped["InventoryItem"] = relationship("InventoryItem", back_populates="recipes")
    # Note: These back_populates would need to be added to MenuItem and MenuVariant if needed
