"""Table management endpoints for staff."""

from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Query

from app.api.deps import RequestContextDep, TableServiceDep
from app.schemas.common import SuccessResponse
from app.schemas.table import TableCreate, TableUpdate, TableSchema

router = APIRouter(prefix="/tables", tags=["Table Management"])


@router.post(
    "",
    response_model=SuccessResponse[TableSchema],
    summary="Create restaurant table",
)
async def create_table(
    data: TableCreate,
    context: RequestContextDep,
    table_service: TableServiceDep,
) -> SuccessResponse[TableSchema]:
    table = await table_service.create_table(context, data)
    return SuccessResponse(data=table)


@router.get(
    "",
    response_model=SuccessResponse[List[TableSchema]],
    summary="List all tables",
)
async def list_tables(
    context: RequestContextDep,
    table_service: TableServiceDep,
    active_only: bool = Query(False),
) -> SuccessResponse[List[TableSchema]]:
    tables = await table_service.list_tables(context, active_only=active_only)
    return SuccessResponse(data=tables)


@router.patch(
    "/{table_id}",
    response_model=SuccessResponse[TableSchema],
    summary="Update table details",
)
async def update_table(
    table_id: UUID,
    data: TableUpdate,
    context: RequestContextDep,
    table_service: TableServiceDep,
) -> SuccessResponse[TableSchema]:
    table = await table_service.update_table(context, table_id, data)
    return SuccessResponse(data=table)


@router.post(
    "/{table_id}/qr/regenerate",
    response_model=SuccessResponse[TableSchema],
    summary="Regenerate secure QR token",
)
async def regenerate_qr_token(
    table_id: UUID,
    context: RequestContextDep,
    table_service: TableServiceDep,
) -> SuccessResponse[TableSchema]:
    table = await table_service.regenerate_qr_token(context, table_id)
    return SuccessResponse(data=table)


@router.delete(
    "/{table_id}",
    response_model=SuccessResponse[None],
    summary="Delete table",
)
async def delete_table(
    table_id: UUID,
    context: RequestContextDep,
    table_service: TableServiceDep,
) -> SuccessResponse[None]:
    await table_service.delete_table(context, table_id)
    return SuccessResponse(data=None)
