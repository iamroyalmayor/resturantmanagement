"""User data access."""

import uuid

from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.core.enums import UserRole
from app.models.user import User
from app.repositories.base import BaseRepository


class UserRepository(BaseRepository):
    async def get_by_id(
        self,
        user_id: uuid.UUID,
        *,
        restaurant_id: uuid.UUID | None = None,
        load_permissions: bool = False,
    ) -> User | None:
        stmt = select(User).where(User.id == user_id, User.deleted_at.is_(None))
        if restaurant_id is not None:
            stmt = stmt.where(User.restaurant_id == restaurant_id)
        if load_permissions:
            stmt = stmt.options(selectinload(User.staff_permissions))
        result = await self._session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_firebase_uid(
        self,
        firebase_uid: str,
        *,
        load_permissions: bool = False,
    ) -> User | None:
        stmt = select(User).where(
            User.firebase_uid == firebase_uid,
            User.deleted_at.is_(None),
        )
        if load_permissions:
            stmt = stmt.options(selectinload(User.staff_permissions))
        result = await self._session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_email(
        self,
        email: str,
        restaurant_id: uuid.UUID,
        *,
        load_permissions: bool = False,
    ) -> User | None:
        stmt = select(User).where(
            User.email == email,
            User.restaurant_id == restaurant_id,
            User.deleted_at.is_(None),
        )
        if load_permissions:
            stmt = stmt.options(selectinload(User.staff_permissions))
        result = await self._session.execute(stmt)
        return result.scalar_one_or_none()

    async def list_staff(
        self,
        restaurant_id: uuid.UUID,
        *,
        skip: int = 0,
        limit: int = 100,
    ) -> list[User]:
        stmt = (
            select(User)
            .where(
                User.restaurant_id == restaurant_id,
                User.deleted_at.is_(None),
                User.role != UserRole.CUSTOMER,
            )
            .order_by(User.name)
            .offset(skip)
            .limit(limit)
        )
        result = await self._session.execute(stmt)
        return list(result.scalars().all())

    async def count_staff(self, restaurant_id: uuid.UUID) -> int:
        from sqlalchemy import func

        stmt = (
            select(func.count())
            .select_from(User)
            .where(
                User.restaurant_id == restaurant_id,
                User.deleted_at.is_(None),
                User.role != UserRole.CUSTOMER,
            )
        )
        result = await self._session.execute(stmt)
        return int(result.scalar_one())

    async def add(self, user: User) -> User:
        self._session.add(user)
        await self._session.flush()
        await self._session.refresh(user)
        return user
