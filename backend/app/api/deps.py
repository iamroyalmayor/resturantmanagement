"""FastAPI dependency injection providers."""

from __future__ import annotations

from collections.abc import AsyncGenerator, Callable
from typing import Annotated

from fastapi import Depends, Header, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import Settings, get_settings
from app.core.enums import ModulePermission, UserRole
from app.core.exceptions import AuthorizationError
from app.core.security import FirebaseTokenPayload, RequestContext, extract_bearer_token
from app.db.session import get_db
from app.services.auth_service import AuthService
from app.services.firebase_service import FirebaseService, get_firebase_service
from app.services.notification_service import NotificationService, get_notification_service
from app.services.user_service import UserService
from app.services.settings_service import SettingsService
from app.services.menu_service import MenuService
from app.services.table_service import TableService
from app.services.order_service import OrderService
from app.services.kitchen_service import KitchenService
from app.services.inventory_service import InventoryService

SettingsDep = Annotated[Settings, Depends(get_settings)]
DbSession = Annotated[AsyncSession, Depends(get_db)]
FirebaseServiceDep = Annotated[FirebaseService, Depends(get_firebase_service)]
NotificationServiceDep = Annotated[NotificationService, Depends(get_notification_service)]


def get_request_id(
    request: Request,
    x_request_id: Annotated[str | None, Header(alias="X-Request-ID")] = None,
) -> str:
    if x_request_id:
        return x_request_id
    return getattr(request.state, "request_id", "unknown")


RequestIdDep = Annotated[str, Depends(get_request_id)]


async def get_firebase_token_payload(
    firebase: FirebaseServiceDep,
    authorization: Annotated[str | None, Header(alias="Authorization")] = None,
) -> FirebaseTokenPayload:
    token = extract_bearer_token(authorization)
    return firebase.verify_id_token(token)


FirebaseTokenDep = Annotated[FirebaseTokenPayload, Depends(get_firebase_token_payload)]


async def get_auth_service(
    db: DbSession,
    settings: SettingsDep,
) -> AuthService:
    return AuthService(db, settings)


AuthServiceDep = Annotated[AuthService, Depends(get_auth_service)]


async def get_user_service(db: DbSession) -> UserService:
    return UserService(db)


async def get_settings_service(db: DbSession) -> SettingsService:
    return SettingsService(db)


async def get_menu_service(db: DbSession) -> MenuService:
    return MenuService(db)


async def get_table_service(db: DbSession) -> TableService:
    return TableService(db)


async def get_order_service(db: DbSession) -> OrderService:
    return OrderService(db)


async def get_kitchen_service(db: DbSession) -> KitchenService:
    return KitchenService(db)


async def get_inventory_service(db: DbSession) -> InventoryService:
    return InventoryService(db)


UserServiceDep = Annotated[UserService, Depends(get_user_service)]
SettingsServiceDep = Annotated[SettingsService, Depends(get_settings_service)]
MenuServiceDep = Annotated[MenuService, Depends(get_menu_service)]
TableServiceDep = Annotated[TableService, Depends(get_table_service)]
OrderServiceDep = Annotated[OrderService, Depends(get_order_service)]
KitchenServiceDep = Annotated[KitchenService, Depends(get_kitchen_service)]
InventoryServiceDep = Annotated[InventoryService, Depends(get_inventory_service)]


async def get_request_context(
    token_payload: FirebaseTokenDep,
    auth_service: AuthServiceDep,
    request_id: RequestIdDep,
) -> RequestContext:
    return await auth_service.build_request_context(token_payload, request_id)


RequestContextDep = Annotated[RequestContext, Depends(get_request_context)]


from typing import Any, Coroutine

def require_roles(*roles: UserRole) -> Callable[[RequestContext], Coroutine[Any, Any, RequestContext]]:
    """Dependency factory enforcing one of the given roles."""

    async def _checker(context: RequestContextDep) -> RequestContext:
        if context.role not in roles:
            raise AuthorizationError(
                message="Insufficient role for this operation",
                details={
                    "required_roles": [r.value for r in roles],
                    "actual_role": context.role.value,
                },
            )
        return context

    return _checker


def require_permission(module: ModulePermission) -> Callable[[RequestContext], Coroutine[Any, Any, RequestContext]]:
    """Dependency factory enforcing a module permission."""

    async def _checker(context: RequestContextDep) -> RequestContext:
        context.require_permission(module)
        return context

    return _checker


async def get_database_session() -> AsyncGenerator[AsyncSession, None]:
    async for session in get_db():
        yield session
