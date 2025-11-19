import React from 'react';
import { Filter, X } from 'lucide-react';
import { OrderFilters as OrderFiltersType, OrderStatus, OrderType } from '../../types/order';

interface OrderFiltersProps {
  filters: OrderFiltersType;
  onFiltersChange: (filters: OrderFiltersType) => void;
  onClearFilters: () => void;
}

export function OrderFilters({ filters, onFiltersChange, onClearFilters }: OrderFiltersProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  const statusOptions: { value: OrderStatus; label: string; color: string }[] = [
    { value: 'pending', label: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'confirmed', label: 'Confirmed', color: 'bg-blue-100 text-blue-800' },
    { value: 'preparing', label: 'Preparing', color: 'bg-orange-100 text-orange-800' },
    { value: 'ready', label: 'Ready', color: 'bg-green-100 text-green-800' },
    { value: 'served', label: 'Served', color: 'bg-purple-100 text-purple-800' },
    { value: 'completed', label: 'Completed', color: 'bg-gray-100 text-gray-800' },
    { value: 'cancelled', label: 'Cancelled', color: 'bg-red-100 text-red-800' },
  ];

  const orderTypeOptions: { value: OrderType; label: string }[] = [
    { value: 'dine-in', label: 'Dine In' },
    { value: 'takeaway', label: 'Takeaway' },
    { value: 'delivery', label: 'Delivery' },
  ];

  const handleStatusChange = (status: OrderStatus, checked: boolean) => {
    const currentStatuses = filters.status || [];
    const newStatuses = checked
      ? [...currentStatuses, status]
      : currentStatuses.filter(s => s !== status);
    
    onFiltersChange({ ...filters, status: newStatuses });
  };

  const handleOrderTypeChange = (orderType: OrderType, checked: boolean) => {
    const currentTypes = filters.orderType || [];
    const newTypes = checked
      ? [...currentTypes, orderType]
      : currentTypes.filter(t => t !== orderType);
    
    onFiltersChange({ ...filters, orderType: newTypes });
  };

  const hasActiveFilters = () => {
    return (filters.status && filters.status.length > 0) ||
           (filters.orderType && filters.orderType.length > 0) ||
           filters.tableNumber ||
           filters.waiter;
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`inline-flex items-center px-4 py-2 border rounded-lg text-sm font-medium transition-colors duration-200 ${
          hasActiveFilters()
            ? 'border-orange-300 bg-orange-50 text-orange-700'
            : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
        }`}
      >
        <Filter className="h-4 w-4 mr-2" />
        Filters
        {hasActiveFilters() && (
          <span className="ml-2 bg-orange-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {(filters.status?.length || 0) + (filters.orderType?.length || 0) + (filters.tableNumber ? 1 : 0) + (filters.waiter ? 1 : 0)}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-20">
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
                {hasActiveFilters() && (
                  <button
                    onClick={() => {
                      onClearFilters();
                      setIsOpen(false);
                    }}
                    className="text-sm text-red-600 hover:text-red-700 flex items-center"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Clear All
                  </button>
                )}
              </div>

              {/* Order Status */}
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-900 mb-3">Order Status</h4>
                <div className="space-y-2">
                  {statusOptions.map((option) => (
                    <label key={option.value} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={filters.status?.includes(option.value) || false}
                        onChange={(e) => handleStatusChange(option.value, e.target.checked)}
                        className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                      />
                      <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${option.color}`}>
                        {option.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Order Type */}
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-900 mb-3">Order Type</h4>
                <div className="space-y-2">
                  {orderTypeOptions.map((option) => (
                    <label key={option.value} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={filters.orderType?.includes(option.value) || false}
                        onChange={(e) => handleOrderTypeChange(option.value, e.target.checked)}
                        className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Table Number */}
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-900 mb-3">Table Number</h4>
                <input
                  type="number"
                  placeholder="Enter table number"
                  value={filters.tableNumber || ''}
                  onChange={(e) => onFiltersChange({ 
                    ...filters, 
                    tableNumber: e.target.value ? parseInt(e.target.value) : undefined 
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
                />
              </div>

              {/* Assigned Waiter */}
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-900 mb-3">Assigned Waiter</h4>
                <input
                  type="text"
                  placeholder="Enter waiter name"
                  value={filters.waiter || ''}
                  onChange={(e) => onFiltersChange({ ...filters, waiter: e.target.value || undefined })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
                />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}