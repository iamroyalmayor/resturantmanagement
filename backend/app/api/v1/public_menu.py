"""Public-facing menu endpoints."""

from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Query

from app.api.deps import MenuServiceDep, SettingsDep
from app.schemas.common import SuccessResponse
from app.schemas.menu import PublicMenuResponse

router = APIRouter(prefix="/public/menu", tags=["Public Menu"])


@router.get(
    "",
    response_model=SuccessResponse[PublicMenuResponse],
    summary="Get full public menu",
    description="Returns all active categories and their available items for the public ordering site.",
)
async def get_public_menu(
    menu_service: MenuServiceDep,
    settings: SettingsDep,
    table_token: Optional[UUID] = Query(None),
) -> SuccessResponse[PublicMenuResponse]:
    # In MVP, we use the global RESTAURANT_ID from settings
    # Later this will resolve from the request context or table_token
    menu = await menu_service.get_public_menu(settings.restaurant_id, table_token=table_token)
    return SuccessResponse(data=menu)
