"""Aggregate API v1 routers."""

from fastapi import APIRouter

from app.api.v1 import auth, health, settings, users

api_v1_router = APIRouter()

api_v1_router.include_router(health.router)
api_v1_router.include_router(auth.router)
api_v1_router.include_router(users.router)
api_v1_router.include_router(settings.router)
