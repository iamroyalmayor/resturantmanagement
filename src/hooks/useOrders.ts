import { useState, useEffect } from 'react';
import { Order, OrderFilters, OrderStats } from '../types/order';
import { OrderService } from '../services/orderService';

export const useOrders = (filters?: OrderFilters) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const orderService = OrderService.getInstance();

  useEffect(() => {
    setLoading(true);
    try {
      const filteredOrders = orderService.getOrders(filters);
      setOrders(filteredOrders);
      setError(null);
    } catch (err) {
      setError('Failed to load orders');
      console.error('Error loading orders:', err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    const unsubscribe = orderService.subscribe((updatedOrders) => {
      const filteredOrders = filters ? 
        updatedOrders.filter(order => {
          if (filters.status && !filters.status.includes(order.status)) return false;
          if (filters.orderType && !filters.orderType.includes(order.orderType)) return false;
          if (filters.tableNumber && order.tableNumber !== filters.tableNumber) return false;
          if (filters.waiter && order.assignedWaiter !== filters.waiter) return false;
          if (filters.searchTerm) {
            const searchTerm = filters.searchTerm.toLowerCase();
            if (!order.customerName.toLowerCase().includes(searchTerm) &&
                !order.orderNumber.toLowerCase().includes(searchTerm) &&
                !order.id.includes(searchTerm)) {
              return false;
            }
          }
          return true;
        }) : updatedOrders;
      
      setOrders(filteredOrders);
    });

    return unsubscribe;
  }, [filters]);

  const updateOrderStatus = async (orderId: string, status: Order['status']) => {
    try {
      await orderService.updateOrderStatus(orderId, status);
    } catch (err) {
      setError('Failed to update order status');
      console.error('Error updating order status:', err);
    }
  };

  const cancelOrder = async (orderId: string, reason?: string) => {
    try {
      await orderService.cancelOrder(orderId, reason);
    } catch (err) {
      setError('Failed to cancel order');
      console.error('Error canceling order:', err);
    }
  };

  const createOrder = async (orderData: Partial<Order>) => {
    try {
      const newOrder = await orderService.createOrder(orderData);
      return newOrder;
    } catch (err) {
      setError('Failed to create order');
      console.error('Error creating order:', err);
      throw err;
    }
  };

  return {
    orders,
    loading,
    error,
    updateOrderStatus,
    cancelOrder,
    createOrder,
  };
};

export const useOrderStats = (dateRange?: { start: Date; end: Date }) => {
  const [stats, setStats] = useState<OrderStats | null>(null);
  const [loading, setLoading] = useState(true);

  const orderService = OrderService.getInstance();

  useEffect(() => {
    const loadStats = () => {
      setLoading(true);
      try {
        const orderStats = orderService.getOrderStats(dateRange);
        setStats(orderStats);
      } catch (err) {
        console.error('Error loading order stats:', err);
      } finally {
        setLoading(false);
      }
    };

    loadStats();

    const unsubscribe = orderService.subscribe(() => {
      loadStats();
    });

    return unsubscribe;
  }, [dateRange]);

  return { stats, loading };
};