"""Authentication endpoints."""

from fastapi import APIRouter

from app.api.deps import AuthServiceDep, FirebaseTokenDep, RequestContextDep
from app.schemas.auth import SessionCreateRequest, SessionResponse
from app.schemas.common import SuccessResponse

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post(
    "/session",
    response_model=SuccessResponse[SessionResponse],
    summary="Exchange Firebase ID token for application session",
    description=(
        "Verifies the Firebase ID token, bootstraps or links the user profile, "
        "and returns role plus module permissions."
    ),
)
async def create_session(
    token_payload: FirebaseTokenDep,
    auth_service: AuthServiceDep,
    body: SessionCreateRequest | None = None,
) -> SuccessResponse[SessionResponse]:
    display_name = body.name if body else None
    session = await auth_service.create_session(token_payload, display_name=display_name)
    return SuccessResponse(data=session)


@router.get(
    "/me",
    response_model=SuccessResponse[SessionResponse],
    summary="Current authenticated session",
    description="Returns the same payload shape as POST /auth/session for the current user.",
)
async def get_auth_me(
    context: RequestContextDep,
    auth_service: AuthServiceDep,
) -> SuccessResponse[SessionResponse]:
    session = await auth_service.get_session_for_user(context.user_id)
    return SuccessResponse(data=session)
