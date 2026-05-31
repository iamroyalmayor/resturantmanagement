"""Firebase Authentication token verification."""

from dataclasses import dataclass, field
from typing import Any
from uuid import UUID

from app.core.enums import ModulePermission, UserRole
from app.core.exceptions import AuthenticationError, AuthorizationError


@dataclass(frozen=True, slots=True)
class FirebaseTokenPayload:
    """Decoded Firebase ID token claims used before DB user resolution."""

    firebase_uid: str
    email: str | None
    email_verified: bool = False
    raw_claims: dict[str, Any] = field(default_factory=dict)


@dataclass(frozen=True, slots=True)
class RequestContext:
    """Authenticated request context attached to protected routes."""

    firebase_uid: str
    user_id: UUID
    restaurant_id: UUID
    role: UserRole
    permissions: frozenset[ModulePermission]
    correlation_id: str
    email: str | None = None

    def has_permission(self, module: ModulePermission) -> bool:
        if self.role == UserRole.ADMIN:
            return True
        return module in self.permissions

    def require_role(self, *roles: UserRole) -> None:
        if self.role not in roles:
            raise AuthorizationError(
                message="Insufficient role for this operation",
                details={"required_roles": [r.value for r in roles], "actual_role": self.role.value},
            )

    def require_permission(self, module: ModulePermission) -> None:
        if not self.has_permission(module):
            raise AuthorizationError(
                message="Missing required module permission",
                details={"required_permission": module.value},
            )


def extract_bearer_token(authorization: str | None) -> str:
    if not authorization:
        raise AuthenticationError(message="Missing Authorization header")
    parts = authorization.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise AuthenticationError(message="Invalid Authorization header format")
    return parts[1]
