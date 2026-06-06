"""Public-facing order endpoints for guests."""

from fastapi import APIRouter, Header
from typing import Annotated
from uuid import UUID

from app.api.deps import OrderServiceDep, RequestContextDep
from app.schemas.common import SuccessResponse
from app.schemas.order import OrderCreate, OrderSchema

router = APIRouter(prefix="/public/orders", tags=["Public Ordering"])


@router.post(
    "",
    response_model=SuccessResponse[OrderSchema],
    summary="Place a new order (Guest/QR)",
    description="Placement of a new order from a guest. Snapshots pricing and item data for immutability.",
)
async def place_order(
    data: OrderCreate,
    context: RequestContextDep,
    order_service: OrderServiceDep,
) -> SuccessResponse[OrderSchema]:
    order = await order_service.place_order(context, data)
    return SuccessResponse(data=order)


@router.get(
    "/{order_number}",
    response_model=SuccessResponse[OrderSchema],
    summary="Track order status",
    description="Allows guests to track their order status using their order number.",
)
async def track_order(
    order_number: str,
    x_restaurant_id: Annotated[UUID, Header()],
    order_service: OrderServiceDep,
) -> SuccessResponse[OrderSchema]:
    order = await order_service._repo.get_by_number(x_restaurant_id, order_number)
    if not order:
        from app.core.exceptions import NotFoundError
        raise NotFoundError(message="Order not found")
    return SuccessResponse(data=OrderSchema.model_validate(order))


@router.post(
    "/preview",
    response_model=SuccessResponse[dict], # Using dict for now to match OrderPreviewResponse structure
    summary="Preview order pricing",
    description="Calculates taxes, service charges, and totals before order placement.",
)
async def preview_order(
    data: OrderCreate,
    x_restaurant_id: Annotated[UUID, Header()],
    order_service: OrderServiceDep,
) -> SuccessResponse[dict]:
    preview = await order_service.preview_order(x_restaurant_id, data)
    return SuccessResponse(data=preview)
