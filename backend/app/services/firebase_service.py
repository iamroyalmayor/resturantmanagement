"""Firebase Admin SDK initialization and ID token verification."""

from __future__ import annotations

import os
from functools import lru_cache
from typing import Any

import firebase_admin
from firebase_admin import auth, credentials

from app.core.config import Settings
from app.core.exceptions import AuthenticationError, ExternalServiceError
from app.core.logging import get_logger
from app.core.security import FirebaseTokenPayload

logger = get_logger(__name__)


class FirebaseService:
    """Wraps Firebase Admin SDK for authentication."""

    def __init__(self, settings: Settings) -> None:
        self._settings = settings
        self._initialized = False

    def initialize(self) -> None:
        if not self._settings.firebase_enabled:
            logger.warning("firebase_disabled")
            return

        if firebase_admin._apps:
            self._initialized = True
            return

        if self._settings.firebase_auth_emulator_host:
            os.environ.setdefault(
                "FIREBASE_AUTH_EMULATOR_HOST",
                self._settings.firebase_auth_emulator_host,
            )
            logger.info(
                "firebase_auth_emulator_configured",
                host=self._settings.firebase_auth_emulator_host,
            )

        cred: credentials.Base | None = None
        if self._settings.google_application_credentials:
            cred = credentials.Certificate(self._settings.google_application_credentials)
        elif self._settings.is_development:
            logger.warning("firebase_credentials_missing_using_default_app")
        else:
            raise ExternalServiceError(
                message="Firebase credentials are not configured",
                code="FIREBASE_NOT_CONFIGURED",
            )

        options: dict[str, Any] = {}
        if self._settings.firebase_project_id:
            options["projectId"] = self._settings.firebase_project_id

        firebase_admin.initialize_app(cred, options or None)
        self._initialized = True
        logger.info("firebase_initialized", project_id=self._settings.firebase_project_id)

    @property
    def is_enabled(self) -> bool:
        return self._settings.firebase_enabled

    @property
    def is_initialized(self) -> bool:
        return self._initialized or bool(firebase_admin._apps)

    def verify_id_token(self, token: str) -> FirebaseTokenPayload:
        if not self._settings.firebase_enabled:
            return self._verify_dev_token(token)

        return self._verify_firebase_token(token)

    def _verify_dev_token(self, token: str) -> FirebaseTokenPayload:
        """Local development token when Firebase is disabled."""
        if self._settings.is_production:
            raise AuthenticationError(
                message="Firebase authentication is disabled",
                code="FIREBASE_DISABLED",
            )
        if not self._settings.dev_auth_enabled:
            raise AuthenticationError(
                message="Firebase authentication is disabled",
                code="FIREBASE_DISABLED",
            )
        if token != self._settings.dev_auth_token:
            raise AuthenticationError(message="Invalid development auth token")

        return FirebaseTokenPayload(
            firebase_uid=self._settings.dev_auth_firebase_uid,
            email=self._settings.dev_auth_email,
            email_verified=True,
        )

    def _verify_firebase_token(self, token: str) -> FirebaseTokenPayload:

        if not self.is_initialized:
            self.initialize()

        try:
            claims: dict[str, Any] = auth.verify_id_token(token)
        except auth.InvalidIdTokenError as exc:
            raise AuthenticationError(message="Invalid Firebase ID token") from exc
        except auth.ExpiredIdTokenError as exc:
            raise AuthenticationError(message="Firebase ID token has expired") from exc
        except Exception as exc:
            logger.exception("firebase_token_verification_failed")
            raise ExternalServiceError(
                message="Unable to verify authentication token",
                code="FIREBASE_VERIFICATION_FAILED",
            ) from exc

        firebase_uid = claims.get("uid") or claims.get("sub")
        if not firebase_uid:
            raise AuthenticationError(message="Token missing subject claim")

        return FirebaseTokenPayload(
            firebase_uid=str(firebase_uid),
            email=claims.get("email"),
            email_verified=bool(claims.get("email_verified", False)),
            raw_claims=claims,
        )


@lru_cache
def get_firebase_service() -> FirebaseService:
    from app.core.config import get_settings

    return FirebaseService(get_settings())


def clear_firebase_service_cache() -> None:
    get_firebase_service.cache_clear()
