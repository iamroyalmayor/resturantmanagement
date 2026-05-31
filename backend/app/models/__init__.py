"""ORM models — import all models so Alembic metadata is complete."""

from app.models.fcm_device_token import FcmDeviceToken
from app.models.operating_hour import OperatingHour
from app.models.restaurant import Restaurant
from app.models.staff_permission import StaffPermission
from app.models.user import User

__all__ = [
    "Restaurant",
    "OperatingHour",
    "User",
    "StaffPermission",
    "FcmDeviceToken",
]
