import { Order, OrderItem, OrderStatus, OrderFilters, OrderStats } from '../types/order';

export class OrderService {
  private static instance: OrderService;
  private orders: Order[] = [];
  private orderListeners: ((orders: Order[]) => void)[] = [];

  private constructor() {
    this.initializeMockOrders();
  }

  public static getInstance(): OrderService {
    if (!OrderService.instance) {
      OrderService.instance = new OrderService();
    }
    return OrderService.instance;
  }

  // Subscribe to order updates
  public subscribe(callback: (orders: Order[]) => void): () => void {
    this.orderListeners.push(callback);
    return () => {
      this.orderListeners = this.orderListeners.filter(listener => listener !== callback);
    };
  }

  private notifyListeners(): void {
    this.orderListeners.forEach(listener => listener([...this.orders]));
  }

  // Create new order
  public async createOrder(orderData: Partial<Order>): Promise<Order> {
    const orderNumber = this.generateOrderNumber();
    const estimatedPrepTime = this.calculateEstimatedPrepTime(orderData.items || []);
    
    const newOrder: Order = {
      id: Date.now().toString(),
      orderNumber,
      tableNumber: orderData.tableNumber,
      customerName: orderData.customerName || 'Walk-in Customer',
      customerPhone: orderData.customerPhone,
      customerEmail: orderData.customerEmail,
      items: orderData.items || [],
      status: 'pending',
      priority: orderData.priority || 'normal',
      subtotal: this.calculateSubtotal(orderData.items || []),
      taxAmount: 0,
      discountAmount: orderData.discountAmount || 0,
      totalAmount: 0,
      paymentStatus: 'pending',
      paymentMethod: orderData.paymentMethod,
      orderType: orderData.orderType || 'dine-in',
      notes: orderData.notes,
      estimatedPrepTime,
      assignedWaiter: orderData.assignedWaiter,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Calculate tax and total
    newOrder.taxAmount = newOrder.subtotal * 0.1; // 10% tax
    newOrder.totalAmount = newOrder.subtotal + newOrder.taxAmount - newOrder.discountAmount;

    this.orders.unshift(newOrder);
    this.notifyListeners();
    
    return newOrder;
  }

  // Update order status
  public async updateOrderStatus(orderId: string, status: OrderStatus): Promise<Order | null> {
    const orderIndex = this.orders.findIndex(order => order.id === orderId);
    if (orderIndex === -1) return null;

    const order = this.orders[orderIndex];
    const now = new Date();

    // Update status and timestamps
    order.status = status;
    order.updatedAt = now;

    switch (status) {
      case 'confirmed':
        order.confirmedAt = now;
        // Auto-assign waiter if not already assigned
        if (!order.assignedWaiter) {
          order.assignedWaiter = this.getAvailableWaiter();
        }
        break;
      case 'preparing':
        if (!order.confirmedAt) {
          order.confirmedAt = now;
        }
        // Auto-assign chef if not already assigned
        if (!order.assignedChef) {
          order.assignedChef = this.getAvailableChef();
        }
        break;
      case 'ready':
        order.readyAt = now;
        if (order.confirmedAt) {
          order.actualPrepTime = Math.floor((now.getTime() - order.confirmedAt.getTime()) / (1000 * 60));
        }
        break;
      case 'served':
        order.servedAt = now;
        break;
      case 'completed':
        order.completedAt = now;
        // Auto-mark payment as paid if not already
        if (order.paymentStatus === 'pending') {
          order.paymentStatus = 'paid';
        }
        break;
    }

    this.orders[orderIndex] = order;
    this.notifyListeners();
    
    return order;
  }

  // Update order item status
  public async updateOrderItemStatus(orderId: string, itemId: string, status: OrderItem['status']): Promise<boolean> {
    const order = this.orders.find(o => o.id === orderId);
    if (!order) return false;

    const item = order.items.find(i => i.id === itemId);
    if (!item) return false;

    item.status = status;
    order.updatedAt = new Date();

    // Check if all items are ready to update order status
    if (status === 'ready' && order.items.every(i => i.status === 'ready')) {
      await this.updateOrderStatus(orderId, 'ready');
    }

    this.notifyListeners();
    return true;
  }

  // Get all orders with optional filters
  public getOrders(filters?: OrderFilters): Order[] {
    let filteredOrders = [...this.orders];

    if (filters) {
      if (filters.status && filters.status.length > 0) {
        filteredOrders = filteredOrders.filter(order => filters.status!.includes(order.status));
      }

      if (filters.orderType && filters.orderType.length > 0) {
        filteredOrders = filteredOrders.filter(order => filters.orderType!.includes(order.orderType));
      }

      if (filters.tableNumber) {
        filteredOrders = filteredOrders.filter(order => order.tableNumber === filters.tableNumber);
      }

      if (filters.waiter) {
        filteredOrders = filteredOrders.filter(order => order.assignedWaiter === filters.waiter);
      }

      if (filters.searchTerm) {
        const searchTerm = filters.searchTerm.toLowerCase();
        filteredOrders = filteredOrders.filter(order =>
          order.customerName.toLowerCase().includes(searchTerm) ||
          order.orderNumber.toLowerCase().includes(searchTerm) ||
          order.id.includes(searchTerm)
        );
      }

      if (filters.dateRange) {
        filteredOrders = filteredOrders.filter(order =>
          order.createdAt >= filters.dateRange!.start &&
          order.createdAt <= filters.dateRange!.end
        );
      }
    }

    return filteredOrders.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  // Get order by ID
  public getOrderById(orderId: string): Order | null {
    return this.orders.find(order => order.id === orderId) || null;
  }

  // Get order statistics
  public getOrderStats(dateRange?: { start: Date; end: Date }): OrderStats {
    let ordersToAnalyze = this.orders;

    if (dateRange) {
      ordersToAnalyze = this.orders.filter(order =>
        order.createdAt >= dateRange.start && order.createdAt <= dateRange.end
      );
    }

    const totalOrders = ordersToAnalyze.length;
    const pendingOrders = ordersToAnalyze.filter(o => o.status === 'pending').length;
    const preparingOrders = ordersToAnalyze.filter(o => o.status === 'preparing').length;
    const readyOrders = ordersToAnalyze.filter(o => o.status === 'ready').length;
    const completedOrders = ordersToAnalyze.filter(o => o.status === 'completed').length;

    const completedOrdersWithPrepTime = ordersToAnalyze.filter(o => o.actualPrepTime);
    const averagePrepTime = completedOrdersWithPrepTime.length > 0
      ? completedOrdersWithPrepTime.reduce((sum, o) => sum + (o.actualPrepTime || 0), 0) / completedOrdersWithPrepTime.length
      : 0;

    const totalRevenue = ordersToAnalyze
      .filter(o => o.paymentStatus === 'paid')
      .reduce((sum, o) => sum + o.totalAmount, 0);

    return {
      totalOrders,
      pendingOrders,
      preparingOrders,
      readyOrders,
      completedOrders,
      averagePrepTime: Math.round(averagePrepTime),
      totalRevenue,
    };
  }

  // Cancel order
  public async cancelOrder(orderId: string, reason?: string): Promise<boolean> {
    const order = await this.updateOrderStatus(orderId, 'cancelled');
    if (order && reason) {
      order.notes = (order.notes || '') + `\nCancellation reason: ${reason}`;
      order.updatedAt = new Date();
      this.notifyListeners();
    }
    return !!order;
  }

  // Private helper methods
  private generateOrderNumber(): string {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const timeStr = date.getTime().toString().slice(-4);
    return `ORD-${dateStr}-${timeStr}`;
  }

  private calculateSubtotal(items: OrderItem[]): number {
    return items.reduce((sum, item) => sum + item.totalPrice, 0);
  }

  private calculateEstimatedPrepTime(items: OrderItem[]): number {
    if (items.length === 0) return 0;
    
    // Get the maximum prep time among all items
    const maxPrepTime = Math.max(...items.map(item => item.menuItem.preparationTime || 15));
    
    // Add 5 minutes for each additional item
    const additionalTime = Math.max(0, items.length - 1) * 5;
    
    return maxPrepTime + additionalTime;
  }

  private getAvailableWaiter(): string {
    const waiters = ['Alice Johnson', 'Bob Wilson', 'Carol Davis', 'David Brown', 'Emma Wilson'];
    return waiters[Math.floor(Math.random() * waiters.length)];
  }

  private getAvailableChef(): string {
    const chefs = ['Chef Marco', 'Chef Sarah', 'Chef Antonio', 'Chef Lisa'];
    return chefs[Math.floor(Math.random() * chefs.length)];
  }

  private initializeMockOrders(): void {
    const mockItems: OrderItem[] = [
      {
        id: '1',
        menuItemId: 'menu-1',
        menuItem: {
          id: 'menu-1',
          name: 'Grilled Chicken Breast',
          price: 25.99,
          category: 'Main Course',
          preparationTime: 20,
        },
        quantity: 1,
        unitPrice: 25.99,
        totalPrice: 25.99,
        modifiers: [],
        status: 'preparing',
      },
      {
        id: '2',
        menuItemId: 'menu-2',
        menuItem: {
          id: 'menu-2',
          name: 'Caesar Salad',
          price: 12.99,
          category: 'Appetizer',
          preparationTime: 10,
        },
        quantity: 2,
        unitPrice: 12.99,
        totalPrice: 25.98,
        modifiers: [
          { id: 'mod-1', name: 'Extra Dressing', price: 1.50, category: 'addon' }
        ],
        status: 'ready',
      },
    ];

    const mockOrders: Order[] = [
      {
        id: '1',
        orderNumber: 'ORD-20241201-1234',
        tableNumber: 5,
        customerName: 'John Smith',
        customerPhone: '+1234567890',
        items: mockItems,
        status: 'preparing',
        priority: 'normal',
        subtotal: 51.97,
        taxAmount: 5.20,
        discountAmount: 0,
        totalAmount: 57.17,
        paymentStatus: 'paid',
        paymentMethod: 'card',
        orderType: 'dine-in',
        notes: 'Customer prefers medium-rare chicken',
        estimatedPrepTime: 25,
        assignedWaiter: 'Alice Johnson',
        assignedChef: 'Chef Marco',
        createdAt: new Date(Date.now() - 15 * 60 * 1000),
        updatedAt: new Date(Date.now() - 10 * 60 * 1000),
        confirmedAt: new Date(Date.now() - 12 * 60 * 1000),
      },
      {
        id: '2',
        orderNumber: 'ORD-20241201-1235',
        customerName: 'Sarah Johnson',
        customerPhone: '+1234567891',
        items: [mockItems[1]],
        status: 'ready',
        priority: 'high',
        subtotal: 25.98,
        taxAmount: 2.60,
        discountAmount: 2.00,
        totalAmount: 26.58,
        paymentStatus: 'paid',
        paymentMethod: 'cash',
        orderType: 'takeaway',
        estimatedPrepTime: 15,
        actualPrepTime: 12,
        assignedWaiter: 'Bob Wilson',
        createdAt: new Date(Date.now() - 8 * 60 * 1000),
        updatedAt: new Date(Date.now() - 3 * 60 * 1000),
        confirmedAt: new Date(Date.now() - 7 * 60 * 1000),
        readyAt: new Date(Date.now() - 3 * 60 * 1000),
      },
      {
        id: '3',
        orderNumber: 'ORD-20241201-1236',
        tableNumber: 12,
        customerName: 'Mike Brown',
        customerPhone: '+1234567892',
        items: mockItems,
        status: 'confirmed',
        priority: 'normal',
        subtotal: 77.95,
        taxAmount: 7.80,
        discountAmount: 5.00,
        totalAmount: 80.75,
        paymentStatus: 'pending',
        orderType: 'dine-in',
        notes: 'Birthday celebration - please add candle to dessert',
        estimatedPrepTime: 30,
        assignedWaiter: 'Carol Davis',
        createdAt: new Date(Date.now() - 25 * 60 * 1000),
        updatedAt: new Date(Date.now() - 20 * 60 * 1000),
        confirmedAt: new Date(Date.now() - 20 * 60 * 1000),
      },
      {
        id: '4',
        orderNumber: 'ORD-20241201-1237',
        customerName: 'Emma Davis',
        customerPhone: '+1234567893',
        items: [
          {
            id: '3',
            menuItemId: 'menu-3',
            menuItem: {
              id: 'menu-3',
              name: 'Beef Burger',
              price: 18.99,
              category: 'Main Course',
              preparationTime: 15,
            },
            quantity: 1,
            unitPrice: 18.99,
            totalPrice: 18.99,
            modifiers: [],
            status: 'pending',
          }
        ],
        status: 'pending',
        priority: 'urgent',
        subtotal: 18.99,
        taxAmount: 1.90,
        discountAmount: 0,
        totalAmount: 20.89,
        paymentStatus: 'pending',
        orderType: 'delivery',
        estimatedPrepTime: 20,
        createdAt: new Date(Date.now() - 5 * 60 * 1000),
        updatedAt: new Date(Date.now() - 5 * 60 * 1000),
      },
      {
        id: '5',
        orderNumber: 'ORD-20241201-1238',
        tableNumber: 8,
        customerName: 'Robert Wilson',
        customerPhone: '+1234567894',
        items: [
          {
            id: '4',
            menuItemId: 'menu-4',
            menuItem: {
              id: 'menu-4',
              name: 'Margherita Pizza',
              price: 22.99,
              category: 'Main Course',
              preparationTime: 25,
            },
            quantity: 1,
            unitPrice: 22.99,
            totalPrice: 22.99,
            modifiers: [],
            status: 'served',
          }
        ],
        status: 'served',
        priority: 'normal',
        subtotal: 22.99,
        taxAmount: 2.30,
        discountAmount: 0,
        totalAmount: 25.29,
        paymentStatus: 'paid',
        paymentMethod: 'card',
        orderType: 'dine-in',
        estimatedPrepTime: 25,
        actualPrepTime: 23,
        assignedWaiter: 'David Brown',
        assignedChef: 'Chef Sarah',
        createdAt: new Date(Date.now() - 45 * 60 * 1000),
        updatedAt: new Date(Date.now() - 10 * 60 * 1000),
        confirmedAt: new Date(Date.now() - 40 * 60 * 1000),
        readyAt: new Date(Date.now() - 15 * 60 * 1000),
        servedAt: new Date(Date.now() - 10 * 60 * 1000),
      }
    ];

    this.orders = mockOrders;
  }
}