"""Role and module permission resolution."""

from app.core.enums import ModulePermission, UserRole
from app.models.staff_permission import StaffPermission
from app.models.user import User

# Default module access when no explicit staff_permissions rows exist.
ROLE_DEFAULT_PERMISSIONS: dict[UserRole, frozenset[ModulePermission]] = {
    UserRole.MANAGER: frozenset(
        {
            ModulePermission.POS,
            ModulePermission.KITCHEN,
            ModulePermission.INVENTORY,
            ModulePermission.CONVERSATIONS,
            ModulePermission.REPORTS,
            ModulePermission.ACCOUNTING,
            ModulePermission.SETTINGS,
            ModulePermission.MENU,
            ModulePermission.ORDERS,
            ModulePermission.RESERVATIONS,
            ModulePermission.CUSTOMERS,
            ModulePermission.STAFF,
        }
    ),
    UserRole.WAITER: frozenset(
        {
            ModulePermission.POS,
            ModulePermission.ORDERS,
            ModulePermission.RESERVATIONS,
            ModulePermission.CUSTOMERS,
        }
    ),
    UserRole.KITCHEN: frozenset({ModulePermission.KITCHEN, ModulePermission.ORDERS}),
    UserRole.CUSTOMER: frozenset(),
    UserRole.ADMIN: frozenset(ModulePermission),
}


def resolve_permissions(user: User) -> frozenset[ModulePermission]:
    """
    Resolve effective module permissions for a user.

    - admin: all modules
    - customer: none
    - staff: explicit grants from staff_permissions, else role defaults
    """
    if user.role == UserRole.ADMIN:
        return ROLE_DEFAULT_PERMISSIONS[UserRole.ADMIN]

    if user.role == UserRole.CUSTOMER:
        return ROLE_DEFAULT_PERMISSIONS[UserRole.CUSTOMER]

    explicit = frozenset(
        permission.module
        for permission in user.staff_permissions
        if permission.granted
    )
    if explicit:
        return explicit

    return ROLE_DEFAULT_PERMISSIONS.get(user.role, frozenset())
