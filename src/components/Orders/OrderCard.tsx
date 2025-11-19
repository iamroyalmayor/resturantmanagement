import React from 'react';
import { Clock, User, MapPin, Phone, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { Order } from '../../types/order';
import { formatCurrency } from '../../constants/currency';
import { getTimeAgo } from '../../utils';
import { getStatusColor, getOrderTypeDisplay } from '../../utils/orderUtils';

interface OrderCardProps {
  order: Order;
  onStatusUpdate: (orderId: string, status: Order['status']) => void;
  onViewDetails: (order: Order) => void;
  compact?: boolean;
}

export function OrderCard({ order, onStatusUpdate, onViewDetails, compact = false }: OrderCardProps) {
  const getStatusActions = () => {
    switch (order.status) {
      case 'pending':
        return [
          { label: 'Confirm', status: 'confirmed' as const, color: 'bg-blue-600 hover:bg-blue-700' },
          { label: 'Cancel', status: 'cancelled' as const, color: 'bg-red-600 hover:bg-red-700' },
        ];
      case 'confirmed':
        return [
          { label: 'Start Preparing', status: 'preparing' as const, color: 'bg-orange-600 hover:bg-orange-700' },
        ];
      case 'preparing':
        return [
          { label: 'Mark Ready', status: 'ready' as const, color: 'bg-green-600 hover:bg-green-700' },
        ];
      case 'ready':
        return [
          { label: 'Serve', status: 'served' as const, color: 'bg-purple-600 hover:bg-purple-700' },
        ];
      case 'served':
        return [
          { label: 'Complete', status: 'completed' as const, color: 'bg-gray-600 hover:bg-gray-700' },
        ];
      default:
        return [];
    }
  };

  const getPriorityIcon = () => {
    switch (order.priority) {
      case 'urgent':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'high':
        return <AlertCircle className="h-4 w-4 text-orange-500" />;
      default:
        return null;
    }
  };

  const getPaymentStatusIcon = () => {
    switch (order.paymentStatus) {
      case 'paid':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-500" />;
    }
  };

  if (compact) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow duration-200">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <span className="font-medium text-gray-900">#{order.orderNumber}</span>
            {getPriorityIcon()}
          </div>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
            {order.status}
          </span>
        </div>
        
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>{order.customerName}</span>
          <span className="font-medium text-gray-900">{formatCurrency(order.totalAmount)}</span>
        </div>
        
        <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
          <span>{getTimeAgo(order.createdAt)}</span>
          <span>{order.estimatedPrepTime}min</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6 hover:shadow-lg transition-all duration-200">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-orange-100 flex items-center justify-center">
              <span className="text-sm sm:text-base font-bold text-orange-600">
                #{order.id}
              </span>
            </div>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                {order.orderNumber}
              </h3>
              {getPriorityIcon()}
            </div>
            <p className="text-sm text-gray-600">{order.customerName}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {getPaymentStatusIcon()}
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
            {order.status}
          </span>
        </div>
      </div>

      {/* Order Details */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <div className="space-y-2">
          <div className="flex items-center text-sm text-gray-600">
            <MapPin className="h-4 w-4 mr-2" />
            {order.tableNumber ? `Table ${order.tableNumber}` : getOrderTypeDisplay(order.orderType)}
          </div>
          {order.customerPhone && (
            <div className="flex items-center text-sm text-gray-600">
              <Phone className="h-4 w-4 mr-2" />
              {order.customerPhone}
            </div>
          )}
          {order.assignedWaiter && (
            <div className="flex items-center text-sm text-gray-600">
              <User className="h-4 w-4 mr-2" />
              {order.assignedWaiter}
            </div>
          )}
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center text-sm text-gray-600">
            <Clock className="h-4 w-4 mr-2" />
            {getTimeAgo(order.createdAt)}
          </div>
          <div className="text-sm text-gray-600">
            Est. {order.estimatedPrepTime} min
            {order.actualPrepTime && (
              <span className="ml-2 text-green-600">
                (Actual: {order.actualPrepTime} min)
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Order Items */}
      <div className="mb-4">
        <h4 className="text-sm font-medium text-gray-900 mb-2">Items ({order.items.length})</h4>
        <div className="space-y-1">
          {order.items.slice(0, 3).map((item) => (
            <div key={item.id} className="flex items-center justify-between text-sm">
              <span className="text-gray-600">
                {item.quantity}x {item.menuItem.name}
              </span>
              <span className="font-medium text-gray-900">
                {formatCurrency(item.totalPrice)}
              </span>
            </div>
          ))}
          {order.items.length > 3 && (
            <div className="text-sm text-gray-500">
              +{order.items.length - 3} more items
            </div>
          )}
        </div>
      </div>

      {/* Notes */}
      {order.notes && (
        <div className="mb-4 p-3 bg-yellow-50 rounded-lg">
          <p className="text-sm text-yellow-800">
            <strong>Notes:</strong> {order.notes}
          </p>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
        <div className="text-right">
          <p className="text-lg font-bold text-gray-900">
            {formatCurrency(order.totalAmount)}
          </p>
          <p className="text-sm text-gray-500">
            {order.paymentMethod && `via ${order.paymentMethod}`}
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onViewDetails(order)}
            className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200"
          >
            View Details
          </button>
          
          {getStatusActions().map((action) => (
            <button
              key={action.status}
              onClick={() => onStatusUpdate(order.id, action.status)}
              className={`px-3 py-1.5 text-sm font-medium text-white rounded-lg transition-colors duration-200 ${action.color}`}
            >
              {action.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}