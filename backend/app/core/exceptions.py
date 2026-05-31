"""Application exception hierarchy and HTTP error codes."""

from typing import Any


class AppException(Exception):
    """Base application exception with stable machine-readable code."""

    code: str = "APP_ERROR"
    status_code: int = 500
    message: str = "An unexpected error occurred"

    def __init__(
        self,
        message: str | None = None,
        *,
        code: str | None = None,
        details: dict[str, Any] | None = None,
    ) -> None:
        self.message = message or self.message
        if code:
            self.code = code
        self.details = details or {}
        super().__init__(self.message)


class ValidationAppError(AppException):
    code = "VALIDATION_ERROR"
    status_code = 422
    message = "Validation failed"


class AuthenticationError(AppException):
    code = "AUTHENTICATION_ERROR"
    status_code = 401
    message = "Authentication required"


class AuthorizationError(AppException):
    code = "AUTHORIZATION_ERROR"
    status_code = 403
    message = "Permission denied"


class NotFoundError(AppException):
    code = "NOT_FOUND"
    status_code = 404
    message = "Resource not found"


class ConflictError(AppException):
    code = "CONFLICT"
    status_code = 409
    message = "Resource conflict"


class RateLimitError(AppException):
    code = "RATE_LIMIT_EXCEEDED"
    status_code = 429
    message = "Too many requests"


class ExternalServiceError(AppException):
    code = "EXTERNAL_SERVICE_ERROR"
    status_code = 502
    message = "External service unavailable"
