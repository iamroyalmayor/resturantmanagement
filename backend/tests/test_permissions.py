"""Unit tests for permission resolution."""

from uuid import UUID

from app.core.enums import ModulePermission, UserRole
from app.core.permissions import ROLE_DEFAULT_PERMISSIONS, resolve_permissions
from app.models.staff_permission import StaffPermission
from app.models.user import User

RESTAURANT_ID = UUID("00000000-0000-0000-0000-000000000001")


def _user(role: UserRole, permissions: list[StaffPermission] | None = None) -> User:
    user = User(
        email="test@example.com",
        name="Test",
        role=role,
        restaurant_id=RESTAURANT_ID,
        is_active=True,
    )
    user.staff_permissions = permissions or []
    return user


def test_admin_has_all_permissions() -> None:
    user = _user(UserRole.ADMIN)
    perms = resolve_permissions(user)
    assert perms == ROLE_DEFAULT_PERMISSIONS[UserRole.ADMIN]
    assert ModulePermission.SETTINGS in perms


def test_customer_has_no_module_permissions() -> None:
    user = _user(UserRole.CUSTOMER)
    assert resolve_permissions(user) == frozenset()


def test_explicit_staff_permissions_override_defaults() -> None:
    user = _user(UserRole.WAITER)
    user.staff_permissions = [
        StaffPermission(
            user_id=user.id,
            module=ModulePermission.REPORTS,
            granted=True,
        )
    ]
    perms = resolve_permissions(user)
    assert perms == frozenset({ModulePermission.REPORTS})


def test_waiter_role_defaults_when_no_explicit_permissions() -> None:
    user = _user(UserRole.WAITER)
    perms = resolve_permissions(user)
    assert ModulePermission.POS in perms
    assert ModulePermission.SETTINGS not in perms
