"""Public-facing table endpoints."""

from fastapi import APIRouter

from app.api.deps import TableServiceDep
from app.schemas.common import SuccessResponse
from app.schemas.table import PublicTableContextResponse

router = APIRouter(prefix="/public/table", tags=["Public Ordering Context"])


@router.get(
    "/{token}",
    response_model=SuccessResponse[PublicTableContextResponse],
    summary="Resolve QR ordering context",
    description="Resolves a secure QR token into restaurant and table context for the guest.",
)
async def resolve_table(
    token: str,
    table_service: TableServiceDep,
) -> SuccessResponse[PublicTableContextResponse]:
    context = await table_service.resolve_table_context(token)
    return SuccessResponse(data=context)
