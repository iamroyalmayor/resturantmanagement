"""Add tables and QR tokens.

Revision ID: 20260605_0004
Revises: 20260605_0003
Create Date: 2026-06-05

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "20260605_0004"
down_revision: Union[str, None] = "20260605_0003"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "tables",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("restaurant_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("number", sa.Integer(), nullable=False),
        sa.Column("capacity", sa.Integer(), nullable=False, server_default="2"),
        sa.Column("status", sa.String(length=20), nullable=False, server_default="available"),
        sa.Column("location", sa.String(length=100), nullable=True),
        sa.Column("shape", sa.String(length=20), nullable=False, server_default="square"),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("qr_token", sa.String(length=64), nullable=False),
        sa.Column("current_session_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["restaurant_id"], ["restaurants.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("restaurant_id", "number", name="uq_tables_restaurant_number"),
    )
    op.create_index("ix_tables_qr_token", "tables", ["qr_token"], unique=True)
    op.create_index("ix_tables_restaurant_id", "tables", ["restaurant_id"])


def downgrade() -> None:
    op.drop_index("ix_tables_restaurant_id", table_name="tables")
    op.drop_index("ix_tables_qr_token", table_name="tables")
    op.drop_table("tables")
