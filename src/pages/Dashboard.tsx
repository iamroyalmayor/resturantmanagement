import React from 'react';
import { 
  DollarSign, 
  ShoppingCart, 
  Calendar, 
  Package, 
  Users, 
  TrendingUp,
  Percent,
  Clock
} from 'lucide-react';
import { StatsCard } from '../components/Dashboard/StatsCard';
import { RecentOrders } from '../components/Dashboard/RecentOrders';
import { SmartAlerts } from '../components/Alerts/SmartAlerts';
import { mockDashboardStats } from '../data/mockData';
import { formatCurrency } from '../constants/currency';
import { formatDate } from '../utils/dateUtils';

export function Dashboard() {
  const stats = mockDashboardStats;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <DashboardHeader />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 sm:gap-6">
        <StatsCard
          title="Today's Revenue"
          value={formatCurrency(stats.todayRevenue)}
          change="+12.5%"
          changeType="positive"
          icon={DollarSign}
          color="green"
        />
        <StatsCard
          title="Orders Today"
          value={stats.todayOrders}
          change="+8.2%"
          changeType="positive"
          icon={ShoppingCart}
          color="blue"
        />
        <StatsCard
          title="Active Reservations"
          value={stats.activeReservations}
          change="-3.1%"
          changeType="negative"
          icon={Calendar}
          color="purple"
        />
        <StatsCard
          title="Low Stock Items"
          value={stats.lowStockItems}
          change="+2"
          changeType="negative"
          icon={Package}
          color="red"
        />
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 gap-4 sm:gap-6 xl:grid-cols-8">
        {/* Recent Orders */}
        <div className="xl:col-span-5">
          <RecentOrders />
        </div>
        
        {/* Sidebar Content */}
        <div className="space-y-4 sm:space-y-6 xl:col-span-3">
          <SmartAlerts />
          <QuickStats stats={stats} />
          <PeakHoursAlert />
        </div>
      </div>
    </div>
  );
}

function DashboardHeader() {
  return (
    <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm sm:text-base text-gray-600">Welcome back! Here's what's happening at your restaurant today.</p>
      </div>
      <div className="text-left sm:text-right">
        <p className="text-sm text-gray-500">Today's Date</p>
        <p className="text-base sm:text-lg font-semibold text-gray-900">
          {formatDate(new Date())}
        </p>
      </div>
    </div>
  );
}

interface QuickStatsProps {
  stats: typeof mockDashboardStats;
}

function QuickStats({ stats }: QuickStatsProps) {
  const quickStatsData = [
    {
      icon: TrendingUp,
      label: 'Avg Order Value',
      value: formatCurrency(stats.averageOrderValue),
      color: 'orange'
    },
    {
      icon: Percent,
      label: 'Table Occupancy',
      value: `${stats.tableOccupancy}%`,
      color: 'green'
    },
    {
      icon: Users,
      label: 'Staff on Duty',
      value: stats.staffOnDuty.toString(),
      color: 'blue'
    },
    {
      icon: Clock,
      label: 'Avg Prep Time',
      value: '18 min',
      color: 'purple'
    }
  ];

  return (
    <div className="rounded-xl bg-white p-4 sm:p-6 shadow-sm ring-1 ring-gray-200">
      <h3 className="mb-4 text-base sm:text-lg font-semibold text-gray-900">Quick Stats</h3>
      <div className="space-y-3 sm:space-y-4">
        {quickStatsData.map((stat, index) => (
          <QuickStatItem key={index} {...stat} />
        ))}
      </div>
    </div>
  );
}

interface QuickStatItemProps {
  icon: React.ComponentType<any>;
  label: string;
  value: string;
  color: string;
}

function QuickStatItem({ icon: Icon, label, value, color }: QuickStatItemProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-2 sm:space-x-3">
        <div className={`rounded-lg bg-${color}-100 p-1.5 sm:p-2`}>
          <Icon className={`h-3 w-3 sm:h-4 sm:w-4 text-${color}-600`} />
        </div>
        <span className="text-xs sm:text-sm text-gray-600">{label}</span>
      </div>
      <span className="text-xs sm:text-sm font-medium text-gray-900">{value}</span>
    </div>
  );
}

function PeakHoursAlert() {
  return (
    <div className="rounded-xl bg-gradient-to-br from-orange-500 to-red-600 p-4 sm:p-6 text-white">
      <h3 className="mb-2 text-base sm:text-lg font-semibold">Peak Hours Alert</h3>
      <p className="mb-4 text-xs sm:text-sm text-orange-100">
        Lunch rush starting soon. Consider adding more staff to kitchen and front of house.
      </p>
      <button className="rounded-lg bg-white bg-opacity-20 px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium text-white hover:bg-opacity-30 transition-colors duration-200">
        View Schedule
      </button>
    </div>
  );
}