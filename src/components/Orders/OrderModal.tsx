import React from 'react';
import { X, Clock, User, MapPin, Phone, CreditCard, AlertCircle } from 'lucide-react';
import { Order } from '../../types/order';
import { OrderTimeline } from './OrderTimeline';
import { formatCurrency } from '../../constants/currency';
import { formatTime, getTimeAgo } from '../../utils/dateUtils';
import { getStatusColor, getOrderTypeDisplay } from '../../utils/orderUtils';

interface OrderModalProps {
  order: Order;
  isOpen: boolean;
  onClose: () => void;
  onStatusUpdate: (orderId: string, status: Order['status']) => void;
}

export function OrderModal({ order, isOpen, onClose, onStatusUpdate }: OrderModalProps) {
  if (!isOpen) return null;

  const getStatusActions = () => {
    switch (order.status) {
      case 'pending':
        return [
          { label: 'Confirm Order', status: 'confirmed' as const, color: 'bg-blue-600 hover:bg-blue-700' },
          { label: 'Cancel Order', status: 'cancelled' as const, color: 'bg-red-600 hover:bg-red-700' },
        ];
      case 'confirmed':
        return [
          { label: 'Start Preparing', status: 'preparing' as const, color: 'bg-orange-600 hover:bg-orange-700' },
        ];
      case 'preparing':
        return [
          { label: 'Mark as Ready', status: 'ready' as const, color: 'bg-green-600 hover:bg-green-700' },
        ];
      case 'ready':
        return [
          { label: 'Serve Order', status: 'served' as const, color: 'bg-purple-600 hover:bg-purple-700' },
        ];
      case 'served':
        return [
          { label: 'Complete Order', status: 'completed' as const, color: 'bg-gray-600 hover:bg-gray-700' },
        ];
      default:
        return [];
    }
  };

  const getPriorityIcon = () => {
    if (order.priority === 'urgent') {
      return <AlertCircle className="h-5 w-5 text-red-500" />;
    }
    if (order.priority === 'high') {
      return <AlertCircle className="h-5 w-5 text-orange-500" />;
    }
    return null;
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={onClose} />
        
        <div className="relative bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Order Details</h2>
                <p className="text-sm text-gray-600">{order.orderNumber}</p>
              </div>
              {getPriorityIcon()}
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-6">
                {/* Status and Basic Info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Status</label>
                      <div className="mt-1">
                        <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-500">Customer</label>
                      <p className="mt-1 text-sm text-gray-900">{order.customerName}</p>
                    </div>

                    {order.customerPhone && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Phone className="h-4 w-4 mr-2" />
                        {order.customerPhone}
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Order Type</label>
                      <div className="mt-1 flex items-center text-sm text-gray-900">
                        <MapPin className="h-4 w-4 mr-2" />
                        {order.tableNumber ? `Table ${order.tableNumber}` : getOrderTypeDisplay(order.orderType)}
                      </div>
                    </div>

                    {order.assignedWaiter && (
                      <div className="flex items-center text-sm text-gray-600">
                        <User className="h-4 w-4 mr-2" />
                        {order.assignedWaiter}
                      </div>
                    )}

                    <div className="flex items-center text-sm text-gray-600">
                      <Clock className="h-4 w-4 mr-2" />
                      {getTimeAgo(order.createdAt)}
                    </div>
                  </div>
                </div>

                {/* Order Items */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Order Items</h3>
                  <div className="space-y-3">
                    {order.items.map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="font-medium text-gray-900">{item.menuItem.name}</h4>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                              {item.status}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600">
                            Quantity: {item.quantity} × {formatCurrency(item.unitPrice)}
                          </p>
                          {item.modifiers.length > 0 && (
                            <p className="text-sm text-gray-500">
                              Modifiers: {item.modifiers.map(m => m.name).join(', ')}
                            </p>
                          )}
                          {item.specialInstructions && (
                            <p className="text-sm text-blue-600 italic">
                              Note: {item.specialInstructions}
                            </p>
                          )}
                        </div>
                        <div className="text-right ml-4">
                          <p className="font-medium text-gray-900">{formatCurrency(item.totalPrice)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Order Summary */}
                <div className="border-t border-gray-200 pt-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Order Summary</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Subtotal</span>
                      <span className="text-gray-900">{formatCurrency(order.subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Tax</span>
                      <span className="text-gray-900">{formatCurrency(order.taxAmount)}</span>
                    </div>
                    {order.discountAmount > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Discount</span>
                        <span className="text-red-600">-{formatCurrency(order.discountAmount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-lg font-semibold border-t border-gray-200 pt-2">
                      <span className="text-gray-900">Total</span>
                      <span className="text-gray-900">{formatCurrency(order.totalAmount)}</span>
                    </div>
                  </div>
                </div>

                {/* Payment Info */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <CreditCard className="h-5 w-5 text-gray-400 mr-2" />
                    <span className="text-sm text-gray-600">
                      Payment: {order.paymentMethod || 'Not specified'}
                    </span>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    order.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' :
                    order.paymentStatus === 'failed' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {order.paymentStatus}
                  </span>
                </div>

                {/* Notes */}
                {order.notes && (
                  <div className="p-4 bg-yellow-50 rounded-lg">
                    <h4 className="font-medium text-yellow-800 mb-1">Special Notes</h4>
                    <p className="text-sm text-yellow-700">{order.notes}</p>
                  </div>
                )}
              </div>

              {/* Sidebar - Timeline */}
              <div className="lg:col-span-1">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Timeline</h3>
                  <OrderTimeline order={order} />
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Close
            </button>
            {getStatusActions().map((action) => (
              <button
                key={action.status}
                onClick={() => {
                  onStatusUpdate(order.id, action.status);
                  onClose();
                }}
                className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors duration-200 ${action.color}`}
              >
                {action.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}