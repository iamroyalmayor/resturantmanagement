// Inventory-specific types
export interface Supplier {
  id: string;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  paymentTerms: string;
  isActive: boolean;
  rating: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface InventoryCategory {
  id: string;
  name: string;
  description?: string;
  color: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface InventoryItem {
  id: string;
  name: string;
  description?: string;
  sku: string;
  categoryId: string;
  category?: InventoryCategory;
  supplierId: string;
  supplier?: Supplier;
  unit: 'kg' | 'g' | 'l' | 'ml' | 'pcs' | 'box' | 'pack' | 'bottle' | 'can';
  currentStock: number;
  minimumStock: number;
  maximumStock: number;
  reorderPoint: number;
  unitCost: number;
  lastPurchasePrice: number;
  averageCost: number;
  totalValue: number;
  location: string;
  barcode?: string;
  expirationDate?: Date;
  batchNumber?: string;
  isPerishable: boolean;
  shelfLife?: number; // days
  lastRestocked: Date;
  lastUsed?: Date;
  usageRate: number; // units per day
  status: 'in-stock' | 'low-stock' | 'out-of-stock' | 'expired' | 'discontinued';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface StockMovement {
  id: string;
  itemId: string;
  item?: InventoryItem;
  type: 'purchase' | 'usage' | 'waste' | 'adjustment' | 'transfer' | 'return';
  quantity: number;
  unitCost?: number;
  totalCost?: number;
  reason: string;
  reference?: string; // PO number, order ID, etc.
  performedBy: string;
  approvedBy?: string;
  notes?: string;
  createdAt: Date;
}

export interface PurchaseOrder {
  id: string;
  orderNumber: string;
  supplierId: string;
  supplier?: Supplier;
  status: 'draft' | 'sent' | 'confirmed' | 'partial' | 'received' | 'cancelled';
  items: PurchaseOrderItem[];
  subtotal: number;
  taxAmount: number;
  shippingCost: number;
  totalAmount: number;
  expectedDelivery?: Date;
  actualDelivery?: Date;
  notes?: string;
  createdBy: string;
  approvedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PurchaseOrderItem {
  id: string;
  itemId: string;
  item?: InventoryItem;
  quantity: number;
  unitCost: number;
  totalCost: number;
  receivedQuantity?: number;
  notes?: string;
}

export interface InventoryAlert {
  id: string;
  type: 'low-stock' | 'out-of-stock' | 'expiring' | 'expired' | 'overstock';
  itemId: string;
  item?: InventoryItem;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  isRead: boolean;
  createdAt: Date;
}

export interface InventoryFilters {
  categoryId?: string;
  supplierId?: string;
  status?: InventoryItem['status'][];
  location?: string;
  isPerishable?: boolean;
  stockLevel?: 'all' | 'low' | 'out' | 'normal' | 'overstock';
  expiringWithin?: number; // days
  searchTerm?: string;
}

export interface InventoryStats {
  totalItems: number;
  totalValue: number;
  lowStockItems: number;
  outOfStockItems: number;
  expiringItems: number;
  expiredItems: number;
  totalCategories: number;
  totalSuppliers: number;
  averageStockLevel: number;
  monthlyUsage: number;
  topUsedItems: Array<{
    item: InventoryItem;
    usage: number;
  }>;
}

export interface RecipeIngredient {
  itemId: string;
  item?: InventoryItem;
  quantity: number;
  unit: string;
  cost: number;
}

export interface Recipe {
  id: string;
  menuItemId: string;
  ingredients: RecipeIngredient[];
  totalCost: number;
  yield: number;
  costPerServing: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}