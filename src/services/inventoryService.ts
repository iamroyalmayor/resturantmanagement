import { 
  InventoryItem, 
  InventoryCategory, 
  Supplier, 
  StockMovement, 
  PurchaseOrder,
  InventoryAlert,
  InventoryFilters,
  InventoryStats,
  Recipe
} from '../types/inventory';

export class InventoryService {
  private static instance: InventoryService;
  private items: InventoryItem[] = [];
  private categories: InventoryCategory[] = [];
  private suppliers: Supplier[] = [];
  private stockMovements: StockMovement[] = [];
  private purchaseOrders: PurchaseOrder[] = [];
  private alerts: InventoryAlert[] = [];
  private recipes: Recipe[] = [];
  
  private itemListeners: ((items: InventoryItem[]) => void)[] = [];
  private categoryListeners: ((categories: InventoryCategory[]) => void)[] = [];
  private supplierListeners: ((suppliers: Supplier[]) => void)[] = [];
  private alertListeners: ((alerts: InventoryAlert[]) => void)[] = [];

  private constructor() {
    this.initializeMockData();
    this.startAlertMonitoring();
  }

  public static getInstance(): InventoryService {
    if (!InventoryService.instance) {
      InventoryService.instance = new InventoryService();
    }
    return InventoryService.instance;
  }

  // Subscription methods
  public subscribeToItems(callback: (items: InventoryItem[]) => void): () => void {
    this.itemListeners.push(callback);
    return () => {
      this.itemListeners = this.itemListeners.filter(listener => listener !== callback);
    };
  }

  public subscribeToCategories(callback: (categories: InventoryCategory[]) => void): () => void {
    this.categoryListeners.push(callback);
    return () => {
      this.categoryListeners = this.categoryListeners.filter(listener => listener !== callback);
    };
  }

  public subscribeToSuppliers(callback: (suppliers: Supplier[]) => void): () => void {
    this.supplierListeners.push(callback);
    return () => {
      this.supplierListeners = this.supplierListeners.filter(listener => listener !== callback);
    };
  }

  public subscribeToAlerts(callback: (alerts: InventoryAlert[]) => void): () => void {
    this.alertListeners.push(callback);
    return () => {
      this.alertListeners = this.alertListeners.filter(listener => listener !== callback);
    };
  }

  private notifyItemListeners(): void {
    this.itemListeners.forEach(listener => listener([...this.items]));
  }

  private notifyCategoryListeners(): void {
    this.categoryListeners.forEach(listener => listener([...this.categories]));
  }

  private notifySupplierListeners(): void {
    this.supplierListeners.forEach(listener => listener([...this.suppliers]));
  }

  private notifyAlertListeners(): void {
    this.alertListeners.forEach(listener => listener([...this.alerts]));
  }

