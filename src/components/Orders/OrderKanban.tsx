import React from 'react';
import { Clock, User, MapPin } from 'lucide-react';
import { Order } from '../../types/order';
import { formatCurrency } from '../../constants/currency';
import { getTimeAgo, getStatusColor } from '../../utils';

interface OrderKanbanProps {
  orders: Order[];
  onStatusUpdate: (orderId: string, status: Order['status']) => void;
  onViewDetails: (order: Order) => void;
}

const statusColumns = [
  { status: 'pending' as const, title: 'Pending', color: 'bg-yellow-50 border-yellow-200' },
  { status: 'confirmed' as const, title: 'Confirmed', color: 'bg-blue-50 border-blue-200' },
  { status: 'preparing' as const, title: 'Preparing', color: 'bg-orange-50 border-orange-200' },
  { status: 'ready' as const, title: 'Ready', color: 'bg-green-50 border-green-200' },
  { status: 'served' as const, title: 'Served', color: 'bg-purple-50 border-purple-200' },
];

export function OrderKanban({ orders, onStatusUpdate, onViewDetails }: OrderKanbanProps) {
  const getOrdersForStatus = (status: Order['status']) => {
    return orders.filter(order => order.status === status);
  };

  const handleDragStart = (e: React.DragEvent, orderId: string) => {
    e.dataTransfer.setData('text/plain', orderId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, newStatus: Order['status']) => {
    e.preventDefault();
    const orderId = e.dataTransfer.getData('text/plain');
    onStatusUpdate(orderId, newStatus);
  };

  return (
    <div className="flex space-x-4 overflow-x-auto pb-4">
      {statusColumns.map(column => {
        const columnOrders = getOrdersForStatus(column.status);
        
        return (
          <div
            key={column.status}
            className={`flex-shrink-0 w-80 rounded-lg border-2 border-dashed ${column.color} p-4`}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, column.status)}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">{column.title}</h3>
              <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-sm font-medium">
                {columnOrders.length}
              </span>
            </div>
            
            <div className="space-y-3 max-h-[calc(100vh-300px)] overflow-y-auto">
              {columnOrders.map(order => (
                <KanbanOrderCard
                  key={order.id}
                  order={order}
                  onViewDetails={onViewDetails}
                  onDragStart={handleDragStart}
                />
              ))}
              
              {columnOrders.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <p className="text-sm">No orders in {column.title.toLowerCase()}</p>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

interface KanbanOrderCardProps {
  order: Order;
  onViewDetails: (order: Order) => void;
  onDragStart: (e: React.DragEvent, orderId: string) => void;
}

function KanbanOrderCard({ order, onViewDetails, onDragStart }: KanbanOrderCardProps) {
  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, order.id)}
      onClick={() => onViewDetails(order)}
      className="bg-white rounded-lg border border-gray-200 p-4 cursor-move hover:shadow-md transition-shadow duration-200"
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <h4 className="font-medium text-gray-900">#{order.id}</h4>
          <p className="text-sm text-gray-600">{order.customerName}</p>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
          {order.status}
        </span>
      </div>

      <div className="space-y-2 mb-3">
        <div className="flex items-center text-sm text-gray-600">
          <MapPin className="h-3 w-3 mr-1" />
          {order.tableNumber ? `Table ${order.tableNumber}` : order.orderType}
        </div>
        <div className="flex items-center text-sm text-gray-600">
          <Clock className="h-3 w-3 mr-1" />
          {getTimeAgo(order.createdAt)}
        </div>
        {order.assignedWaiter && (
          <div className="flex items-center text-sm text-gray-600">
            <User className="h-3 w-3 mr-1" />
            {order.assignedWaiter}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-500">
          {order.items.length} item{order.items.length !== 1 ? 's' : ''}
        </span>
        <span className="font-semibold text-gray-900">
          {formatCurrency(order.totalAmount)}
        </span>
      </div>

      {order.priority !== 'normal' && (
        <div className="mt-2">
          <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
            order.priority === 'urgent' ? 'bg-red-100 text-red-800' : 'bg-orange-100 text-orange-800'
          }`}>
            {order.priority} priority
          </span>
        </div>
      )}
    </div>
  );
}