"""Firebase Cloud Messaging (FCM) delivery service."""

from __future__ import annotations

from dataclasses import dataclass, field
from functools import lru_cache
from typing import Any

from firebase_admin import messaging

from app.core.config import Settings
from app.core.logging import get_logger
from app.services.firebase_service import FirebaseService

logger = get_logger(__name__)


@dataclass(slots=True)
class PushMessage:
    """FCM message payload."""

    title: str
    body: str
    data: dict[str, str] = field(default_factory=dict)


class NotificationService:
    """Sends push notifications via Firebase Cloud Messaging."""

    def __init__(self, settings: Settings, firebase_service: FirebaseService) -> None:
        self._settings = settings
        self._firebase = firebase_service

    @property
    def is_enabled(self) -> bool:
        return self._settings.fcm_enabled and self._settings.firebase_enabled

    def _ensure_firebase(self) -> None:
        if not self.is_enabled:
            return
        if not self._firebase.is_initialized:
            self._firebase.initialize()

    async def send_to_token(self, token: str, message: PushMessage) -> str | None:
        """Send a notification to a single device token. Returns FCM message ID."""
        if not self.is_enabled:
            logger.debug("fcm_send_skipped_disabled", token_prefix=token[:8])
            return None

        self._ensure_firebase()
        fcm_message = messaging.Message(
            notification=messaging.Notification(title=message.title, body=message.body),
            data=message.data,
            token=token,
        )
        try:
            message_id = messaging.send(fcm_message)
            logger.info("fcm_sent", message_id=message_id)
            return message_id
        except Exception:
            logger.exception("fcm_send_failed", token_prefix=token[:8])
            return None

    async def send_to_topic(self, topic: str, message: PushMessage) -> str | None:
        """Send a notification to an FCM topic (e.g. kitchen or managers)."""
        if not self.is_enabled:
            logger.debug("fcm_topic_send_skipped_disabled", topic=topic)
            return None

        self._ensure_firebase()
        fcm_message = messaging.Message(
            notification=messaging.Notification(title=message.title, body=message.body),
            data=message.data,
            topic=topic,
        )
        try:
            message_id = messaging.send(fcm_message)
            logger.info("fcm_topic_sent", topic=topic, message_id=message_id)
            return message_id
        except Exception:
            logger.exception("fcm_topic_send_failed", topic=topic)
            return None

    async def subscribe_tokens_to_topic(self, tokens: list[str], topic: str) -> None:
        if not self.is_enabled or not tokens:
            return
        self._ensure_firebase()
        try:
            response = messaging.subscribe_to_topic(tokens, topic)
            logger.info(
                "fcm_topic_subscribe",
                topic=topic,
                success_count=response.success_count,
                failure_count=response.failure_count,
            )
        except Exception:
            logger.exception("fcm_topic_subscribe_failed", topic=topic)

    @staticmethod
    def restaurant_topic(restaurant_id: str, channel: str) -> str:
        """Build a namespaced FCM topic for a restaurant role channel."""
        return f"restaurant_{restaurant_id}_{channel}"


@lru_cache
def get_notification_service() -> NotificationService:
    from app.core.config import get_settings

    return NotificationService(get_settings(), get_firebase_service())
