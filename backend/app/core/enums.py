"""Shared domain enumerations."""

import enum


class UserRole(str, enum.Enum):
    ADMIN = "admin"
    MANAGER = "manager"
    WAITER = "waiter"
    KITCHEN = "kitchen"
    CUSTOMER = "customer"


class ModulePermission(str, enum.Enum):
    POS = "pos"
    KITCHEN = "kitchen"
    INVENTORY = "inventory"
    CONVERSATIONS = "conversations"
    REPORTS = "reports"
    ACCOUNTING = "accounting"
    SETTINGS = "settings"
    MENU = "menu"
    ORDERS = "orders"
    RESERVATIONS = "reservations"
    CUSTOMERS = "customers"
    STAFF = "staff"


class DevicePlatform(str, enum.Enum):
    WEB = "web"
    ANDROID = "android"
    IOS = "ios"
