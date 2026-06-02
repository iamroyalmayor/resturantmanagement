import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Calendar, History, Gift, Clock, MapPin } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { formatCurrency } from '../../constants/currency';

export function CustomerHome() {
  const { user } = useAuth();

  const quickActions = [
    {
      title: 'Browse Menu',
      description: 'Order food delivery or pickup',
      icon: ShoppingCart,
      color: 'orange',
      href: '/customer/menu',
    },
    {
      title: 'Make Reservation',
      description: 'Book a table at our restaurant',
      icon: Calendar,
      color: 'blue',
      href: '/customer/reservations',
    },
    {
      title: 'Order History',
      description: 'View your past orders',
      icon: History,
      color: 'green',
      href: '/customer/orders',
    },
    {
      title: 'Loyalty Points',
      description: '2,850 points earned',
      icon: Gift,
      color: 'purple',
      href: '/customer/loyalty',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Welcome back, {user?.name}!</h1>
        <p className="text-gray-600 mt-2">Enjoy a better restaurant experience with your personalized dashboard</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Orders</p>
              <p className="text-2xl font-bold text-gray-900">12</p>
            </div>
            <ShoppingCart className="h-8 w-8 text-orange-100" />
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Reservations</p>
              <p className="text-2xl font-bold text-gray-900">3</p>
            </div>
            <Calendar className="h-8 w-8 text-blue-100" />
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Loyalty Points</p>
              <p className="text-2xl font-bold text-gray-900">2,850</p>
            </div>
            <Gift className="h-8 w-8 text-purple-100" />
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Spent</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(1823.50)}</p>
            </div>
            <Clock className="h-8 w-8 text-green-100" />
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">What would you like to do?</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action) => {
            const Icon = action.icon;
            const colorMap = {
              orange: 'bg-orange-50 text-orange-600 border-orange-200',
              blue: 'bg-blue-50 text-blue-600 border-blue-200',
              green: 'bg-green-50 text-green-600 border-green-200',
              purple: 'bg-purple-50 text-purple-600 border-purple-200',
            };

            return (
              <Link
                key={action.title}
                to={action.href}
                className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md hover:border-gray-300 transition-all duration-200"
              >
                <div className={`w-12 h-12 rounded-lg ${colorMap[action.color as keyof typeof colorMap]} flex items-center justify-center mb-4`}>
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">{action.title}</h3>
                <p className="text-sm text-gray-600">{action.description}</p>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Recent Orders */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Recent Orders</h2>
          <Link to="/customer/orders" className="text-sm text-orange-600 hover:text-orange-700 font-medium">
            View all
          </Link>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">Order</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">Date</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">Total</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {[
                { id: 'ORD-001', date: 'May 18, 2024', total: formatCurrency(45.99), status: 'Delivered' },
                { id: 'ORD-002', date: 'May 16, 2024', total: formatCurrency(32.50), status: 'Delivered' },
                { id: 'ORD-003', date: 'May 14, 2024', total: formatCurrency(78.25), status: 'Delivered' },
              ].map(order => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{order.id}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{order.date}</td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{order.total}</td>
                  <td className="px-6 py-4 text-sm">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      {order.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
