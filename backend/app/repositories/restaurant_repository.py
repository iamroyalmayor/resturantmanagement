"""Restaurant and settings data access."""

import uuid

from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.models.operating_hour import OperatingHour
from app.models.restaurant import Restaurant
from app.repositories.base import BaseRepository


class RestaurantRepository(BaseRepository):
    async def get_by_id(
        self,
        restaurant_id: uuid.UUID,
        *,
        load_hours: bool = False,
    ) -> Restaurant | None:
        stmt = select(Restaurant).where(Restaurant.id == restaurant_id)
        if load_hours:
            stmt = stmt.options(selectinload(Restaurant.operating_hours))
        result = await self._session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_first(self) -> Restaurant | None:
        stmt = select(Restaurant).order_by(Restaurant.created_at).limit(1)
        result = await self._session.execute(stmt)
        return result.scalar_one_or_none()

    async def add(self, restaurant: Restaurant) -> Restaurant:
        self._session.add(restaurant)
        await self._session.flush()
        await self._session.refresh(restaurant)
        return restaurant

    async def replace_operating_hours(
        self,
        restaurant_id: uuid.UUID,
        hours: list[OperatingHour],
    ) -> None:
        existing = await self._session.execute(
            select(OperatingHour).where(OperatingHour.restaurant_id == restaurant_id)
        )
        for row in existing.scalars().all():
            await self._session.delete(row)
        for hour in hours:
            self._session.add(hour)
        await self._session.flush()
