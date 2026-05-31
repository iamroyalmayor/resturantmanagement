"""Initial foundation schema: restaurant, users, permissions, FCM tokens.

Revision ID: 20260531_0001
Revises:
Create Date: 2026-05-31

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "20260531_0001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

user_role_enum = postgresql.ENUM(
    "admin",
    "manager",
    "waiter",
    "kitchen",
    "customer",
    name="user_role",
    create_type=False,
)
module_permission_enum = postgresql.ENUM(
    "pos",
    "kitchen",
    "inventory",
    "conversations",
    "reports",
    "accounting",
    "settings",
    "menu",
    "orders",
    "reservations",
    "customers",
    "staff",
    name="module_permission",
    create_type=False,
)
device_platform_enum = postgresql.ENUM(
    "web",
    "android",
    "ios",
    name="device_platform",
    create_type=False,
)


def upgrade() -> None:
    user_role_enum.create(op.get_bind(), checkfirst=True)
    module_permission_enum.create(op.get_bind(), checkfirst=True)
    device_platform_enum.create(op.get_bind(), checkfirst=True)

    op.create_table(
        "restaurants",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=True),
        sa.Column("phone", sa.String(length=50), nullable=True),
        sa.Column("address", sa.Text(), nullable=True),
        sa.Column("timezone", sa.String(length=64), server_default="UTC", nullable=False),
        sa.Column("currency_code", sa.String(length=3), server_default="NGN", nullable=False),
        sa.Column("tax_rate", sa.Numeric(precision=8, scale=6), server_default="0.085", nullable=False),
        sa.Column(
            "service_charge_rate",
            sa.Numeric(precision=8, scale=6),
            server_default="0.18",
            nullable=False,
        ),
        sa.Column("whatsapp_number", sa.String(length=32), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_table(
        "users",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("restaurant_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("firebase_uid", sa.String(length=128), nullable=True),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("phone", sa.String(length=50), nullable=True),
        sa.Column("avatar_url", sa.String(length=512), nullable=True),
        sa.Column("role", user_role_enum, server_default="customer", nullable=False),
        sa.Column("is_active", sa.Boolean(), server_default="true", nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["restaurant_id"], ["restaurants.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("firebase_uid", name="uq_users_firebase_uid"),
        sa.UniqueConstraint("restaurant_id", "email", name="uq_users_restaurant_email"),
    )
    op.create_index("ix_users_firebase_uid", "users", ["firebase_uid"])
    op.create_index("ix_users_restaurant_id", "users", ["restaurant_id"])

    op.create_table(
        "staff_permissions",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("module", module_permission_enum, nullable=False),
        sa.Column("granted", sa.Boolean(), server_default="true", nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id", "module", name="uq_staff_permissions_user_module"),
    )
    op.create_index("ix_staff_permissions_user_id", "staff_permissions", ["user_id"])

    op.create_table(
        "fcm_device_tokens",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("restaurant_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("token", sa.String(length=512), nullable=False),
        sa.Column("platform", device_platform_enum, server_default="web", nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["restaurant_id"], ["restaurants.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("token", name="uq_fcm_device_tokens_token"),
    )
    op.create_index("ix_fcm_device_tokens_user_id", "fcm_device_tokens", ["user_id"])
    op.create_index("ix_fcm_device_tokens_restaurant_id", "fcm_device_tokens", ["restaurant_id"])


def downgrade() -> None:
    op.drop_table("fcm_device_tokens")
    op.drop_table("staff_permissions")
    op.drop_table("users")
    op.drop_table("restaurants")

    device_platform_enum.drop(op.get_bind(), checkfirst=True)
    module_permission_enum.drop(op.get_bind(), checkfirst=True)
    user_role_enum.drop(op.get_bind(), checkfirst=True)
