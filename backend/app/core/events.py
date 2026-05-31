"""In-process domain event bus (foundation for notifications and side effects)."""

from collections import defaultdict
from collections.abc import Awaitable, Callable
from typing import Any

from app.core.logging import get_logger

logger = get_logger(__name__)

EventHandler = Callable[[dict[str, Any]], Awaitable[None] | None]


class EventBus:
    """Simple async-capable event bus for modular monolith boundaries."""

    def __init__(self) -> None:
        self._handlers: dict[str, list[EventHandler]] = defaultdict(list)

    def subscribe(self, event_name: str, handler: EventHandler) -> None:
        self._handlers[event_name].append(handler)

    async def publish(self, event_name: str, payload: dict[str, Any]) -> None:
        handlers = self._handlers.get(event_name, [])
        if not handlers:
            logger.debug("event_no_handlers", event_name=event_name)
            return

        for handler in handlers:
            try:
                result = handler(payload)
                if hasattr(result, "__await__"):
                    await result
            except Exception:
                logger.exception("event_handler_failed", event_name=event_name)


event_bus = EventBus()
