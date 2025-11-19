import { useState, useEffect } from 'react';
import { 
  InventoryItem, 
  InventoryCategory, 
  Supplier, 
  InventoryAlert,
  InventoryFilters,
  InventoryStats,
  StockMovement
} from '../types/inventory';
import { InventoryService } from '../services/inventoryService';

export const useInventory = (filters?: InventoryFilters) => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const inventoryService = InventoryService.getInstance();

  useEffect(() => {
    setLoading(true);
    try {
      const filteredItems = inventoryService.getItems(filters);
      setItems(filteredItems);
      setError(null);
    } catch (err) {
      setError('Failed to load inventory items');
      console.error('Error loading inventory items:', err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    const unsubscribe = inventoryService.subscribeToItems((updatedItems) => {
      const filteredItems = filters ? 
        updatedItems.filter(item => {
          if (filters.categoryId && item.categoryId !== filters.categoryId) return false;
          if (filters.supplierId && item.supplierId !== filters.supplierId) return false;
          if (filters.status && !filters.status.includes(item.status)) return false;
          if (filters.location && !item.location.toLowerCase().includes(filters.location.toLowerCase())) return false;
          if (filters.isPerishable !== undefined && item.isPerishable !== filters.isPerishable) return false;
          if (filters.searchTerm) {
            const searchTerm = filters.searchTerm.toLowerCase();
            if (!item.name.toLowerCase().includes(searchTerm) &&
                !item.sku.toLowerCase().includes(searchTerm) &&
                !(item.description && item.description.toLowerCase().includes(searchTerm))) {
              return false;
            }
          }
          return true;
        }) : updatedItems;
      
      setItems(filteredItems);
    });

    return unsubscribe;
  }, [filters]);

  const createItem = async (itemData: Partial<InventoryItem>) => {
    try {
      const newItem = await inventoryService.createItem(itemData);
      return newItem;
    } catch (err) {
      setError('Failed to create inventory item');
      console.error('Error creating inventory item:', err);
      throw err;
    }
  };

  const updateItem = async (id: string, updates: Partial<InventoryItem>) => {
    try {
      const updatedItem = await inventoryService.updateItem(id, updates);
      return updatedItem;
    } catch (err) {
      setError('Failed to update inventory item');
      console.error('Error updating inventory item:', err);
      throw err;
    }
  };

  const deleteItem = async (id: string) => {
    try {
      await inventoryService.deleteItem(id);
    } catch (err) {
      setError('Failed to delete inventory item');
      console.error('Error deleting inventory item:', err);
      throw err;
    }
  };

  const recordStockMovement = async (movement: Partial<StockMovement>) => {
    try {
      const newMovement = await inventoryService.recordStockMovement(movement);
      return newMovement;
    } catch (err) {
      setError('Failed to record stock movement');
      console.error('Error recording stock movement:', err);
      throw err;
    }
  };

  return {
    items,
    loading,
    error,
    createItem,
    updateItem,
    deleteItem,
    recordStockMovement,
  };
};

export const useInventoryCategories = () => {
  const [categories, setCategories] = useState<InventoryCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const inventoryService = InventoryService.getInstance();

  useEffect(() => {
    setLoading(true);
    try {
      const cats = inventoryService.getCategories();
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
    const unsubscribe = inventoryService.subscribeToCategories(setCategories);
    return unsubscribe;
  }, []);

  const createCategory = async (categoryData: Partial<InventoryCategory>) => {
    try {
      const newCategory = await inventoryService.createCategory(categoryData);
      return newCategory;
    } catch (err) {
      setError('Failed to create category');
      console.error('Error creating category:', err);
      throw err;
    }
  };

  return {
    categories,
    loading,
    error,
    createCategory,
  };
};

export const useSuppliers = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const inventoryService = InventoryService.getInstance();

  useEffect(() => {
    setLoading(true);
    try {
      const sups = inventoryService.getSuppliers();
      setSuppliers(sups);
      setError(null);
    } catch (err) {
      setError('Failed to load suppliers');
      console.error('Error loading suppliers:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = inventoryService.subscribeToSuppliers(setSuppliers);
    return unsubscribe;
  }, []);

  const createSupplier = async (supplierData: Partial<Supplier>) => {
    try {
      const newSupplier = await inventoryService.createSupplier(supplierData);
      return newSupplier;
    } catch (err) {
      setError('Failed to create supplier');
      console.error('Error creating supplier:', err);
      throw err;
    }
  };

  return {
    suppliers,
    loading,
    error,
    createSupplier,
  };
};

export const useInventoryAlerts = () => {
  const [alerts, setAlerts] = useState<InventoryAlert[]>([]);
  const [loading, setLoading] = useState(true);

  const inventoryService = InventoryService.getInstance();

  useEffect(() => {
    const loadAlerts = () => {
      setLoading(true);
      try {
        const inventoryAlerts = inventoryService.getAlerts();
        setAlerts(inventoryAlerts);
      } catch (err) {
        console.error('Error loading inventory alerts:', err);
      } finally {
        setLoading(false);
      }
    };

    loadAlerts();

    const unsubscribe = inventoryService.subscribeToAlerts(setAlerts);
    return unsubscribe;
  }, []);

  const markAsRead = async (alertId: string) => {
    try {
      await inventoryService.markAlertAsRead(alertId);
    } catch (err) {
      console.error('Error marking alert as read:', err);
    }
  };

  return { alerts, loading, markAsRead };
};

export const useInventoryStats = () => {
  const [stats, setStats] = useState<InventoryStats | null>(null);
  const [loading, setLoading] = useState(true);

  const inventoryService = InventoryService.getInstance();

  useEffect(() => {
    const loadStats = () => {
      setLoading(true);
      try {
        const inventoryStats = inventoryService.getInventoryStats();
        setStats(inventoryStats);
      } catch (err) {
        console.error('Error loading inventory stats:', err);
      } finally {
        setLoading(false);
      }
    };

    loadStats();

    const unsubscribe = inventoryService.subscribeToItems(() => {
      loadStats();
    });

    return unsubscribe;
  }, []);

  return { stats, loading };
};