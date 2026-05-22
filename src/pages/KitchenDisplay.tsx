import React, { useState } from 'react';
import { Clock, AlertCircle, CheckCircle, Flame, ChefHat, Filter } from 'lucide-react';
import { appConfig } from '../config/app';

type OrderStatus = 'new' | 'preparing' | 'ready' | 'completed';

interface KitchenOrder {
  id: string;
  orderNumber: string;
  table: number;
  items: { name: string; quantity: number; special?: string }[];
  status: OrderStatus;
  receivedTime: Date;
  prepTime?: number;
  priority: 'normal' | 'rush';
}

const mockOrders: KitchenOrder[] = [
  { id: '1', orderNumber: 'ORD-2501', table: 5, items: [{ name: 'Grilled Salmon', quantity: 2 }, { name: 'Asparagus', quantity: 2, special: 'No butter' }], status: 'preparing', receivedTime: new Date(Date.now() - 12 * 60000), prepTime: 18, priority: 'normal' },
  { id: '2', orderNumber: 'ORD-2502', table: 8, items: [{ name: 'Ribeye Steak', quantity: 1, special: 'Medium rare' }, { name: 'Mashed Potatoes', quantity: 1 }], status: 'new', receivedTime: new Date(Date.now() - 2 * 60000), prepTime: 20, priority: 'normal' },
  { id: '3', orderNumber: 'ORD-2503', table: 12, items: [{ name: 'Pasta Carbonara', quantity: 3 }], status: 'ready', receivedTime: new Date(Date.now() - 22 * 60000), prepTime: 15, priority: 'normal' },
  { id: '4', orderNumber: 'ORD-2504', table: 3, items: [{ name: 'Burger', quantity: 2 }, { name: 'French Fries', quantity: 2 }], status: 'preparing', receivedTime: new Date(Date.now() - 8 * 60000), prepTime: 12, priority: 'rush' },
  { id: '5', orderNumber: 'ORD-2505', table: 7, items: [{ name: 'Fish & Chips', quantity: 1, special: 'Extra crispy' }], status: 'new', receivedTime: new Date(Date.now() - 1 * 60000), prepTime: 14, priority: 'rush' },
  { id: '6', orderNumber: 'ORD-2506', table: 11, items: [{ name: 'Vegetarian Risotto', quantity: 2 }, { name: 'Side Salad', quantity: 2 }], status: 'ready', receivedTime: new Date(Date.now() - 18 * 60000), prepTime: 16, priority: 'normal' },
];

const statusConfig = {
  new: { label: 'New Order', color: 'bg-red-100 text-red-800 border-red-300', progress: 0 },
  preparing: { label: 'Preparing', color: 'bg-yellow-100 text-yellow-800 border-yellow-300', progress: 50 },
  ready: { label: 'Ready', color: 'bg-green-100 text-green-800 border-green-300', progress: 100 },
  completed: { label: 'Completed', color: 'bg-gray-100 text-gray-800 border-gray-300', progress: 100 },
};

