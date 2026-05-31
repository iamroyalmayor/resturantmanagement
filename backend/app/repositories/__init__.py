"""Data access layer."""

from app.repositories.restaurant_repository import RestaurantRepository
from app.repositories.user_repository import UserRepository

__all__ = ["UserRepository", "RestaurantRepository"]
