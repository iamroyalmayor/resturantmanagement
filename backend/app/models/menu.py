"""SQLAlchemy models for the Menu domain."""

from enum import Enum
from typing import List, Optional, TYPE_CHECKING

from sqlalchemy import Boolean, Column, DECIMAL, ForeignKey, Integer, String, Table, Text
from sqlalchemy.dialects.postgresql import ARRAY, JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, RestaurantScopedMixin, TimestampMixin, UUIDPrimaryKeyMixin

if TYPE_CHECKING:
    from app.models.inventory import RecipeIngredient


class ModifierCategory(str, Enum):
    """Categories for menu modifiers."""

    SIZE = "size"
    ADDON = "addon"
    CUSTOMIZATION = "customization"
    SAUCE = "sauce"
    SIDE = "side"


class SpiceLevel(str, Enum):
    """Spice levels for menu items."""

    MILD = "mild"
    MEDIUM = "medium"
    HOT = "hot"
    EXTRA_HOT = "extra-hot"


# Association table for MenuItem and MenuModifier
menu_item_modifiers = Table(
    "menu_item_modifiers",
    Base.metadata,
    Column("menu_item_id", UUID(as_uuid=True), ForeignKey("menu_items.id", ondelete="CASCADE"), primary_key=True),
    Column("modifier_id", UUID(as_uuid=True), ForeignKey("menu_modifiers.id", ondelete="CASCADE"), primary_key=True),
)


class MenuCategory(Base, UUIDPrimaryKeyMixin, RestaurantScopedMixin, TimestampMixin):
    """Menu category model."""

    __tablename__ = "menu_categories"

    name: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text)
    display_order: Mapped[int] = mapped_column(Integer, default=0)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    image_url: Mapped[Optional[str]] = mapped_column(String(512))

    # Relationships
    items: Mapped[List["MenuItem"]] = relationship(
        "MenuItem", back_populates="category", cascade="all, delete-orphan"
    )


class MenuModifier(Base, UUIDPrimaryKeyMixin, RestaurantScopedMixin, TimestampMixin):
    """Menu modifier (group) model."""

    __tablename__ = "menu_modifiers"

    name: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text)
    category: Mapped[ModifierCategory] = mapped_column(String(50), default=ModifierCategory.ADDON)
    is_required: Mapped[bool] = mapped_column(Boolean, default=False)
    max_selections: Mapped[Optional[int]] = mapped_column(Integer)

    # Relationships
    options: Mapped[List["MenuModifierOption"]] = relationship(
        "MenuModifierOption", back_populates="modifier", cascade="all, delete-orphan"
    )
    items: Mapped[List["MenuItem"]] = relationship(
        "MenuItem", secondary=menu_item_modifiers, back_populates="modifiers"
    )


class MenuModifierOption(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """Individual option within a modifier group."""

    __tablename__ = "menu_modifier_options"

    modifier_id: Mapped[UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("menu_modifiers.id", ondelete="CASCADE"), nullable=False
    )
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    price: Mapped[float] = mapped_column(DECIMAL(12, 2), default=0.0)
    is_default: Mapped[bool] = mapped_column(Boolean, default=False)

    # Relationships
    modifier: Mapped["MenuModifier"] = relationship("MenuModifier", back_populates="options")


class MenuItem(Base, UUIDPrimaryKeyMixin, RestaurantScopedMixin, TimestampMixin):
    """Menu item model."""

    __tablename__ = "menu_items"

    category_id: Mapped[UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("menu_categories.id", ondelete="SET NULL"), nullable=True
    )
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[str] = mapped_column(Text)
    price: Mapped[float] = mapped_column(DECIMAL(12, 2), nullable=False)
    cost: Mapped[float] = mapped_column(DECIMAL(12, 2), default=0.0)
    
    preparation_time: Mapped[int] = mapped_column(Integer, default=15)  # in minutes
    serving_size: Mapped[Optional[str]] = mapped_column(String(100))
    
    is_available: Mapped[bool] = mapped_column(Boolean, default=True)
    is_popular: Mapped[bool] = mapped_column(Boolean, default=False)
    is_featured: Mapped[bool] = mapped_column(Boolean, default=False)
    
    spice_level: Mapped[Optional[SpiceLevel]] = mapped_column(String(20))
    
    # ARRAY types for Postgres
    ingredients: Mapped[List[str]] = mapped_column(ARRAY(String), default=[])
    allergens: Mapped[List[str]] = mapped_column(ARRAY(String), default=[])
    dietary_tags: Mapped[List[str]] = mapped_column(ARRAY(String), default=[])
    
    # JSONB for flexible nutritional data
    nutritional_info: Mapped[dict] = mapped_column(JSONB, default={})
    
    display_order: Mapped[int] = mapped_column(Integer, default=0)
    image_url: Mapped[Optional[str]] = mapped_column(String(512))

    # Relationships
    category: Mapped[Optional["MenuCategory"]] = relationship("MenuCategory", back_populates="items")
    modifiers: Mapped[List["MenuModifier"]] = relationship(
        "MenuModifier", secondary=menu_item_modifiers, back_populates="items"
    )
    variants: Mapped[List["MenuVariant"]] = relationship(
        "MenuVariant", back_populates="item", cascade="all, delete-orphan"
    )
    recipes: Mapped[List["RecipeIngredient"]] = relationship(
        "RecipeIngredient",
        primaryjoin="foreign(RecipeIngredient.menu_item_id) == MenuItem.id",
        overlaps="inventory_item",
        viewonly=True,
    )


class MenuVariant(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """Variant of a menu item (e.g., different sizes or versions)."""

    __tablename__ = "menu_variants"

    menu_item_id: Mapped[UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("menu_items.id", ondelete="CASCADE"), nullable=False
    )
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    price: Mapped[float] = mapped_column(DECIMAL(12, 2), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text)
    is_default: Mapped[bool] = mapped_column(Boolean, default=False)

    # Relationships
    item: Mapped["MenuItem"] = relationship("MenuItem", back_populates="variants")
    recipes: Mapped[List["RecipeIngredient"]] = relationship(
        "RecipeIngredient",
        primaryjoin="foreign(RecipeIngredient.menu_variant_id) == MenuVariant.id",
        overlaps="inventory_item",
        viewonly=True,
    )
