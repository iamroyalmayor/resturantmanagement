"""Order management endpoints for staff."""

from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Query

from app.api.deps import RequestContextDep, OrderServiceDep
from app.schemas.common import SuccessResponse
from app.schemas.order import OrderSchema, OrderStatusUpdate, OrderStatus
from app.core.exceptions import ValidationAppError

router = APIRouter(prefix="/orders", tags=["Order Management"])


@router.get(
    "",
    response_model=SuccessResponse[dict], # Using dict to match paginated structure
    summary="List restaurant orders",
)
async def list_orders(
    context: RequestContextDep,
    order_service: OrderServiceDep,
    status: Optional[OrderStatus] = Query(None),
    order_number: Optional[str] = Query(None),
    table_id: Optional[UUID] = Query(None),
    source: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
) -> SuccessResponse[dict]:
    result = await order_service.list_orders(
        context, 
        status=status, 
        order_number=order_number,
        table_id=table_id,
        source=source,
        limit=limit,
        offset=offset
    )
    return SuccessResponse(data=result)


@router.get(
    "/{order_id}",
    response_model=SuccessResponse[OrderSchema],
    summary="Get order details",
)
async def get_order(
    order_id: UUID,
    context: RequestContextDep,
    order_service: OrderServiceDep,
) -> SuccessResponse[OrderSchema]:
    order = await order_service.get_order(context, order_id)
    return SuccessResponse(data=order)


@router.patch(
    "/{order_id}/status",
    response_model=SuccessResponse[OrderSchema],
    summary="Update order status",
)
async def update_order_status(
    order_id: UUID,
    data: OrderStatusUpdate,
    context: RequestContextDep,
    order_service: OrderServiceDep,
) -> SuccessResponse[OrderSchema]:
    order = await order_service.update_status(context, order_id, data)
    return SuccessResponse(data=order)
