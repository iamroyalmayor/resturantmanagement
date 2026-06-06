"""User profile and staff listing."""

from typing import Optional
import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.enums import ModulePermission, UserRole
from app.core.exceptions import AuthorizationError, NotFoundError
from app.core.security import RequestContext
from app.repositories.user_repository import UserRepository
from app.schemas.user import UserListResponse, UserResponse


class UserService:
    def __init__(self, session: AsyncSession) -> None:
        self._users = UserRepository(session)

    async def get_me(self, context: RequestContext) -> UserResponse:
        user = await self._users.get_by_id(context.user_id, restaurant_id=context.restaurant_id)
        if not user:
            raise NotFoundError(message="User not found")
        return UserResponse.model_validate(user)

    async def get_user_by_firebase_uid(self, firebase_uid: str) -> Optional[UserResponse]:
        user = await self._users.get_by_firebase_uid(firebase_uid)
        if not user:
            return None
        return UserResponse.model_validate(user)

    async def list_staff(
        self,
        context: RequestContext,
        *,
        skip: int = 0,
        limit: int = 100,
    ) -> UserListResponse:
        self._require_staff_management(context)
        items = await self._users.list_staff(
            context.restaurant_id,
            skip=skip,
            limit=limit,
        )
        total = await self._users.count_staff(context.restaurant_id)
        return UserListResponse(
            items=[UserResponse.model_validate(u) for u in items],
            total=total,
        )

    async def get_by_id(self, context: RequestContext, user_id: uuid.UUID) -> UserResponse:
        if user_id != context.user_id:
            self._require_staff_management(context)

        user = await self._users.get_by_id(
            user_id,
            restaurant_id=context.restaurant_id,
        )
        if not user:
            raise NotFoundError(message="User not found")
        return UserResponse.model_validate(user)

    @staticmethod
    def _require_staff_management(context: RequestContext) -> None:
        if context.role in (UserRole.ADMIN, UserRole.MANAGER):
            return
        context.require_permission(ModulePermission.STAFF)
