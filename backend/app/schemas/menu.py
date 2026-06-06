"""Pydantic schemas for the Menu domain."""

from uuid import UUID
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field

from app.models.menu import ModifierCategory, SpiceLevel


# --- Modifier Options ---

class MenuModifierOptionBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    price: float = Field(0.0, ge=0)
    is_default: bool = False

class MenuModifierOptionCreate(MenuModifierOptionBase):
    pass

class MenuModifierOptionSchema(MenuModifierOptionBase):
    id: UUID
    modifier_id: UUID
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


# --- Modifiers ---

class MenuModifierBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = None
    category: ModifierCategory = ModifierCategory.ADDON
    is_required: bool = False
    max_selections: Optional[int] = Field(None, ge=1)

class MenuModifierCreate(MenuModifierBase):
    options: List[MenuModifierOptionCreate] = []

class MenuModifierSchema(MenuModifierBase):
    id: UUID
    restaurant_id: UUID
    options: List[MenuModifierOptionSchema]
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


# --- Menu Variants ---

class MenuVariantBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    price: float = Field(..., ge=0)
    description: Optional[str] = None
    is_default: bool = False

class MenuVariantCreate(MenuVariantBase):
    pass

class MenuVariantSchema(MenuVariantBase):
    id: UUID
    menu_item_id: UUID
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


# --- Menu Categories ---

class MenuCategoryBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = None
    display_order: int = 0
    is_active: bool = True
    image_url: Optional[str] = None

class MenuCategoryCreate(MenuCategoryBase):
    pass

class MenuCategorySchema(MenuCategoryBase):
    id: UUID
    restaurant_id: UUID
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


# --- Menu Items ---

class MenuItemBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: str
    price: float = Field(..., ge=0)
    cost: float = Field(0.0, ge=0)
    category_id: Optional[UUID] = None
    preparation_time: int = 15
    serving_size: Optional[str] = None
    is_available: bool = True
    is_popular: bool = False
    is_featured: bool = False
    spice_level: Optional[SpiceLevel] = None
    ingredients: List[str] = []
    allergens: List[str] = []
    dietary_tags: List[str] = []
    nutritional_info: dict = {}
    display_order: int = 0
    image_url: Optional[str] = None

class MenuItemCreate(MenuItemBase):
    modifier_ids: List[UUID] = []
    variants: List[MenuVariantCreate] = []

class MenuItemSchema(MenuItemBase):
    id: UUID
    restaurant_id: UUID
    category: Optional[MenuCategorySchema] = None
    modifiers: List[MenuModifierSchema] = []
    variants: List[MenuVariantSchema] = []
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


# --- Public Menu Projection ---

class PublicModifierOptionSchema(BaseModel):
    id: UUID
    name: str
    price: float
    is_default: bool

class PublicModifierSchema(BaseModel):
    id: UUID
    name: str
    description: Optional[str]
    category: ModifierCategory
    is_required: bool
    max_selections: Optional[int]
    options: List[PublicModifierOptionSchema]

class PublicMenuItemSchema(BaseModel):
    id: UUID
    name: str
    description: str
    price: float
    image_url: Optional[str]
    is_popular: bool
    is_featured: bool
    preparation_time: int
    spice_level: Optional[SpiceLevel]
    dietary_tags: List[str]
    allergens: List[str]
    modifiers: List[PublicModifierSchema]
    variants: List[MenuVariantSchema]

class PublicMenuCategorySchema(BaseModel):
    id: UUID
    name: str
    description: Optional[str]
    image_url: Optional[str]
    items: List[PublicMenuItemSchema]

class PublicMenuResponse(BaseModel):
    categories: List[PublicMenuCategorySchema]
