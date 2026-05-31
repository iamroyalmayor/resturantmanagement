import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Table,
  Menu,
  Calendar,
  Users,
  UserCheck,
  BarChart3,
  Settings,
  ChefHat,
  Utensils,
  X,
  MessageCircle,
  CreditCard
} from 'lucide-react';
import { appConfig } from '../../config/app';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Orders', href: '/dashboard/orders', icon: ShoppingCart },
  { name: 'Conversations', href: '/dashboard/conversations', icon: MessageCircle },
  { name: 'Menu Management', href: '/dashboard/menu', icon: Menu },
  { name: 'Inventory', href: '/dashboard/inventory', icon: Package },
  { name: 'Reservations', href: '/dashboard/reservations', icon: Calendar },
  { name: 'Tables', href: '/dashboard/tables', icon: Table },
  {
    name: 'Staff',
    href: '/dashboard/staff',
    icon: UserCheck,
    children: [
      { name: 'All Staff', href: '/dashboard/staff' },
      { name: 'Permissions', href: '/dashboard/staff/permissions' },
    ],
  },
  { name: 'Customers', href: '/dashboard/customers', icon: Users },
  { name: 'Reports', href: '/dashboard/reports', icon: BarChart3 },  { name: 'Accounting', href: '/dashboard/accounting', icon: CreditCard },  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
];

const quickAccess = [
  { name: 'Kitchen Display', href: '/dashboard/kitchen', icon: ChefHat },
  { name: 'POS System', href: '/dashboard/pos', icon: Utensils },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const location = useLocation();

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex lg:h-full lg:w-64 lg:flex-col lg:bg-white lg:shadow-xl">
        <SidebarContent location={location} />
      </div>

      {/* Mobile Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-xl transform transition-transform duration-300 ease-in-out lg:hidden ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex h-16 items-center justify-between px-4 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <ChefHat className="h-8 w-8 text-orange-500" />
            <span className="text-xl font-bold text-gray-900">{appConfig.appName}</span>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <SidebarContent location={location} onItemClick={onClose} />
      </div>
    </>
  );
}

function SidebarContent({ location, onItemClick }: { location: any; onItemClick?: () => void }) {
  const [openGroup, setOpenGroup] = useState<string | null>(null);

  const toggleGroup = (name: string) => setOpenGroup((prev) => (prev === name ? null : name));

  return (
    <div className="flex h-full flex-col">
      {/* Desktop Header */}
      <div className="hidden lg:flex lg:h-16 lg:items-center lg:justify-center lg:border-b lg:border-gray-200">
        <div className="flex items-center space-x-2">
          <ChefHat className="h-8 w-8 text-orange-500" />
          <span className="text-xl font-bold text-gray-900">RestaurantOS</span>
        </div>
      </div>
      
      <nav className="flex-1 space-y-6 py-6 overflow-y-auto">
        <div className="space-y-1 px-3">
          <h3 className="px-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
            Main Menu
          </h3>
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            if (item.children) {
              const isOpen = openGroup === item.name;
              return (
                <div key={item.name}>
                  <button
                    onClick={() => toggleGroup(item.name)}
                    className={`w-full flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 ${
                      isOpen ? 'bg-orange-50 text-orange-700 shadow-sm' : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <item.icon className={`mr-3 h-5 w-5 flex-shrink-0 ${isOpen ? 'text-orange-500' : 'text-gray-400'}`} />
                    <span className="truncate">{item.name}</span>
                    <div className="ml-auto text-xs text-gray-500">{isOpen ? '▾' : '▸'}</div>
                  </button>
                  {isOpen && (
                    <div className="mt-2 space-y-1 pl-10">
                      {item.children.map((c: any) => (
                        <Link key={c.href} to={c.href} onClick={onItemClick} className="block px-3 py-2 rounded text-sm text-gray-700 hover:bg-gray-50">
                          {c.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            }

            return (
              <Link
                key={item.name}
                to={item.href}
                onClick={onItemClick}
                className={`group flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-orange-50 text-orange-700 shadow-sm'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <item.icon
                  className={`mr-3 h-5 w-5 flex-shrink-0 ${
                    isActive ? 'text-orange-500' : 'text-gray-400 group-hover:text-gray-500'
                  }`}
                />
                <span className="truncate">{item.name}</span>
                {isActive && (
                  <div className="ml-auto h-2 w-2 rounded-full bg-orange-500 flex-shrink-0" />
                )}
              </Link>
            );
          })}
        </div>

        <div className="space-y-1 px-3">
          <h3 className="px-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
            Quick Access
          </h3>
          {quickAccess.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                onClick={onItemClick}
                className={`group flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-green-50 text-green-700 shadow-sm'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <item.icon
                  className={`mr-3 h-5 w-5 flex-shrink-0 ${
                    isActive ? 'text-green-500' : 'text-gray-400 group-hover:text-gray-500'
                  }`}
                />
                <span className="truncate">{item.name}</span>
                {isActive && (
                  <div className="ml-auto h-2 w-2 rounded-full bg-green-500 flex-shrink-0" />
                )}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}