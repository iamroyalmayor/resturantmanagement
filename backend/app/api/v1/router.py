"""Aggregate API v1 routers."""

from fastapi import APIRouter

from app.api.v1 import auth, health, menu, public_menu, settings, users, tables, public_tables, orders, public_orders, kitchen

api_v1_router = APIRouter()

api_v1_router.include_router(health.router)
api_v1_router.include_router(auth.router)
api_v1_router.include_router(users.router)
api_v1_router.include_router(settings.router)
api_v1_router.include_router(menu.router)
api_v1_router.include_router(public_menu.router)
api_v1_router.include_router(tables.router)
api_v1_router.include_router(public_tables.router)
api_v1_router.include_router(orders.router)
api_v1_router.include_router(public_orders.router)
api_v1_router.include_router(kitchen.router)
