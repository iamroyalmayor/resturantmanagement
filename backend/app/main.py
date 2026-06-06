"""FastAPI application factory and entrypoint."""

from contextlib import asynccontextmanager
from collections.abc import AsyncIterator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app import __version__
from app.api.exception_handlers import register_exception_handlers
from app.api.middleware import RequestContextMiddleware
from app.api.v1.router import api_v1_router
from app.api.v1.kitchen import router as kitchen_router
from app.api.v1.inventory import router as inventory_router
from app.core.config import Settings, get_settings
from app.core.logging import get_logger, setup_logging
from app.db.session import dispose_engine, init_engine
from app.services.firebase_service import get_firebase_service

logger = get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    settings: Settings = app.state.settings
    setup_logging(settings)
    settings.validate_startup()

    init_engine(settings)

    firebase = get_firebase_service()
    if settings.firebase_enabled:
        try:
            firebase.initialize()
        except Exception:
            if settings.is_production:
                raise
            logger.warning("firebase_init_skipped_in_development")

    logger.info(
        "application_started",
        app_env=settings.app_env,
        version=__version__,
    )
    yield

    await dispose_engine()
    logger.info("application_stopped")


def create_app(settings: Settings | None = None) -> FastAPI:
    """Application factory used by uvicorn and tests."""
    resolved_settings = settings or get_settings()

    app = FastAPI(
        title=resolved_settings.app_name,
        version=__version__,
        lifespan=lifespan,
        docs_url="/docs" if resolved_settings.docs_enabled else None,
        redoc_url="/redoc" if resolved_settings.docs_enabled else None,
        openapi_url="/api/v1/openapi.json" if resolved_settings.docs_enabled else None,
    )

    app.state.settings = resolved_settings

    register_exception_handlers(app)

    app.add_middleware(
        CORSMiddleware,
        allow_origins=resolved_settings.cors_origin_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
        expose_headers=["X-Request-ID"],
    )
    app.add_middleware(RequestContextMiddleware)

    # Top-level health (outside versioned API for load balancers)
    app.include_router(api_v1_router, prefix="/api/v1")

    # Root-level probes for Docker HEALTHCHECK and load balancers
    from app.api.v1.health import health as health_endpoint, readiness

    app.add_api_route("/health", health_endpoint, methods=["GET"], tags=["Health"])
    app.add_api_route("/ready", readiness, methods=["GET"], tags=["Health"])

    return app


app = create_app()
