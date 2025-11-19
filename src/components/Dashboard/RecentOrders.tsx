import React from 'react';
import { Clock, Eye } from 'lucide-react';
import { Order } from '../../types';
import { mockOrders } from '../../data/mockData';
import { formatCurrency } from '../../constants/currency';
import { getTimeAgo, getStatusColor } from '../../utils';

export function RecentOrders() {
  return (
    <div className="rounded-xl bg-white p-4 sm:p-6 shadow-sm ring-1 ring-gray-200">
      <div className="mb-4 sm:mb-6 flex items-center justify-between">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900">Recent Orders</h3>
        <button className="text-xs sm:text-sm text-orange-600 hover:text-orange-700 font-medium">
          View all
        </button>
      </div>
      
      <div className="space-y-3 sm:space-y-4">
        {mockOrders.map((order) => (
          <OrderCard key={order.id} order={order} />
        ))}
      </div>
    </div>
  );
}

interface OrderCardProps {
  order: Order;
}

function OrderCard({ order }: OrderCardProps) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-gray-200 p-3 sm:p-4 hover:bg-gray-50 transition-colors duration-200">
      <div className="flex items-center space-x-3 sm:space-x-4 min-w-0 flex-1">
        <div className="flex-shrink-0">
          <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-orange-100 flex items-center justify-center">
            <span className="text-xs sm:text-sm font-medium text-orange-600">
              #{order.id}
            </span>
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs sm:text-sm font-medium text-gray-900 truncate">{order.customerName}</p>
          <div className="flex flex-wrap items-center gap-1 sm:gap-2 text-xs text-gray-500 mt-1">
            {order.tableNumber && <span>Table {order.tableNumber}</span>}
            {order.tableNumber && <span>•</span>}
            <span className="capitalize">{order.orderType}</span>
            <span>•</span>
            <div className="flex items-center">
              <Clock className="mr-1 h-3 w-3" />
              {getTimeAgo(order.createdAt)}
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex items-center space-x-2 sm:space-x-4 flex-shrink-0">
        <div className="text-right">
          <span className="text-xs sm:text-sm font-medium text-gray-900 block">
            {formatCurrency(order.totalAmount)}
          </span>
          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium mt-1 ${getStatusColor(order.status)}`}>
            {order.status}
          </span>
        </div>
        <button className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 hidden sm:block">
          <Eye className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}