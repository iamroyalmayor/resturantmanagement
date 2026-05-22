import { Order, User, DashboardStats } from '../types';
import { appConfig } from '../config/app';

// Mock user data
export const mockUser: User = {
  id: '1',
  name: 'Restaurant Admin',
  email: appConfig.supportEmail,
  role: 'admin',
  avatar: 'https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2',
  isActive: true,
  createdAt: new Date(),
};

// Mock orders data
export const mockOrders: Order[] = [
  {
    id: '1',
    tableNumber: 5,
    customerName: 'John Smith',
    items: [],
    status: 'preparing',
    totalAmount: 45.99,
    taxAmount: 4.60,
    discountAmount: 0,
    paymentStatus: 'paid',
    orderType: 'dine-in',
    createdAt: new Date(Date.now() - 15 * 60 * 1000),
    updatedAt: new Date(),
  },
  {
    id: '2',
    customerName: 'Sarah Johnson',
    items: [],
    status: 'ready',
    totalAmount: 32.50,
    taxAmount: 3.25,
    discountAmount: 0,
    paymentStatus: 'paid',
    orderType: 'takeaway',
    createdAt: new Date(Date.now() - 8 * 60 * 1000),
    updatedAt: new Date(),
  },
  {
    id: '3',
    tableNumber: 12,
    customerName: 'Mike Brown',
    items: [],
    status: 'confirmed',
    totalAmount: 78.25,
    taxAmount: 7.83,
    discountAmount: 5.00,
    paymentStatus: 'pending',
    orderType: 'dine-in',
    createdAt: new Date(Date.now() - 25 * 60 * 1000),
    updatedAt: new Date(),
  },
];

// Mock dashboard stats
export const mockDashboardStats: DashboardStats = {
  todayRevenue: 2847,
  todayOrders: 47,
  activeReservations: 23,
  lowStockItems: 5,
  staffOnDuty: 12,
  averageOrderValue: 38.50,
  customerSatisfaction: 4.8,
  tableOccupancy: 78,
};