import { MenuItem, MenuCategory, MenuFilters, MenuStats, MenuModifier } from '../types/menu';

export class MenuService {
  private static instance: MenuService;
  private menuItems: MenuItem[] = [];
  private categories: MenuCategory[] = [];
  private menuListeners: ((items: MenuItem[]) => void)[] = [];
  private categoryListeners: ((categories: MenuCategory[]) => void)[] = [];

  private constructor() {
    this.initializeMockData();
  }

  public static getInstance(): MenuService {
    if (!MenuService.instance) {
      MenuService.instance = new MenuService();
    }
    return MenuService.instance;
  }

  // Subscribe to menu updates
  public subscribeToMenu(callback: (items: MenuItem[]) => void): () => void {
    this.menuListeners.push(callback);
    return () => {
      this.menuListeners = this.menuListeners.filter(listener => listener !== callback);
    };
  }

  public subscribeToCategories(callback: (categories: MenuCategory[]) => void): () => void {
    this.categoryListeners.push(callback);
    return () => {
      this.categoryListeners = this.categoryListeners.filter(listener => listener !== callback);
    };
  }

  private notifyMenuListeners(): void {
    this.menuListeners.forEach(listener => listener([...this.menuItems]));
  }

  private notifyCategoryListeners(): void {
    this.categoryListeners.forEach(listener => listener([...this.categories]));
  }

