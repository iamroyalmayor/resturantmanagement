"""Health and readiness endpoints."""

from fastapi import APIRouter, status
from fastapi.responses import JSONResponse
from sqlalchemy import text

from app import __version__
from app.api.deps import SettingsDep
from app.db.session import check_database_connection, get_async_session_factory
from app.schemas.common import SuccessResponse
from app.schemas.health import HealthResponse, ReadinessChecks, ReadinessResponse

router = APIRouter(tags=["Health"])


@router.get("/health", response_model=SuccessResponse[HealthResponse])
async def health() -> SuccessResponse[HealthResponse]:
    """Liveness probe — process is running."""
    return SuccessResponse(
        data=HealthResponse(
            status="ok",
            service="restaurantos-api",
            version=__version__,
        )
    )


@router.get("/ready")
async def readiness(settings: SettingsDep) -> JSONResponse:
    """
    Readiness probe — verifies database connectivity.
    Optionally checks Alembic revision when READY_CHECK_MIGRATIONS=true.
    """
    db_ok = await check_database_connection()
    migrations_ok: bool | None = None

    if settings.ready_check_migrations:
        migrations_ok = await _check_migrations_at_head()

    checks = ReadinessChecks(database=db_ok, migrations=migrations_ok)
    all_ok = db_ok and (migrations_ok is not False)

    payload = SuccessResponse(
        data=ReadinessResponse(
            status="ready" if all_ok else "not_ready",
            checks=checks,
        )
    )

    return JSONResponse(
        status_code=status.HTTP_200_OK if all_ok else status.HTTP_503_SERVICE_UNAVAILABLE,
        content=payload.model_dump(mode="json"),
    )


async def _check_migrations_at_head() -> bool:
    """Return True if alembic_version exists (migrations have been applied)."""
    try:
        session_factory = get_async_session_factory()
        async with session_factory() as session:
            result = await session.execute(
                text("SELECT version_num FROM alembic_version LIMIT 1")
            )
            row = result.first()
            return row is not None
    except Exception:
        return False
