"""User profile and staff management endpoints."""

from uuid import UUID

from fastapi import APIRouter, Query

from app.api.deps import RequestContextDep, UserServiceDep
from app.schemas.common import SuccessResponse
from app.schemas.user import UserListResponse, UserResponse

router = APIRouter(prefix="/users", tags=["Users"])


@router.get(
    "/me",
    response_model=SuccessResponse[UserResponse],
    summary="Current user profile",
)
async def get_users_me(
    context: RequestContextDep,
    user_service: UserServiceDep,
) -> SuccessResponse[UserResponse]:
    profile = await user_service.get_me(context)
    return SuccessResponse(data=profile)


@router.get(
    "",
    response_model=SuccessResponse[UserListResponse],
    summary="List staff members",
    description="Lists non-customer users for the restaurant. Requires admin, manager, or staff permission.",
)
async def list_users(
    context: RequestContextDep,
    user_service: UserServiceDep,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=200),
) -> SuccessResponse[UserListResponse]:
    result = await user_service.list_staff(context, skip=skip, limit=limit)
    return SuccessResponse(data=result)


@router.get(
    "/{user_id}",
    response_model=SuccessResponse[UserResponse],
    summary="Get user by ID",
    description="Staff can view colleagues; any user can view their own profile.",
)
async def get_user(
    user_id: UUID,
    context: RequestContextDep,
    user_service: UserServiceDep,
) -> SuccessResponse[UserResponse]:
    profile = await user_service.get_by_id(context, user_id)
    return SuccessResponse(data=profile)
