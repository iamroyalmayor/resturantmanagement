import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, Search, ShoppingCart, User, LogOut, ChefHat } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { appConfig } from '../../config/app';

interface CustomerHeaderProps {
  onMenuClick: () => void;
}

export function CustomerHeader({ onMenuClick }: CustomerHeaderProps) {
  const { user, logout } = useAuth();
  const location = useLocation();

  const navItems = [
    { name: 'Home', href: '/customer' },
    { name: 'Menu', href: '/menu' },
    { name: 'Reservations', href: '/reservations' },
    { name: 'Orders', href: '/customer/orders' },
  ];

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path);

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="h-16 px-4 sm:px-6 flex items-center justify-between">
        {/* Logo */}
        <Link to="/customer" className="flex items-center space-x-2">
          <ChefHat className="h-8 w-8 text-orange-500" />
          <span className="text-xl font-bold text-gray-900">{appConfig.appName}</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden sm:flex items-center space-x-1">
          {navItems.map(item => (
            <Link
              key={item.name}
              to={item.href}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive(item.href)
                  ? 'bg-orange-50 text-orange-700'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              {item.name}
            </Link>
          ))}
        </nav>

        {/* Right side actions */}
        <div className="flex items-center space-x-2 sm:space-x-4">
          {/* Search */}
          <button className="hidden sm:block rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500">
            <Search className="h-5 w-5" />
          </button>

          {/* Cart */}
          <Link to="/order/checkout" className="relative rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500">
            <ShoppingCart className="h-5 w-5" />
            <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-xs text-white flex items-center justify-center">
              0
            </span>
          </Link>

          {/* User Menu */}
          <div className="relative group">
            <button className="flex items-center space-x-2 rounded-lg p-2 hover:bg-gray-100">
              <img
                src={user?.avatar || 'https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg?auto=compress&cs=tinysrgb&w=40&h=40&dpr=2'}
                alt={user?.name}
                className="h-8 w-8 rounded-full object-cover"
              />
              <User className="h-4 w-4 text-gray-400 hidden sm:block" />
            </button>

            {/* Dropdown Menu */}
            <div className="absolute right-0 top-full mt-2 w-48 rounded-lg bg-white py-2 shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
              <div className="px-4 py-2 border-b border-gray-100">
                <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                <p className="text-xs text-gray-500">{user?.email}</p>
              </div>
              <Link
                to="/customer/profile"
                className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                <User className="mr-3 h-4 w-4" />
                My Profile
              </Link>
              <Link
                to="/customer/loyalty"
                className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                <span>🎁</span>
                <span className="ml-3">Loyalty Points</span>
              </Link>
              <button
                onClick={logout}
                className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                <LogOut className="mr-3 h-4 w-4" />
                Sign out
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
