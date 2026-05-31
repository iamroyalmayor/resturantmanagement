"""Authentication and session bootstrap."""

from __future__ import annotations

import uuid
from decimal import Decimal

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import Settings
from app.core.enums import UserRole
from app.core.exceptions import AuthenticationError, AuthorizationError
from app.core.logging import get_logger
from app.core.permissions import resolve_permissions
from app.core.security import FirebaseTokenPayload, RequestContext
from app.models.operating_hour import OperatingHour
from app.models.restaurant import Restaurant
from app.models.user import User
from app.repositories.restaurant_repository import RestaurantRepository
from app.repositories.user_repository import UserRepository
from app.schemas.auth import SessionResponse, UserProfileSchema

logger = get_logger(__name__)

DEFAULT_WEEKLY_HOURS: list[tuple[int, str, str, bool]] = [
    (0, "10:00", "22:00", False),
    (1, "10:00", "22:00", False),
    (2, "10:00", "22:00", False),
    (3, "10:00", "23:00", False),
    (4, "10:00", "23:30", False),
    (5, "11:00", "23:30", False),
    (6, "11:00", "21:00", False),
]


class AuthService:
    def __init__(self, session: AsyncSession, settings: Settings) -> None:
        self._session = session
        self._settings = settings
        self._users = UserRepository(session)
        self._restaurants = RestaurantRepository(session)

    async def create_session(
        self,
        token_payload: FirebaseTokenPayload,
        *,
        display_name: str | None = None,
    ) -> SessionResponse:
        """Exchange Firebase token for application session (bootstrap on first login)."""
        user = await self._bootstrap_user(token_payload, display_name=display_name)
        self._ensure_active(user)
        permissions = resolve_permissions(user)
        return SessionResponse(
            user=UserProfileSchema.model_validate(user),
            restaurant_id=user.restaurant_id,
            role=user.role,
            permissions=sorted(permissions, key=lambda p: p.value),
        )

    async def get_session_for_user(self, user_id: uuid.UUID) -> SessionResponse:
        """Build session payload for an already-authenticated user."""
        user = await self._users.get_by_id(user_id, load_permissions=True)
        if not user:
            raise AuthenticationError(message="User not found", code="USER_NOT_FOUND")
        self._ensure_active(user)
        permissions = resolve_permissions(user)
        return SessionResponse(
            user=UserProfileSchema.model_validate(user),
            restaurant_id=user.restaurant_id,
            role=user.role,
            permissions=sorted(permissions, key=lambda p: p.value),
        )

    async def build_request_context(
        self,
        token_payload: FirebaseTokenPayload,
        correlation_id: str,
    ) -> RequestContext:
        """Resolve authenticated user for protected routes (no auto-registration)."""
        user = await self._resolve_existing_user(token_payload)
        self._ensure_active(user)
        permissions = resolve_permissions(user)
        return RequestContext(
            firebase_uid=token_payload.firebase_uid,
            user_id=user.id,
            restaurant_id=user.restaurant_id,
            role=user.role,
            permissions=permissions,
            correlation_id=correlation_id,
            email=user.email,
        )

    async def _bootstrap_user(
        self,
        token_payload: FirebaseTokenPayload,
        *,
        display_name: str | None,
    ) -> User:
        user = await self._users.get_by_firebase_uid(
            token_payload.firebase_uid,
            load_permissions=True,
        )
        if user:
            return await self._maybe_update_profile(user, display_name)

        email = token_payload.email
        if not email:
            raise AuthenticationError(
                message="Email is required for account bootstrap",
                code="EMAIL_REQUIRED",
            )

        restaurant_id = await self._resolve_restaurant_id()
        user = await self._users.get_by_email(email, restaurant_id, load_permissions=True)

        if user:
            if user.firebase_uid and user.firebase_uid != token_payload.firebase_uid:
                raise AuthenticationError(
                    message="Email is associated with another account",
                    code="EMAIL_ALREADY_LINKED",
                )
            user.firebase_uid = token_payload.firebase_uid
            await self._session.flush()
            await self._session.refresh(user, attribute_names=["staff_permissions"])
            return await self._maybe_update_profile(user, display_name)

        name = display_name or email.split("@")[0]
        user = User(
            restaurant_id=restaurant_id,
            firebase_uid=token_payload.firebase_uid,
            email=email.lower(),
            name=name,
            role=UserRole.CUSTOMER,
            is_active=True,
        )
        user = await self._users.add(user)
        await self._session.refresh(user, attribute_names=["staff_permissions"])
        logger.info("user_bootstrapped", user_id=str(user.id), role=user.role.value)
        return user

    async def _resolve_existing_user(self, token_payload: FirebaseTokenPayload) -> User:
        user = await self._users.get_by_firebase_uid(
            token_payload.firebase_uid,
            load_permissions=True,
        )
        if user:
            return user

        email = token_payload.email
        if email:
            restaurant_id = await self._resolve_restaurant_id()
            user = await self._users.get_by_email(email, restaurant_id, load_permissions=True)
            if user:
                if user.firebase_uid is None:
                    user.firebase_uid = token_payload.firebase_uid
                    await self._session.flush()
                    await self._session.refresh(user, attribute_names=["staff_permissions"])
                return user

        raise AuthenticationError(
            message="No application account found. Call POST /api/v1/auth/session first.",
            code="SESSION_REQUIRED",
        )

    async def _resolve_restaurant_id(self) -> uuid.UUID:
        if self._settings.restaurant_id:
            restaurant = await self._restaurants.get_by_id(uuid.UUID(self._settings.restaurant_id))
            if restaurant:
                return restaurant.id

        restaurant = await self._restaurants.get_first()
        if restaurant:
            return restaurant.id

        restaurant = Restaurant(
            name=self._settings.app_name,
            email=self._settings.dev_auth_email,
            timezone="UTC",
            currency_code="NGN",
            tax_rate=Decimal("0.085"),
            service_charge_rate=Decimal("0.18"),
        )
        restaurant = await self._restaurants.add(restaurant)
        await self._seed_operating_hours(restaurant.id)
        logger.info("restaurant_bootstrapped", restaurant_id=str(restaurant.id))
        return restaurant.id

    async def _seed_operating_hours(self, restaurant_id: uuid.UUID) -> None:
        from datetime import time as time_type

        hours: list[OperatingHour] = []
        for day, open_str, close_str, is_closed in DEFAULT_WEEKLY_HOURS:
            open_parts = [int(p) for p in open_str.split(":")]
            close_parts = [int(p) for p in close_str.split(":")]
            hours.append(
                OperatingHour(
                    restaurant_id=restaurant_id,
                    day_of_week=day,
                    open_time=time_type(open_parts[0], open_parts[1]),
                    close_time=time_type(close_parts[0], close_parts[1]),
                    is_closed=is_closed,
                )
            )
        await self._restaurants.replace_operating_hours(restaurant_id, hours)

    async def _maybe_update_profile(self, user: User, display_name: str | None) -> User:
        if display_name and display_name.strip() and user.name != display_name.strip():
            user.name = display_name.strip()
            await self._session.flush()
            await self._session.refresh(user)
        return user

    @staticmethod
    def _ensure_active(user: User) -> None:
        if not user.is_active:
            raise AuthorizationError(
                message="User account is deactivated",
                code="USER_INACTIVE",
            )
