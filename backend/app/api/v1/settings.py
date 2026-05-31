"""Restaurant settings endpoints."""

from typing import Annotated

from fastapi import APIRouter, Depends

from app.api.deps import RequestContextDep, SettingsServiceDep, require_permission
from app.core.enums import ModulePermission, UserRole
from app.core.exceptions import AuthorizationError
from app.core.security import RequestContext
from app.schemas.common import SuccessResponse
from app.schemas.settings import RestaurantSettingsResponse, RestaurantSettingsUpdate

router = APIRouter(prefix="/settings", tags=["Settings"])


async def require_staff_context(context: RequestContextDep) -> RequestContext:
    if context.role == UserRole.CUSTOMER:
        raise AuthorizationError(
            message="Restaurant settings are not available for customer accounts",
            code="CUSTOMER_SETTINGS_FORBIDDEN",
        )
    return context


StaffContextDep = Annotated[RequestContext, Depends(require_staff_context)]


@router.get(
    "",
    response_model=SuccessResponse[RestaurantSettingsResponse],
    summary="Get restaurant settings",
    description="Returns restaurant profile, tax configuration, and operating hours.",
)
async def get_settings(
    context: StaffContextDep,
    settings_service: SettingsServiceDep,
) -> SuccessResponse[RestaurantSettingsResponse]:
    data = await settings_service.get_settings(context)
    return SuccessResponse(data=data)


@router.patch(
    "",
    response_model=SuccessResponse[RestaurantSettingsResponse],
    summary="Update restaurant settings",
    dependencies=[Depends(require_permission(ModulePermission.SETTINGS))],
)
async def update_settings(
    payload: RestaurantSettingsUpdate,
    context: StaffContextDep,
    settings_service: SettingsServiceDep,
) -> SuccessResponse[RestaurantSettingsResponse]:
    data = await settings_service.update_settings(context, payload)
    return SuccessResponse(data=data)
