"""WebSocket connection management for real-time kitchen and staff updates."""

import json
from typing import Dict, List, Set, Any
from uuid import UUID

from fastapi import WebSocket


class ConnectionManager:
    """
    Manages WebSocket connections scoped by restaurant_id.
    """

    def __init__(self):
        # restaurant_id -> set of active WebSockets
        self.active_connections: Dict[UUID, Set[WebSocket]] = {}

    async def connect(self, restaurant_id: UUID, websocket: WebSocket):
        await websocket.accept()
        if restaurant_id not in self.active_connections:
            self.active_connections[restaurant_id] = set()
        self.active_connections[restaurant_id].add(websocket)

    def disconnect(self, restaurant_id: UUID, websocket: WebSocket):
        if restaurant_id in self.active_connections:
            self.active_connections[restaurant_id].remove(websocket)
            if not self.active_connections[restaurant_id]:
                del self.active_connections[restaurant_id]

    async def broadcast_to_restaurant(self, restaurant_id: UUID, event_type: str, data: Any):
        """
        Broadcast a standardized event to all connections for a specific restaurant.
        """
        if restaurant_id not in self.active_connections:
            return

        message = {
            "event": event_type,
            "payload": data
        }
        
        # Convert to JSON string if it's a dict or list for payload consistency
        message_json = json.dumps(message, default=str)
        
        # Avoid issues with connections closing while iterating
        dead_connections = set()
        for connection in self.active_connections[restaurant_id]:
            try:
                await connection.send_text(message_json)
            except Exception:
                dead_connections.add(connection)
        
        for dead in dead_connections:
            self.active_connections[restaurant_id].remove(dead)


# Global manager instance
manager = ConnectionManager()