  // Inventory Items CRUD
  public async createItem(itemData: Partial<InventoryItem>): Promise<InventoryItem> {
    const category = this.categories.find(c => c.id === itemData.categoryId);
    const supplier = this.suppliers.find(s => s.id === itemData.supplierId);
    
    const newItem: InventoryItem = {
      id: Date.now().toString(),
      name: itemData.name || '',
      description: itemData.description,
      sku: itemData.sku || this.generateSKU(),
      categoryId: itemData.categoryId || '',
      category,
      supplierId: itemData.supplierId || '',
      supplier,
      unit: itemData.unit || 'pcs',
      currentStock: itemData.currentStock || 0,
      minimumStock: itemData.minimumStock || 0,
      maximumStock: itemData.maximumStock || 100,
      reorderPoint: itemData.reorderPoint || itemData.minimumStock || 0,
      unitCost: itemData.unitCost || 0,
      lastPurchasePrice: itemData.lastPurchasePrice || itemData.unitCost || 0,
      averageCost: itemData.averageCost || itemData.unitCost || 0,
      totalValue: (itemData.currentStock || 0) * (itemData.unitCost || 0),
      location: itemData.location || 'Main Storage',
      barcode: itemData.barcode,
      expirationDate: itemData.expirationDate,
      batchNumber: itemData.batchNumber,
      isPerishable: itemData.isPerishable || false,
      shelfLife: itemData.shelfLife,
      lastRestocked: itemData.lastRestocked || new Date(),
      lastUsed: itemData.lastUsed,
      usageRate: itemData.usageRate || 0,
      status: this.calculateItemStatus(itemData.currentStock || 0, itemData.minimumStock || 0),
      notes: itemData.notes,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.items.push(newItem);
    this.checkAndCreateAlerts(newItem);
    this.notifyItemListeners();
    return newItem;
  }

  public async updateItem(id: string, updates: Partial<InventoryItem>): Promise<InventoryItem | null> {
    const index = this.items.findIndex(item => item.id === id);
    if (index === -1) return null;

    const updatedItem = {
      ...this.items[index],
      ...updates,
      totalValue: (updates.currentStock ?? this.items[index].currentStock) * 
                  (updates.unitCost ?? this.items[index].unitCost),
      status: this.calculateItemStatus(
        updates.currentStock ?? this.items[index].currentStock,
        updates.minimumStock ?? this.items[index].minimumStock
      ),
      updatedAt: new Date(),
    };

    // Update category and supplier references
    if (updates.categoryId) {
      updatedItem.category = this.categories.find(c => c.id === updates.categoryId);
    }
    if (updates.supplierId) {
      updatedItem.supplier = this.suppliers.find(s => s.id === updates.supplierId);
    }

    this.items[index] = updatedItem;
    this.checkAndCreateAlerts(updatedItem);
    this.notifyItemListeners();
    return updatedItem;
  }

  public async deleteItem(id: string): Promise<boolean> {
    const index = this.items.findIndex(item => item.id === id);
    if (index === -1) return false;

    this.items.splice(index, 1);
    this.notifyItemListeners();
    return true;
  }

  public getItems(filters?: InventoryFilters): InventoryItem[] {
    let filteredItems = [...this.items];

    if (filters) {
      if (filters.categoryId) {
        filteredItems = filteredItems.filter(item => item.categoryId === filters.categoryId);
      }

      if (filters.supplierId) {
        filteredItems = filteredItems.filter(item => item.supplierId === filters.supplierId);
      }

      if (filters.status && filters.status.length > 0) {
        filteredItems = filteredItems.filter(item => filters.status!.includes(item.status));
      }

      if (filters.location) {
        filteredItems = filteredItems.filter(item => 
          item.location.toLowerCase().includes(filters.location!.toLowerCase())
        );
      }

      if (filters.isPerishable !== undefined) {
        filteredItems = filteredItems.filter(item => item.isPerishable === filters.isPerishable);
      }

      if (filters.stockLevel) {
        filteredItems = filteredItems.filter(item => {
          switch (filters.stockLevel) {
            case 'low':
              return item.status === 'low-stock';
            case 'out':
              return item.status === 'out-of-stock';
            case 'overstock':
              return item.currentStock > item.maximumStock;
            case 'normal':
              return item.status === 'in-stock' && item.currentStock <= item.maximumStock;
            default:
              return true;
          }
        });
      }

      if (filters.expiringWithin) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() + filters.expiringWithin);
        filteredItems = filteredItems.filter(item => 
          item.expirationDate && item.expirationDate <= cutoffDate
        );
      }

      if (filters.searchTerm) {
        const searchTerm = filters.searchTerm.toLowerCase();
        filteredItems = filteredItems.filter(item =>
          item.name.toLowerCase().includes(searchTerm) ||
          item.sku.toLowerCase().includes(searchTerm) ||
          (item.description && item.description.toLowerCase().includes(searchTerm))
        );
      }
    }

