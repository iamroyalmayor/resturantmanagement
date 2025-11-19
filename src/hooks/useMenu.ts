import { useState, useEffect } from 'react';
import { MenuItem, MenuCategory, MenuFilters, MenuStats } from '../types/menu';
import { MenuService } from '../services/menuService';

export const useMenu = (filters?: MenuFilters) => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const menuService = MenuService.getInstance();

  useEffect(() => {
    setLoading(true);
    try {
      const items = menuService.getMenuItems(filters);
      setMenuItems(items);
      setError(null);
    } catch (err) {
      setError('Failed to load menu items');
      console.error('Error loading menu items:', err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    const unsubscribe = menuService.subscribeToMenu((updatedItems) => {
      const filteredItems = filters ? 
        updatedItems.filter(item => {
          if (filters.categoryId && item.categoryId !== filters.categoryId) return false;
          if (filters.isAvailable !== undefined && item.isAvailable !== filters.isAvailable) return false;
          if (filters.isPopular !== undefined && item.isPopular !== filters.isPopular) return false;
          if (filters.isFeatured !== undefined && item.isFeatured !== filters.isFeatured) return false;
          if (filters.searchTerm) {
            const searchTerm = filters.searchTerm.toLowerCase();
            if (!item.name.toLowerCase().includes(searchTerm) &&
                !item.description.toLowerCase().includes(searchTerm) &&
                !item.ingredients.some(ing => ing.toLowerCase().includes(searchTerm))) {
              return false;
            }
          }
          return true;
        }) : updatedItems;
      
      setMenuItems(filteredItems);
    });

    return unsubscribe;
  }, [filters]);

  const createMenuItem = async (itemData: Partial<MenuItem>) => {
    try {
      const newItem = await menuService.createMenuItem(itemData);
      return newItem;
    } catch (err) {
      setError('Failed to create menu item');
      console.error('Error creating menu item:', err);
      throw err;
    }
  };

  const updateMenuItem = async (id: string, updates: Partial<MenuItem>) => {
    try {
      const updatedItem = await menuService.updateMenuItem(id, updates);
      return updatedItem;
    } catch (err) {
      setError('Failed to update menu item');
      console.error('Error updating menu item:', err);
      throw err;
    }
  };

  const deleteMenuItem = async (id: string) => {
    try {
      await menuService.deleteMenuItem(id);
    } catch (err) {
      setError('Failed to delete menu item');
      console.error('Error deleting menu item:', err);
      throw err;
    }
  };

  const updateItemAvailability = async (itemIds: string[], isAvailable: boolean) => {
    try {
      await menuService.updateItemAvailability(itemIds, isAvailable);
    } catch (err) {
      setError('Failed to update item availability');
      console.error('Error updating item availability:', err);
      throw err;
    }
  };

  return {
    menuItems,
    loading,
    error,
    createMenuItem,
    updateMenuItem,
    deleteMenuItem,
    updateItemAvailability,
  };
};

export const useMenuCategories = () => {
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const menuService = MenuService.getInstance();

  useEffect(() => {
    setLoading(true);
    try {
      const cats = menuService.getCategories();
      setCategories(cats);
      setError(null);
    } catch (err) {
      setError('Failed to load categories');
      console.error('Error loading categories:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = menuService.subscribeToCategories(setCategories);
    return unsubscribe;
  }, []);

  const createCategory = async (categoryData: Partial<MenuCategory>) => {
    try {
      const newCategory = await menuService.createCategory(categoryData);
      return newCategory;
    } catch (err) {
      setError('Failed to create category');
      console.error('Error creating category:', err);
      throw err;
    }
  };

  const updateCategory = async (id: string, updates: Partial<MenuCategory>) => {
    try {
      const updatedCategory = await menuService.updateCategory(id, updates);
      return updatedCategory;
    } catch (err) {
      setError('Failed to update category');
      console.error('Error updating category:', err);
      throw err;
    }
  };

  const deleteCategory = async (id: string) => {
    try {
      await menuService.deleteCategory(id);
    } catch (err) {
      setError('Failed to delete category');
      console.error('Error deleting category:', err);
      throw err;
    }
  };

  return {
    categories,
    loading,
    error,
    createCategory,
    updateCategory,
    deleteCategory,
  };
};

export const useMenuStats = () => {
  const [stats, setStats] = useState<MenuStats | null>(null);
  const [loading, setLoading] = useState(true);

  const menuService = MenuService.getInstance();

  useEffect(() => {
    const loadStats = () => {
      setLoading(true);
      try {
        const menuStats = menuService.getMenuStats();
        setStats(menuStats);
      } catch (err) {
        console.error('Error loading menu stats:', err);
      } finally {
        setLoading(false);
      }
    };

    loadStats();

    const unsubscribe = menuService.subscribeToMenu(() => {
      loadStats();
    });

    return unsubscribe;
  }, []);

  return { stats, loading };
};