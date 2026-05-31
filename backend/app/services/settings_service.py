"""Restaurant configuration."""

import uuid
from datetime import time

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.enums import ModulePermission
from app.core.exceptions import NotFoundError
from app.core.security import RequestContext
from app.models.operating_hour import OperatingHour
from app.repositories.restaurant_repository import RestaurantRepository
from app.schemas.settings import (
    RestaurantSettingsResponse,
    RestaurantSettingsUpdate,
)


class SettingsService:
    def __init__(self, session: AsyncSession) -> None:
        self._restaurants = RestaurantRepository(session)

    async def get_settings(self, context: RequestContext) -> RestaurantSettingsResponse:
        restaurant = await self._restaurants.get_by_id(
            context.restaurant_id,
            load_hours=True,
        )
        if not restaurant:
            raise NotFoundError(message="Restaurant not found")
        return RestaurantSettingsResponse.model_validate(restaurant)

    async def update_settings(
        self,
        context: RequestContext,
        payload: RestaurantSettingsUpdate,
    ) -> RestaurantSettingsResponse:
        context.require_permission(ModulePermission.SETTINGS)

        restaurant = await self._restaurants.get_by_id(
            context.restaurant_id,
            load_hours=True,
        )
        if not restaurant:
            raise NotFoundError(message="Restaurant not found")

        update_data = payload.model_dump(exclude_unset=True, exclude={"operating_hours"})
        for field, value in update_data.items():
            setattr(restaurant, field, value)

        if payload.operating_hours is not None:
            hours = [
                OperatingHour(
                    restaurant_id=context.restaurant_id,
                    day_of_week=item.day_of_week,
                    open_time=item.open_time,
                    close_time=item.close_time,
                    is_closed=item.is_closed,
                )
                for item in payload.operating_hours
            ]
            await self._restaurants.replace_operating_hours(context.restaurant_id, hours)

        await self._session.flush()
        refreshed = await self._restaurants.get_by_id(context.restaurant_id, load_hours=True)
        assert refreshed is not None
        return RestaurantSettingsResponse.model_validate(refreshed)

    @property
    def _session(self) -> AsyncSession:
        return self._restaurants.session