    return filteredItems.sort((a, b) => a.name.localeCompare(b.name));
  }

  // Stock Movement
  public async recordStockMovement(movement: Partial<StockMovement>): Promise<StockMovement> {
    const item = this.items.find(i => i.id === movement.itemId);
    if (!item) throw new Error('Item not found');

    const newMovement: StockMovement = {
      id: Date.now().toString(),
      itemId: movement.itemId!,
      item,
      type: movement.type!,
      quantity: movement.quantity!,
      unitCost: movement.unitCost,
      totalCost: movement.totalCost || (movement.quantity! * (movement.unitCost || item.unitCost)),
      reason: movement.reason!,
      reference: movement.reference,
      performedBy: movement.performedBy!,
      approvedBy: movement.approvedBy,
      notes: movement.notes,
      createdAt: new Date(),
    };

    // Update item stock based on movement type
    let stockChange = 0;
    switch (movement.type) {
      case 'purchase':
        stockChange = movement.quantity!;
        break;
      case 'usage':
      case 'waste':
        stockChange = -movement.quantity!;
        break;
      case 'adjustment':
        stockChange = movement.quantity!; // Can be positive or negative
        break;
      case 'return':
        stockChange = -movement.quantity!;
        break;
    }

    await this.updateItem(item.id, {
      currentStock: Math.max(0, item.currentStock + stockChange),
      lastUsed: movement.type === 'usage' ? new Date() : item.lastUsed,
      lastRestocked: movement.type === 'purchase' ? new Date() : item.lastRestocked,
    });

    this.stockMovements.push(newMovement);
    return newMovement;
  }

  // Categories CRUD
  public async createCategory(categoryData: Partial<InventoryCategory>): Promise<InventoryCategory> {
    const newCategory: InventoryCategory = {
      id: Date.now().toString(),
      name: categoryData.name || '',
      description: categoryData.description,
      color: categoryData.color || '#3B82F6',
      isActive: categoryData.isActive ?? true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.categories.push(newCategory);
    this.notifyCategoryListeners();
    return newCategory;
  }

  public getCategories(): InventoryCategory[] {
    return [...this.categories].filter(cat => cat.isActive);
  }

  // Suppliers CRUD
  public async createSupplier(supplierData: Partial<Supplier>): Promise<Supplier> {
    const newSupplier: Supplier = {
      id: Date.now().toString(),
      name: supplierData.name || '',
      contactPerson: supplierData.contactPerson || '',
      email: supplierData.email || '',
      phone: supplierData.phone || '',
      address: supplierData.address || '',
      paymentTerms: supplierData.paymentTerms || 'Net 30',
      isActive: supplierData.isActive ?? true,
      rating: supplierData.rating || 5,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.suppliers.push(newSupplier);
    this.notifySupplierListeners();
    return newSupplier;
  }

  public getSuppliers(): Supplier[] {
    return [...this.suppliers].filter(supplier => supplier.isActive);
  }

  // Alerts
  public getAlerts(): InventoryAlert[] {
    return [...this.alerts].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  public async markAlertAsRead(alertId: string): Promise<void> {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.isRead = true;
      this.notifyAlertListeners();
    }
  }

  // Statistics
  public getInventoryStats(): InventoryStats {
    const totalItems = this.items.length;
    const totalValue = this.items.reduce((sum, item) => sum + item.totalValue, 0);
    const lowStockItems = this.items.filter(item => item.status === 'low-stock').length;
    const outOfStockItems = this.items.filter(item => item.status === 'out-of-stock').length;
    
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const expiringItems = this.items.filter(item => 
      item.expirationDate && item.expirationDate <= thirtyDaysFromNow && item.expirationDate > now
    ).length;
    
    const expiredItems = this.items.filter(item => 
      item.expirationDate && item.expirationDate <= now
    ).length;

    const averageStockLevel = totalItems > 0 
      ? this.items.reduce((sum, item) => sum + (item.currentStock / item.maximumStock), 0) / totalItems * 100
      : 0;

    // Calculate monthly usage from stock movements
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const monthlyUsage = this.stockMovements
      .filter(movement => movement.type === 'usage' && movement.createdAt >= thirtyDaysAgo)
      .reduce((sum, movement) => sum + movement.quantity, 0);

    // Top used items
    const usageByItem = new Map<string, number>();
    this.stockMovements
      .filter(movement => movement.type === 'usage' && movement.createdAt >= thirtyDaysAgo)
      .forEach(movement => {
        const current = usageByItem.get(movement.itemId) || 0;
        usageByItem.set(movement.itemId, current + movement.quantity);
      });

    const topUsedItems = Array.from(usageByItem.entries())
      .map(([itemId, usage]) => ({
        item: this.items.find(item => item.id === itemId)!,
        usage
      }))
      .filter(entry => entry.item)
      .sort((a, b) => b.usage - a.usage)
      .slice(0, 5);

    return {
      totalItems,
      totalValue,
      lowStockItems,
      outOfStockItems,
      expiringItems,
      expiredItems,
      totalCategories: this.categories.length,
      totalSuppliers: this.suppliers.length,
      averageStockLevel,
      monthlyUsage,
      topUsedItems,
    };
  }

  // Private helper methods
  private calculateItemStatus(currentStock: number, minimumStock: number): InventoryItem['status'] {
    if (currentStock <= 0) return 'out-of-stock';
    if (currentStock <= minimumStock) return 'low-stock';
    return 'in-stock';
  }

  private generateSKU(): string {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.random().toString(36).substring(2, 5).toUpperCase();
    return `SKU-${timestamp}-${random}`;
  }

  private checkAndCreateAlerts(item: InventoryItem): void {
    // Remove existing alerts for this item
    this.alerts = this.alerts.filter(alert => alert.itemId !== item.id);

    // Low stock alert
    if (item.currentStock <= item.minimumStock && item.currentStock > 0) {
      this.alerts.push({
        id: `alert-${Date.now()}-${Math.random()}`,
        type: 'low-stock',
        itemId: item.id,
        item,
        message: `${item.name} is running low (${item.currentStock} ${item.unit} remaining)`,
        severity: 'medium',
        isRead: false,
        createdAt: new Date(),
      });
    }

    // Out of stock alert
    if (item.currentStock <= 0) {
      this.alerts.push({
        id: `alert-${Date.now()}-${Math.random()}`,
        type: 'out-of-stock',
        itemId: item.id,
        item,
        message: `${item.name} is out of stock`,
        severity: 'high',
        isRead: false,
        createdAt: new Date(),
      });
    }

    // Expiring alert
    if (item.expirationDate) {
      const now = new Date();
      const daysUntilExpiry = Math.ceil((item.expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysUntilExpiry <= 0) {
        this.alerts.push({
          id: `alert-${Date.now()}-${Math.random()}`,
          type: 'expired',
          itemId: item.id,
          item,
          message: `${item.name} has expired`,
          severity: 'critical',
          isRead: false,
          createdAt: new Date(),
        });
      } else if (daysUntilExpiry <= 7) {
        this.alerts.push({
          id: `alert-${Date.now()}-${Math.random()}`,
          type: 'expiring',
          itemId: item.id,
          item,
          message: `${item.name} expires in ${daysUntilExpiry} day${daysUntilExpiry !== 1 ? 's' : ''}`,
          severity: daysUntilExpiry <= 3 ? 'high' : 'medium',
          isRead: false,
          createdAt: new Date(),
        });
      }
    }

    this.notifyAlertListeners();
  }

  private startAlertMonitoring(): void {
    // Check for alerts every hour
    setInterval(() => {
      this.items.forEach(item => this.checkAndCreateAlerts(item));
    }, 60 * 60 * 1000);
  }

  private initializeMockData(): void {
    // Mock categories
    this.categories = [
      {
        id: 'cat-1',
        name: 'Proteins',
        description: 'Meat, fish, and protein sources',
        color: '#EF4444',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'cat-2',
        name: 'Vegetables',
        description: 'Fresh vegetables and produce',
        color: '#10B981',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'cat-3',
        name: 'Dairy',
        description: 'Milk, cheese, and dairy products',
        color: '#F59E0B',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'cat-4',
        name: 'Dry Goods',
        description: 'Rice, flour, spices, and dry ingredients',
        color: '#8B5CF6',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'cat-5',
        name: 'Beverages',
        description: 'Drinks and beverage supplies',
        color: '#06B6D4',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    // Mock suppliers
    this.suppliers = [
      {
        id: 'sup-1',
        name: 'Fresh Foods Wholesale',
        contactPerson: 'John Smith',
        email: 'john@freshfoods.com',
        phone: '+1-555-0101',
        address: '123 Market St, Food District',
        paymentTerms: 'Net 30',
        isActive: true,
        rating: 4.8,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'sup-2',
        name: 'Premium Meats Co.',
        contactPerson: 'Sarah Johnson',
        email: 'sarah@premiummeats.com',
        phone: '+1-555-0102',
        address: '456 Butcher Ave, Meat Quarter',
        paymentTerms: 'Net 15',
        isActive: true,
        rating: 4.9,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'sup-3',
        name: 'Dairy Direct',
        contactPerson: 'Mike Wilson',
        email: 'mike@dairydirect.com',
        phone: '+1-555-0103',
        address: '789 Cream Rd, Dairy Valley',
        paymentTerms: 'Net 7',
        isActive: true,
        rating: 4.7,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    // Mock inventory items
    this.items = [
      {
        id: 'item-1',
        name: 'Chicken Breast',
        description: 'Fresh boneless chicken breast',
        sku: 'SKU-001-CHK',
        categoryId: 'cat-1',
        category: this.categories[0],
        supplierId: 'sup-2',
        supplier: this.suppliers[1],
        unit: 'kg',
        currentStock: 15,
        minimumStock: 10,
        maximumStock: 50,
        reorderPoint: 12,
        unitCost: 8.50,
        lastPurchasePrice: 8.50,
        averageCost: 8.25,
        totalValue: 127.50,
        location: 'Cold Storage A',
        isPerishable: true,
        shelfLife: 5,
        lastRestocked: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        lastUsed: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        usageRate: 3.2,
        status: 'in-stock',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'item-2',
        name: 'Tomatoes',
        description: 'Fresh Roma tomatoes',
        sku: 'SKU-002-TOM',
        categoryId: 'cat-2',
        category: this.categories[1],
        supplierId: 'sup-1',
        supplier: this.suppliers[0],
        unit: 'kg',
        currentStock: 5,
        minimumStock: 8,
        maximumStock: 25,
        reorderPoint: 10,
        unitCost: 3.20,
        lastPurchasePrice: 3.20,
        averageCost: 3.15,
        totalValue: 16.00,
        location: 'Produce Cooler',
        isPerishable: true,
        shelfLife: 7,
        expirationDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        lastRestocked: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
        lastUsed: new Date(Date.now() - 6 * 60 * 60 * 1000),
        usageRate: 2.1,
        status: 'low-stock',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'item-3',
        name: 'Mozzarella Cheese',
        description: 'Fresh mozzarella cheese blocks',
        sku: 'SKU-003-MOZ',
        categoryId: 'cat-3',
        category: this.categories[2],
        supplierId: 'sup-3',
        supplier: this.suppliers[2],
        unit: 'kg',
        currentStock: 0,
        minimumStock: 5,
        maximumStock: 20,
        reorderPoint: 7,
        unitCost: 12.50,
        lastPurchasePrice: 12.50,
        averageCost: 12.25,
        totalValue: 0,
        location: 'Dairy Cooler',
        isPerishable: true,
        shelfLife: 14,
        lastRestocked: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        lastUsed: new Date(Date.now() - 2 * 60 * 60 * 1000),
        usageRate: 1.8,
        status: 'out-of-stock',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'item-4',
        name: 'All-Purpose Flour',
        description: 'Premium all-purpose flour',
        sku: 'SKU-004-FLR',
        categoryId: 'cat-4',
        category: this.categories[3],
        supplierId: 'sup-1',
        supplier: this.suppliers[0],
        unit: 'kg',
        currentStock: 45,
        minimumStock: 20,
        maximumStock: 100,
        reorderPoint: 25,
        unitCost: 2.80,
        lastPurchasePrice: 2.80,
        averageCost: 2.75,
        totalValue: 126.00,
        location: 'Dry Storage',
        isPerishable: false,
        lastRestocked: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        lastUsed: new Date(Date.now() - 3 * 60 * 60 * 1000),
        usageRate: 4.5,
        status: 'in-stock',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'item-5',
        name: 'Olive Oil',
        description: 'Extra virgin olive oil',
        sku: 'SKU-005-OIL',
        categoryId: 'cat-4',
        category: this.categories[3],
        supplierId: 'sup-1',
        supplier: this.suppliers[0],
        unit: 'l',
        currentStock: 8,
        minimumStock: 5,
        maximumStock: 30,
        reorderPoint: 8,
        unitCost: 15.50,
        lastPurchasePrice: 15.50,
        averageCost: 15.25,
        totalValue: 124.00,
        location: 'Pantry A',
        isPerishable: false,
        lastRestocked: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
        lastUsed: new Date(Date.now() - 4 * 60 * 60 * 1000),
        usageRate: 0.8,
        status: 'in-stock',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    // Generate initial alerts
    this.items.forEach(item => this.checkAndCreateAlerts(item));
  }
}