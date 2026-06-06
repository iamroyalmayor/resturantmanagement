"""Add orders, items, modifiers and history.

Revision ID: 20260605_0005
Revises: 20260605_0004
Create Date: 2026-06-05

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "20260605_0005"
down_revision: Union[str, None] = "20260605_0004"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Orders table
    op.create_table(
        "orders",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("restaurant_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("order_number", sa.String(length=20), nullable=False),
        sa.Column("table_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("customer_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("status", sa.String(length=20), nullable=False, server_default="pending"),
        sa.Column("source", sa.String(length=20), nullable=False),
        sa.Column("order_type", sa.String(length=20), nullable=False),
        sa.Column("table_name_snapshot", sa.String(length=50), nullable=True),
        sa.Column("customer_name_snapshot", sa.String(length=100), nullable=True),
        sa.Column("customer_phone_snapshot", sa.String(length=20), nullable=True),
        sa.Column("subtotal", sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column("tax_amount", sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column("discount_amount", sa.Numeric(precision=12, scale=2), nullable=False, server_default="0.0"),
        sa.Column("service_charge", sa.Numeric(precision=12, scale=2), nullable=False, server_default="0.0"),
        sa.Column("total_amount", sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["restaurant_id"], ["restaurants.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["table_id"], ["tables.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_orders_order_number", "orders", ["order_number"], unique=True)
    op.create_index("ix_orders_restaurant_id", "orders", ["restaurant_id"])
    op.create_index("ix_orders_status", "orders", ["status"])

    # 2. Order Items table
    op.create_table(
        "order_items",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("order_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("menu_item_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("item_name_snapshot", sa.String(length=100), nullable=False),
        sa.Column("unit_price_snapshot", sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column("quantity", sa.Integer(), nullable=False),
        sa.Column("total_price", sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column("special_instructions", sa.Text(), nullable=True),
        sa.Column("status", sa.String(length=20), nullable=False, server_default="pending"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["order_id"], ["orders.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["menu_item_id"], ["menu_items.id"], ondelete="RESTRICT"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_order_items_order_id", "order_items", ["order_id"])

    # 3. Order Item Modifiers table
    op.create_table(
        "order_item_modifiers",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("order_item_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("modifier_option_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("modifier_name_snapshot", sa.String(length=100), nullable=False),
        sa.Column("price_snapshot", sa.Numeric(precision=12, scale=2), nullable=False),
        sa.ForeignKeyConstraint(["order_item_id"], ["order_items.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["modifier_option_id"], ["menu_modifier_options.id"], ondelete="RESTRICT"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_order_item_modifiers_order_item_id", "order_item_modifiers", ["order_item_id"])

    # 4. Order Status History table
    op.create_table(
        "order_status_history",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("order_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("old_status", sa.String(length=20), nullable=True),
        sa.Column("new_status", sa.String(length=20), nullable=False),
        sa.Column("actor_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("event_type", sa.String(length=50), nullable=False, server_default="status_change"),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["order_id"], ["orders.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_order_status_history_order_id", "order_status_history", ["order_id"])


def downgrade() -> None:
    op.drop_table("order_status_history")
    op.drop_table("order_item_modifiers")
    op.drop_table("order_items")
    op.drop_table("orders")
