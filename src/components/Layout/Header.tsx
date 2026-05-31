import React from 'react';
import { Bell, Search, User, LogOut, Menu } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface HeaderProps {
  onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const { user, logout } = useAuth();

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6">
        <div className="flex items-center space-x-4">
          {/* Mobile menu button */}
          <button
            onClick={onMenuClick}
            className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500 lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* Search - Hidden on mobile, visible on tablet+ */}
          <div className="relative hidden sm:block">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search orders, customers, menu items..."
              className="w-64 lg:w-96 rounded-lg border border-gray-300 bg-gray-50 py-2 pl-10 pr-4 text-sm focus:border-orange-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-orange-500"
            />
          </div>
        </div>

        <div className="flex items-center space-x-2 sm:space-x-4">
          {/* Mobile search button */}
          <button className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500 sm:hidden">
            <Search className="h-5 w-5" />
          </button>

          {/* Notifications */}
          <button className="relative rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500">
            <Bell className="h-5 w-5" />
            <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-xs text-white flex items-center justify-center">
              3
            </span>
          </button>

          {/* User menu */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* User info - Hidden on mobile */}
            <div className="hidden sm:flex sm:flex-col sm:text-right">
              <span className="text-sm font-medium text-gray-900 truncate max-w-32">{user?.name}</span>
              <span className="text-xs text-gray-500 capitalize">{user?.role}</span>
            </div>
            
            <div className="relative group">
              <button className="flex items-center space-x-1 sm:space-x-2 rounded-lg p-2 hover:bg-gray-100">
                <img
                  src={user?.avatar || 'https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg?auto=compress&cs=tinysrgb&w=40&h=40&dpr=2'}
                  alt={user?.name}
                  className="h-8 w-8 rounded-full object-cover"
                />
                <User className="h-4 w-4 text-gray-400 hidden sm:block" />
              </button>
              
              <div className="absolute right-0 top-full mt-2 w-48 rounded-lg bg-white py-2 shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                {/* Mobile user info */}
                <div className="px-4 py-2 border-b border-gray-100 sm:hidden">
                  <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                  <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
                </div>
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
      </div>
    </header>
  );
}