export function KitchenDisplay() {
  const [orders, setOrders] = useState<KitchenOrder[]>(mockOrders);
  const [filterStatus, setFilterStatus] = useState<OrderStatus | 'all'>('all');

  const filtered = filterStatus === 'all' ? orders : orders.filter(o => o.status === filterStatus);

  const handleStatusChange = (id: string, newStatus: OrderStatus) => {
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status: newStatus } : o));
  };

  const elapsedMinutes = (order: KitchenOrder) => Math.floor((Date.now() - order.receivedTime.getTime()) / 60000);

  const isOverdue = (order: KitchenOrder) => elapsedMinutes(order) > (order.prepTime || 20);

  const newOrders = orders.filter(o => o.status === 'new').length;
  const preparingOrders = orders.filter(o => o.status === 'preparing').length;
  const readyOrders = orders.filter(o => o.status === 'ready').length;

  return (
    <div className="h-screen flex flex-col bg-gray-900">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <ChefHat className="h-8 w-8 text-orange-500" />
            <h1 className="text-2xl font-bold text-white">Kitchen Display System</h1>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-300">
              <span className="font-semibold text-red-400">{newOrders}</span> New
              <span className="mx-2 text-gray-600">•</span>
              <span className="font-semibold text-yellow-400">{preparingOrders}</span> Preparing
              <span className="mx-2 text-gray-600">•</span>
              <span className="font-semibold text-green-400">{readyOrders}</span> Ready
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="bg-gray-700 px-4 py-3 flex space-x-2 border-b border-gray-600">
        {[
          { val: 'all' as const, label: 'All Orders', count: orders.length },
          { val: 'new' as const, label: 'New', count: newOrders },
          { val: 'preparing' as const, label: 'Preparing', count: preparingOrders },
          { val: 'ready' as const, label: 'Ready', count: readyOrders },
        ].map(tab => (
          <button
            key={tab.val}
            onClick={() => setFilterStatus(tab.val)}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              filterStatus === tab.val
                ? 'bg-orange-600 text-white'
                : 'bg-gray-600 text-gray-100 hover:bg-gray-500'
            }`}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {/* Orders Grid */}
      <div className="flex-1 overflow-auto p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4 auto-rows-max">
          {filtered.length === 0 ? (
            <div className="col-span-full flex items-center justify-center py-12 text-gray-400">
              <p className="text-lg">No orders in this status</p>
            </div>
          ) : (
            filtered.map(order => {
              const cfg = statusConfig[order.status];
              const elapsed = elapsedMinutes(order);
              const overdue = isOverdue(order);
              const expectedTime = order.prepTime || 20;

              return (
                <div
                  key={order.id}
                  className={`rounded-lg border-2 p-4 transition-all ${cfg.color} ${overdue && order.status !== 'ready' && order.status !== 'completed' ? 'animate-pulse' : ''}`}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="text-xs font-semibold opacity-75">TABLE</div>
                      <div className="text-3xl font-bold">{order.table}</div>
                    </div>
                    <div className="text-right">
                      <div className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-bold ${order.priority === 'rush' ? 'bg-red-500 text-white' : 'bg-gray-600 text-gray-100'}`}>
                        {order.priority === 'rush' && <Flame className="h-3 w-3" />}
                        <span>{order.priority === 'rush' ? 'RUSH' : 'NORMAL'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Order Number */}
                  <div className="text-xs opacity-75 mb-3">{order.orderNumber}</div>

                  {/* Items */}
                  <div className="bg-black bg-opacity-20 rounded-lg p-3 mb-3 space-y-2 max-h-32 overflow-y-auto">
                    {order.items.map((item, i) => (
                      <div key={i} className="text-sm">
                        <div className="flex justify-between">
                          <span className="font-semibold">{item.name}</span>
                          <span className="font-bold ml-2">×{item.quantity}</span>
                        </div>
                        {item.special && <div className="text-xs opacity-75 italic mt-0.5">{item.special}</div>}
                      </div>
                    ))}
                  </div>

                  {/* Timer */}
                  <div className="mb-3">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center space-x-1 text-xs font-semibold">
                        <Clock className="h-3 w-3" />
                        <span>{elapsed}m</span>
                      </div>
                      <div className="text-xs opacity-75">{expectedTime}m target</div>
                    </div>
                    <div className="w-full bg-black bg-opacity-30 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          overdue && order.status !== 'ready' && order.status !== 'completed'
                            ? 'bg-red-500'
                            : 'bg-green-500'
                        }`}
                        style={{ width: `${Math.min((elapsed / expectedTime) * 100, 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Status Indicator */}
                  {overdue && order.status !== 'ready' && order.status !== 'completed' && (
                    <div className="flex items-center space-x-2 text-xs font-semibold text-red-600 mb-3 bg-red-200 px-2 py-1 rounded">
                      <AlertCircle className="h-3 w-3" />
                      <span>OVERDUE</span>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex space-x-2">
                    {order.status === 'new' && (
                      <button
                        onClick={() => handleStatusChange(order.id, 'preparing')}
                        className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-2 px-3 rounded-lg text-sm transition-colors"
                      >
                        Start
                      </button>
                    )}
                    {order.status === 'preparing' && (
                      <button
                        onClick={() => handleStatusChange(order.id, 'ready')}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-3 rounded-lg text-sm transition-colors flex items-center justify-center space-x-1"
                      >
                        <CheckCircle className="h-4 w-4" />
                        <span>Ready</span>
                      </button>
                    )}
                    {order.status === 'ready' && (
                      <button
                        onClick={() => handleStatusChange(order.id, 'completed')}
                        className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-3 rounded-lg text-sm transition-colors"
                      >
                        Served
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
