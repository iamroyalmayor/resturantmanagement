"""Add kitchen timestamps to orders and items.

Revision ID: 20260605_0006
Revises: 20260605_0005
Create Date: 2026-06-05

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "20260605_0006"
down_revision: Union[str, None] = "20260605_0005"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Order timestamps
    op.add_column("orders", sa.Column("confirmed_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("orders", sa.Column("preparing_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("orders", sa.Column("ready_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("orders", sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("orders", sa.Column("cancelled_at", sa.DateTime(timezone=True), nullable=True))

    # OrderItem timestamps
    op.add_column("order_items", sa.Column("preparing_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("order_items", sa.Column("ready_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("order_items", sa.Column("served_at", sa.DateTime(timezone=True), nullable=True))


def downgrade() -> None:
    op.drop_column("order_items", "served_at")
    op.drop_column("order_items", "ready_at")
    op.drop_column("order_items", "preparing_at")
    op.drop_column("orders", "cancelled_at")
    op.drop_column("orders", "completed_at")
    op.drop_column("orders", "ready_at")
    op.drop_column("orders", "preparing_at")
    op.drop_column("orders", "confirmed_at")
