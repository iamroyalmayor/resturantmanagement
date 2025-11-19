// Order-specific types
export type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'ready' | 'served' | 'completed' | 'cancelled';
export type PaymentStatus = 'pending' | 'paid' | 'refunded' | 'failed';
export type OrderType = 'dine-in' | 'takeaway' | 'delivery';
export type OrderPriority = 'normal' | 'high' | 'urgent';

export interface OrderItem {
  id: string;
  menuItemId: string;
  menuItem: {
    id: string;
    name: string;
    price: number;
    category: string;
    preparationTime: number;
    image?: string;
  };
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  modifiers: OrderModifier[];
  specialInstructions?: string;
  status: 'pending' | 'preparing' | 'ready' | 'served';
}

export interface OrderModifier {
  id: string;
  name: string;
  price: number;
  category: 'size' | 'addon' | 'customization';
}

export interface Order {
  id: string;
  orderNumber: string;
  tableNumber?: number;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  items: OrderItem[];
  status: OrderStatus;
  priority: OrderPriority;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  paymentStatus: PaymentStatus;
  paymentMethod?: 'cash' | 'card' | 'online' | 'split';
  orderType: OrderType;
  notes?: string;
  estimatedPrepTime: number;
  actualPrepTime?: number;
  assignedWaiter?: string;
  assignedChef?: string;
  createdAt: Date;
  updatedAt: Date;
  confirmedAt?: Date;
  readyAt?: Date;
  servedAt?: Date;
  completedAt?: Date;
}

export interface OrderFilters {
  status?: OrderStatus[];
  orderType?: OrderType[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  tableNumber?: number;
  waiter?: string;
  searchTerm?: string;
}

export interface OrderStats {
  totalOrders: number;
  pendingOrders: number;
  preparingOrders: number;
  readyOrders: number;
  completedOrders: number;
  averagePrepTime: number;
  totalRevenue: number;
}