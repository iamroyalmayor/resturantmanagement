"""Add variant support to order items.

Revision ID: 20260605_0007
Revises: 20260605_0006
Create Date: 2026-06-05

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "20260605_0007"
down_revision: Union[str, None] = "20260605_0006"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("order_items", sa.Column("variant_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("menu_variants.id"), nullable=True))
    op.add_column("order_items", sa.Column("variant_name_snapshot", sa.String(length=100), nullable=True))


def downgrade() -> None:
    op.drop_column("order_items", "variant_name_snapshot")
    op.drop_column("order_items", "variant_id")