  // Menu Items CRUD
  public async createMenuItem(itemData: Partial<MenuItem>): Promise<MenuItem> {
    const category = this.categories.find(c => c.id === itemData.categoryId);
    
    const newItem: MenuItem = {
      id: Date.now().toString(),
      name: itemData.name || '',
      description: itemData.description || '',
      price: itemData.price || 0,
      categoryId: itemData.categoryId || '',
      category,
      image: itemData.image,
      images: itemData.images || [],
      isAvailable: itemData.isAvailable ?? true,
      isPopular: itemData.isPopular ?? false,
      isFeatured: itemData.isFeatured ?? false,
      preparationTime: itemData.preparationTime || 15,
      servingSize: itemData.servingSize,
      ingredients: itemData.ingredients || [],
      allergens: itemData.allergens || [],
      dietaryTags: itemData.dietaryTags || [],
      spiceLevel: itemData.spiceLevel,
      nutritionalInfo: itemData.nutritionalInfo,
      modifiers: itemData.modifiers || [],
      variants: itemData.variants || [],
      cost: itemData.cost || 0,
      profitMargin: itemData.profitMargin || 0,
      displayOrder: itemData.displayOrder || this.menuItems.length,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.menuItems.push(newItem);
    this.notifyMenuListeners();
    return newItem;
  }

  public async updateMenuItem(id: string, updates: Partial<MenuItem>): Promise<MenuItem | null> {
    const index = this.menuItems.findIndex(item => item.id === id);
    if (index === -1) return null;

    const updatedItem = {
      ...this.menuItems[index],
      ...updates,
      updatedAt: new Date(),
    };

    // Update category reference if categoryId changed
    if (updates.categoryId) {
      updatedItem.category = this.categories.find(c => c.id === updates.categoryId);
    }

    this.menuItems[index] = updatedItem;
    this.notifyMenuListeners();
    return updatedItem;
  }

  public async deleteMenuItem(id: string): Promise<boolean> {
    const index = this.menuItems.findIndex(item => item.id === id);
    if (index === -1) return false;

    this.menuItems.splice(index, 1);
    this.notifyMenuListeners();
    return true;
  }

  public getMenuItems(filters?: MenuFilters): MenuItem[] {
    let filteredItems = [...this.menuItems];

    if (filters) {
      if (filters.categoryId) {
        filteredItems = filteredItems.filter(item => item.categoryId === filters.categoryId);
      }

      if (filters.isAvailable !== undefined) {
        filteredItems = filteredItems.filter(item => item.isAvailable === filters.isAvailable);
      }

      if (filters.isPopular !== undefined) {
        filteredItems = filteredItems.filter(item => item.isPopular === filters.isPopular);
      }

      if (filters.isFeatured !== undefined) {
        filteredItems = filteredItems.filter(item => item.isFeatured === filters.isFeatured);
      }

      if (filters.dietaryTags && filters.dietaryTags.length > 0) {
        filteredItems = filteredItems.filter(item =>
          filters.dietaryTags!.some(tag => item.dietaryTags.includes(tag))
        );
      }

      if (filters.allergens && filters.allergens.length > 0) {
        filteredItems = filteredItems.filter(item =>
          !filters.allergens!.some(allergen => item.allergens.includes(allergen))
        );
      }

      if (filters.priceRange) {
        filteredItems = filteredItems.filter(item =>
          item.price >= filters.priceRange!.min && item.price <= filters.priceRange!.max
        );
      }

      if (filters.searchTerm) {
        const searchTerm = filters.searchTerm.toLowerCase();
        filteredItems = filteredItems.filter(item =>
          item.name.toLowerCase().includes(searchTerm) ||
          item.description.toLowerCase().includes(searchTerm) ||
          item.ingredients.some(ingredient => ingredient.toLowerCase().includes(searchTerm))
        );
      }
    }

    return filteredItems.sort((a, b) => a.displayOrder - b.displayOrder);
  }

  public getMenuItemById(id: string): MenuItem | null {
    return this.menuItems.find(item => item.id === id) || null;
  }

  // Categories CRUD
  public async createCategory(categoryData: Partial<MenuCategory>): Promise<MenuCategory> {
    const newCategory: MenuCategory = {
      id: Date.now().toString(),
      name: categoryData.name || '',
      description: categoryData.description,
      displayOrder: categoryData.displayOrder || this.categories.length,
      isActive: categoryData.isActive ?? true,
      image: categoryData.image,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.categories.push(newCategory);
    this.notifyCategoryListeners();
    return newCategory;
  }

  public async updateCategory(id: string, updates: Partial<MenuCategory>): Promise<MenuCategory | null> {
    const index = this.categories.findIndex(cat => cat.id === id);
    if (index === -1) return null;

    const updatedCategory = {
      ...this.categories[index],
      ...updates,
      updatedAt: new Date(),
    };

    this.categories[index] = updatedCategory;
    this.notifyCategoryListeners();

    // Update menu items with new category reference
    this.menuItems.forEach(item => {
      if (item.categoryId === id) {
        item.category = updatedCategory;
      }
    });
    this.notifyMenuListeners();

    return updatedCategory;
  }

  public async deleteCategory(id: string): Promise<boolean> {
    const index = this.categories.findIndex(cat => cat.id === id);
    if (index === -1) return false;

    // Check if category has items
    const hasItems = this.menuItems.some(item => item.categoryId === id);
    if (hasItems) {
      throw new Error('Cannot delete category with existing menu items');
    }

    this.categories.splice(index, 1);
    this.notifyCategoryListeners();
    return true;
  }

  public getCategories(): MenuCategory[] {
    return [...this.categories].sort((a, b) => a.displayOrder - b.displayOrder);
  }

  public getCategoryById(id: string): MenuCategory | null {
    return this.categories.find(cat => cat.id === id) || null;
  }

  // Statistics
  public getMenuStats(): MenuStats {
    const totalItems = this.menuItems.length;
    const availableItems = this.menuItems.filter(item => item.isAvailable).length;
    const popularItems = this.menuItems.filter(item => item.isPopular).length;
    const featuredItems = this.menuItems.filter(item => item.isFeatured).length;
    
    const averagePrice = totalItems > 0
      ? this.menuItems.reduce((sum, item) => sum + item.price, 0) / totalItems
      : 0;

    const averageProfitMargin = totalItems > 0
      ? this.menuItems.reduce((sum, item) => sum + item.profitMargin, 0) / totalItems
      : 0;

    return {
      totalItems,
      availableItems,
      popularItems,
      featuredItems,
      averagePrice,
      averageProfitMargin,
      totalCategories: this.categories.length,
    };
  }

  // Bulk operations
  public async updateItemAvailability(itemIds: string[], isAvailable: boolean): Promise<void> {
    itemIds.forEach(id => {
      const item = this.menuItems.find(item => item.id === id);
      if (item) {
        item.isAvailable = isAvailable;
        item.updatedAt = new Date();
      }
    });
    this.notifyMenuListeners();
  }

  public async reorderItems(categoryId: string, itemIds: string[]): Promise<void> {
    const categoryItems = this.menuItems.filter(item => item.categoryId === categoryId);
    
    itemIds.forEach((id, index) => {
      const item = categoryItems.find(item => item.id === id);
      if (item) {
        item.displayOrder = index;
        item.updatedAt = new Date();
      }
    });

    this.notifyMenuListeners();
  }

  public async reorderCategories(categoryIds: string[]): Promise<void> {
    categoryIds.forEach((id, index) => {
      const category = this.categories.find(cat => cat.id === id);
      if (category) {
        category.displayOrder = index;
        category.updatedAt = new Date();
      }
    });

    this.notifyCategoryListeners();
  }

  private initializeMockData(): void {
    // Mock categories
    this.categories = [
      {
        id: 'cat-1',
        name: 'Appetizers',
        description: 'Start your meal with our delicious appetizers',
        displayOrder: 0,
        isActive: true,
        image: 'https://images.pexels.com/photos/1059905/pexels-photo-1059905.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&dpr=2',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'cat-2',
        name: 'Main Courses',
        description: 'Hearty and satisfying main dishes',
        displayOrder: 1,
        isActive: true,
        image: 'https://images.pexels.com/photos/106343/pexels-photo-106343.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&dpr=2',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'cat-3',
        name: 'Desserts',
        description: 'Sweet endings to your perfect meal',
        displayOrder: 2,
        isActive: true,
        image: 'https://images.pexels.com/photos/291528/pexels-photo-291528.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&dpr=2',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'cat-4',
        name: 'Beverages',
        description: 'Refreshing drinks and specialty beverages',
        displayOrder: 3,
        isActive: true,
        image: 'https://images.pexels.com/photos/544961/pexels-photo-544961.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&dpr=2',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    // Mock menu items
    this.menuItems = [
      {
        id: 'menu-1',
        name: 'Caesar Salad',
        description: 'Fresh romaine lettuce with caesar dressing, parmesan cheese, and croutons',
        price: 12.99,
        categoryId: 'cat-1',
        category: this.categories[0],
        image: 'https://images.pexels.com/photos/1059905/pexels-photo-1059905.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&dpr=2',
        isAvailable: true,
        isPopular: true,
        isFeatured: false,
        preparationTime: 10,
        servingSize: '1 bowl',
        ingredients: ['Romaine lettuce', 'Caesar dressing', 'Parmesan cheese', 'Croutons', 'Anchovies'],
        allergens: ['Dairy', 'Fish', 'Gluten'],
        dietaryTags: ['Vegetarian'],
        nutritionalInfo: {
          calories: 320,
          protein: 12,
          carbohydrates: 18,
          fat: 24,
          fiber: 4,
          sodium: 680,
        },
        modifiers: [
          {
            id: 'mod-1',
            name: 'Add Protein',
            description: 'Add grilled chicken or shrimp',
            price: 0,
            category: 'addon',
            isRequired: false,
            options: [
              { id: 'opt-1', name: 'Grilled Chicken', price: 6.99 },
              { id: 'opt-2', name: 'Grilled Shrimp', price: 8.99 },
            ],
          },
        ],
        cost: 4.50,
        profitMargin: 65.1,
        displayOrder: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'menu-2',
        name: 'Grilled Chicken Breast',
        description: 'Tender grilled chicken breast with herbs and spices, served with seasonal vegetables',
        price: 25.99,
        categoryId: 'cat-2',
        category: this.categories[1],
        image: 'https://images.pexels.com/photos/106343/pexels-photo-106343.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&dpr=2',
        isAvailable: true,
        isPopular: true,
        isFeatured: true,
        preparationTime: 20,
        servingSize: '8oz',
        ingredients: ['Chicken breast', 'Mixed herbs', 'Olive oil', 'Seasonal vegetables', 'Garlic'],
        allergens: [],
        dietaryTags: ['Gluten-Free', 'High-Protein', 'Keto-Friendly'],
        spiceLevel: 'mild',
        nutritionalInfo: {
          calories: 420,
          protein: 45,
          carbohydrates: 8,
          fat: 18,
          fiber: 3,
          sodium: 320,
        },
        modifiers: [
          {
            id: 'mod-2',
            name: 'Cooking Style',
            description: 'Choose your preferred cooking style',
            price: 0,
            category: 'customization',
            isRequired: true,
            maxSelections: 1,
            options: [
              { id: 'opt-3', name: 'Grilled', price: 0, isDefault: true },
              { id: 'opt-4', name: 'Blackened', price: 0 },
              { id: 'opt-5', name: 'Herb Crusted', price: 2.99 },
            ],
          },
        ],
        cost: 8.50,
        profitMargin: 67.3,
        displayOrder: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'menu-3',
        name: 'Chocolate Lava Cake',
        description: 'Warm chocolate cake with molten center, served with vanilla ice cream',
        price: 8.99,
        categoryId: 'cat-3',
        category: this.categories[2],
        image: 'https://images.pexels.com/photos/291528/pexels-photo-291528.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&dpr=2',
        isAvailable: true,
        isPopular: true,
        isFeatured: true,
        preparationTime: 15,
        servingSize: '1 cake',
        ingredients: ['Dark chocolate', 'Butter', 'Eggs', 'Sugar', 'Flour', 'Vanilla ice cream'],
        allergens: ['Dairy', 'Eggs', 'Gluten'],
        dietaryTags: ['Vegetarian'],
        nutritionalInfo: {
          calories: 580,
          protein: 8,
          carbohydrates: 65,
          fat: 32,
          fiber: 4,
          sugar: 55,
          sodium: 180,
        },
        modifiers: [
          {
            id: 'mod-3',
            name: 'Ice Cream Flavor',
            description: 'Choose your ice cream flavor',
            price: 0,
            category: 'customization',
            isRequired: false,
            options: [
              { id: 'opt-6', name: 'Vanilla', price: 0, isDefault: true },
              { id: 'opt-7', name: 'Chocolate', price: 0 },
              { id: 'opt-8', name: 'Strawberry', price: 0 },
            ],
          },
        ],
        cost: 3.20,
        profitMargin: 64.4,
        displayOrder: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
  }
}