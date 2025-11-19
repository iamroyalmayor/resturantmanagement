// Menu-specific types
export interface MenuCategory {
  id: string;
  name: string;
  description?: string;
  displayOrder: number;
  isActive: boolean;
  image?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface MenuModifier {
  id: string;
  name: string;
  description?: string;
  price: number;
  category: 'size' | 'addon' | 'customization' | 'sauce' | 'side';
  isRequired: boolean;
  maxSelections?: number;
  options?: ModifierOption[];
}

export interface ModifierOption {
  id: string;
  name: string;
  price: number;
  isDefault?: boolean;
}

export interface NutritionalInfo {
  calories: number;
  protein: number;
  carbohydrates: number;
  fat: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  categoryId: string;
  category?: MenuCategory;
  image?: string;
  images?: string[];
  isAvailable: boolean;
  isPopular: boolean;
  isFeatured: boolean;
  preparationTime: number;
  servingSize?: string;
  ingredients: string[];
  allergens: string[];
  dietaryTags: string[];
  spiceLevel?: 'mild' | 'medium' | 'hot' | 'extra-hot';
  nutritionalInfo?: NutritionalInfo;
  modifiers: MenuModifier[];
  variants?: MenuVariant[];
  cost: number;
  profitMargin: number;
  displayOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface MenuVariant {
  id: string;
  name: string;
  price: number;
  description?: string;
  isDefault?: boolean;
}

export interface MenuFilters {
  categoryId?: string;
  isAvailable?: boolean;
  isPopular?: boolean;
  isFeatured?: boolean;
  dietaryTags?: string[];
  allergens?: string[];
  priceRange?: {
    min: number;
    max: number;
  };
  searchTerm?: string;
}

export interface MenuStats {
  totalItems: number;
  availableItems: number;
  popularItems: number;
  featuredItems: number;
  averagePrice: number;
  averageProfitMargin: number;
  totalCategories: number;
}