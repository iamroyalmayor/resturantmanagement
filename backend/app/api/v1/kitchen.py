"""Kitchen operations endpoints."""

from typing import List
from uuid import UUID

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.api.deps import RequestContextDep, KitchenServiceDep
from app.schemas.common import SuccessResponse
from app.schemas.kitchen import (
    KitchenOrderSchema, KitchenItemStatusUpdate, KitchenOrderAction
)
from app.core.websockets import manager

router = APIRouter(prefix="/kitchen", tags=["Kitchen Operations"])


@router.get(
    "/queue",
    response_model=SuccessResponse[List[KitchenOrderSchema]],
    summary="Get active kitchen queue",
)
async def get_kitchen_queue(
    context: RequestContextDep,
    kitchen_service: KitchenServiceDep,
) -> SuccessResponse[List[KitchenOrderSchema]]:
    queue = await kitchen_service.get_queue(context)
    return SuccessResponse(data=queue)


@router.patch(
    "/items/{item_id}/status",
    response_model=SuccessResponse[KitchenOrderSchema],
    summary="Update individual item status",
)
async def update_item_status(
    item_id: UUID,
    data: KitchenItemStatusUpdate,
    context: RequestContextDep,
    kitchen_service: KitchenServiceDep,
) -> SuccessResponse[KitchenOrderSchema]:
    order = await kitchen_service.update_item_status(context, item_id, data)
    return SuccessResponse(data=order)


@router.patch(
    "/orders/{order_id}/action",
    response_model=SuccessResponse[KitchenOrderSchema],
    summary="Perform order-level kitchen action",
)
async def perform_order_action(
    order_id: UUID,
    data: KitchenOrderAction,
    context: RequestContextDep,
    kitchen_service: KitchenServiceDep,
) -> SuccessResponse[KitchenOrderSchema]:
    order = await kitchen_service.handle_order_action(context, order_id, data)
    return SuccessResponse(data=order)


@router.websocket("/ws")
async def kitchen_websocket(
    websocket: WebSocket,
    restaurant_id: UUID,
    token: str,
):
    """
    WebSocket endpoint for real-time kitchen updates.
    Requires a valid Firebase ID token and restaurant_id.
    """
    from app.services.firebase_service import get_firebase_service
    from app.db.session import get_async_session_factory
    from app.services.user_service import UserService
    
    firebase = get_firebase_service()
    session_factory = get_async_session_factory()
    
    try:
        await websocket.accept()
        
        # 1. Verify Token
        try:
            payload = firebase.verify_id_token(token)
        except Exception:
            await websocket.close(code=1008)
            return

        # 2. Verify Restaurant Access
        async with session_factory() as session:
            user_service = UserService(session)
            user = await user_service.get_user_by_firebase_uid(payload.firebase_uid)
            
            if not user or str(user.restaurant_id) != str(restaurant_id):
                await websocket.close(code=1008)
                return

        # 3. Register Connection
        await manager.connect(restaurant_id, websocket)
        
        try:
            while True:
                # Keep alive and handle potential incoming messages
                data = await websocket.receive_text()
                # We don't expect messages from kitchen yet, but could be heartbeats
        except WebSocketDisconnect:
            manager.disconnect(restaurant_id, websocket)
            
    except Exception as e:
        # Fallback closure
        try:
            await websocket.close(code=1011) # Internal Error
        except:
            pass
