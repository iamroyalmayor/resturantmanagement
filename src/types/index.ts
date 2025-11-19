export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'waiter' | 'kitchen' | 'customer';
  avatar?: string;
  phone?: string;
  isActive: boolean;
  createdAt: Date;
}

export interface Table {
  id: string;
  number: number;
  capacity: number;
  status: 'available' | 'occupied' | 'reserved' | 'maintenance';
  location: string;
  shape: 'round' | 'square' | 'rectangle';
}

export interface Reservation {
  id: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  tableId: string;
  table: Table;
  date: Date;
  time: string;
  partySize: number;
  status: 'confirmed' | 'seated' | 'completed' | 'cancelled' | 'no-show';
  specialRequests?: string;
  createdAt: Date;
}

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  unit: string;
  currentStock: number;
  minimumStock: number;
  maximumStock: number;
  unitCost: number;
  supplier: string;
  lastRestocked: Date;
  expirationDate?: Date;
}

export interface StaffSchedule {
  id: string;
  staffId: string;
  staff: User;
  date: Date;
  startTime: string;
  endTime: string;
  position: string;
  isWorking: boolean;
  notes?: string;
}

export interface Customer {
  id: string;
  name: string;
  email?: string;
  phone: string;
  address?: string;
  dateOfBirth?: Date;
  loyaltyPoints: number;
  totalOrders: number;
  totalSpent: number;
  preferredTable?: number;
  dietaryRestrictions: string[];
  createdAt: Date;
  lastVisit?: Date;
}

export interface DashboardStats {
  todayRevenue: number;
  todayOrders: number;
  activeReservations: number;
  lowStockItems: number;
  staffOnDuty: number;
  averageOrderValue: number;
  customerSatisfaction: number;
  tableOccupancy: number;
}

export interface StatsCardProps {
  title: string;
  value: string | number;
  change: string;
  changeType: 'positive' | 'negative' | 'neutral';
  icon: React.ComponentType<any>;
  color: 'orange' | 'green' | 'blue' | 'red' | 'purple';
}

// Re-export order and menu types
export * from './order';
export * from './menu';
export * from './inventory';