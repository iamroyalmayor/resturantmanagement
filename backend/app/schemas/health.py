"""Health check response schemas."""

from pydantic import BaseModel


class HealthResponse(BaseModel):
    status: str
    service: str
    version: str


class ReadinessChecks(BaseModel):
    database: bool
    migrations: bool | None = None


class ReadinessResponse(BaseModel):
    status: str
    checks: ReadinessChecks
