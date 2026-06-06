"""Add menu domain tables.

Revision ID: 20260605_0003
Revises: 20260531_0002
Create Date: 2026-06-05

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "20260605_0003"
down_revision: Union[str, None] = "20260531_0002"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # --- Menu Categories ---
    op.create_table(
        "menu_categories",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("restaurant_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("display_order", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("image_url", sa.String(length=512), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["restaurant_id"], ["restaurants.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_menu_categories_restaurant_id", "menu_categories", ["restaurant_id"])

    # --- Menu Modifiers ---
    op.create_table(
        "menu_modifiers",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("restaurant_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("category", sa.String(length=50), nullable=False, server_default="addon"),
        sa.Column("is_required", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("max_selections", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["restaurant_id"], ["restaurants.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_menu_modifiers_restaurant_id", "menu_modifiers", ["restaurant_id"])

    # --- Menu Modifier Options ---
    op.create_table(
        "menu_modifier_options",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("modifier_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.Column("price", sa.Numeric(precision=12, scale=2), nullable=False, server_default="0.0"),
        sa.Column("is_default", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["modifier_id"], ["menu_modifiers.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )

    # --- Menu Items ---
    op.create_table(
        "menu_items",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("restaurant_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("category_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("price", sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column("cost", sa.Numeric(precision=12, scale=2), nullable=False, server_default="0.0"),
        sa.Column("preparation_time", sa.Integer(), nullable=False, server_default="15"),
        sa.Column("serving_size", sa.String(length=100), nullable=True),
        sa.Column("is_available", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("is_popular", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("is_featured", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("spice_level", sa.String(length=20), nullable=True),
        sa.Column("ingredients", postgresql.ARRAY(sa.String()), nullable=False, server_default="{}"),
        sa.Column("allergens", postgresql.ARRAY(sa.String()), nullable=False, server_default="{}"),
        sa.Column("dietary_tags", postgresql.ARRAY(sa.String()), nullable=False, server_default="{}"),
        sa.Column("nutritional_info", postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default="{}"),
        sa.Column("display_order", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("image_url", sa.String(length=512), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["category_id"], ["menu_categories.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["restaurant_id"], ["restaurants.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_menu_items_restaurant_id", "menu_items", ["restaurant_id"])

    # --- Menu Item Modifiers (Association) ---
    op.create_table(
        "menu_item_modifiers",
        sa.Column("menu_item_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("modifier_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.ForeignKeyConstraint(["menu_item_id"], ["menu_items.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["modifier_id"], ["menu_modifiers.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("menu_item_id", "modifier_id"),
    )

    # --- Menu Variants ---
    op.create_table(
        "menu_variants",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("menu_item_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.Column("price", sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("is_default", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["menu_item_id"], ["menu_items.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )


def downgrade() -> None:
    op.drop_table("menu_variants")
    op.drop_table("menu_item_modifiers")
    op.drop_table("menu_items")
    op.drop_table("menu_modifier_options")
    op.drop_table("menu_modifiers")
    op.drop_table("menu_categories")
