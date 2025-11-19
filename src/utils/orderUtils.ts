import { Order, OrderStatus, OrderType } from '../types/order';

// Order status utilities
export const getStatusColor = (status: OrderStatus | 'pending' | 'preparing' | 'ready' | 'served'): string => {
  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    confirmed: 'bg-blue-100 text-blue-800',
    preparing: 'bg-orange-100 text-orange-800',
    ready: 'bg-green-100 text-green-800',
    served: 'bg-purple-100 text-purple-800',
    completed: 'bg-gray-100 text-gray-800',
    cancelled: 'bg-red-100 text-red-800',
  };
  
  return statusColors[status as keyof typeof statusColors] || statusColors.pending;
};

export const calculateOrderTotal = (order: Order): number => {
  return order.totalAmount + order.taxAmount - order.discountAmount;
};

export const getOrderTypeDisplay = (orderType: OrderType | string): string => {
  return orderType.split('-').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
};

export const getOrderPriorityColor = (priority: 'normal' | 'high' | 'urgent'): string => {
  const priorityColors = {
    normal: 'text-gray-500',
    high: 'text-orange-500',
    urgent: 'text-red-500',
  };
  
  return priorityColors[priority] || priorityColors.normal;
};

export const calculateEstimatedDeliveryTime = (order: Order): Date => {
  const now = new Date();
  const estimatedTime = new Date(now.getTime() + order.estimatedPrepTime * 60 * 1000);
  
  // Add extra time for delivery orders
  if (order.orderType === 'delivery') {
    estimatedTime.setMinutes(estimatedTime.getMinutes() + 20); // 20 min delivery time
  }
  
  return estimatedTime;
};

export const isOrderOverdue = (order: Order): boolean => {
  if (order.status === 'completed' || order.status === 'cancelled') {
    return false;
  }
  
  const now = new Date();
  const expectedTime = new Date(order.createdAt.getTime() + order.estimatedPrepTime * 60 * 1000);
  
  return now > expectedTime;
};

export const getOrderStatusProgress = (status: OrderStatus): number => {
  const statusProgress = {
    pending: 0,
    confirmed: 20,
    preparing: 50,
    ready: 80,
    served: 90,
    completed: 100,
    cancelled: 0,
  };
  
  return statusProgress[status] || 0;
};