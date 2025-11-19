import React from 'react';
import { Filter, X } from 'lucide-react';
import { InventoryFilters as InventoryFiltersType, InventoryCategory, Supplier } from '../../types/inventory';

interface InventoryFiltersProps {
  filters: InventoryFiltersType;
  onFiltersChange: (filters: InventoryFiltersType) => void;
  onClearFilters: () => void;
  categories: InventoryCategory[];
  suppliers: Supplier[];
}

const statusOptions = [
  { value: 'in-stock', label: 'In Stock', color: 'bg-green-100 text-green-800' },
  { value: 'low-stock', label: 'Low Stock', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'out-of-stock', label: 'Out of Stock', color: 'bg-red-100 text-red-800' },
  { value: 'expired', label: 'Expired', color: 'bg-red-100 text-red-800' },
  { value: 'discontinued', label: 'Discontinued', color: 'bg-gray-100 text-gray-800' },
];

const stockLevelOptions = [
  { value: 'all', label: 'All Items' },
  { value: 'normal', label: 'Normal Stock' },
  { value: 'low', label: 'Low Stock' },
  { value: 'out', label: 'Out of Stock' },
  { value: 'overstock', label: 'Overstock' },
];

export function InventoryFilters({ filters, onFiltersChange, onClearFilters, categories, suppliers }: InventoryFiltersProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  const handleStatusChange = (status: string, checked: boolean) => {
    const currentStatuses = filters.status || [];
    const newStatuses = checked
      ? [...currentStatuses, status as any]
      : currentStatuses.filter(s => s !== status);
    
    onFiltersChange({ ...filters, status: newStatuses });
  };

  const hasActiveFilters = () => {
    return filters.categoryId ||
           filters.supplierId ||
           (filters.status && filters.status.length > 0) ||
           filters.location ||
           filters.isPerishable !== undefined ||
           filters.stockLevel !== 'all' ||
           filters.expiringWithin;
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`inline-flex items-center px-4 py-2 border rounded-lg text-sm font-medium transition-colors duration-200 ${
          hasActiveFilters()
            ? 'border-blue-300 bg-blue-50 text-blue-700'
            : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
        }`}
      >
        <Filter className="h-4 w-4 mr-2" />
        Filters
        {hasActiveFilters() && (
          <span className="ml-2 bg-blue-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {[
              filters.categoryId ? 1 : 0,
              filters.supplierId ? 1 : 0,
              filters.status?.length || 0,
              filters.location ? 1 : 0,
              filters.isPerishable !== undefined ? 1 : 0,
              filters.stockLevel && filters.stockLevel !== 'all' ? 1 : 0,
              filters.expiringWithin ? 1 : 0
            ].reduce((a, b) => a + b, 0)}
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

              {/* Category Filter */}
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-900 mb-3">Category</h4>
                <select
                  value={filters.categoryId || ''}
                  onChange={(e) => onFiltersChange({ 
                    ...filters, 
                    categoryId: e.target.value || undefined 
                  })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">All Categories</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Supplier Filter */}
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-900 mb-3">Supplier</h4>
                <select
                  value={filters.supplierId || ''}
                  onChange={(e) => onFiltersChange({ 
                    ...filters, 
                    supplierId: e.target.value || undefined 
                  })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">All Suppliers</option>
                  {suppliers.map((supplier) => (
                    <option key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-900 mb-3">Status</h4>
                <div className="space-y-2">
                  {statusOptions.map((option) => (
                    <label key={option.value} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={filters.status?.includes(option.value as any) || false}
                        onChange={(e) => handleStatusChange(option.value, e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${option.color}`}>
                        {option.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Stock Level Filter */}
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-900 mb-3">Stock Level</h4>
                <select
                  value={filters.stockLevel || 'all'}
                  onChange={(e) => onFiltersChange({ 
                    ...filters, 
                    stockLevel: e.target.value as any
                  })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  {stockLevelOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Location Filter */}
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-900 mb-3">Location</h4>
                <input
                  type="text"
                  placeholder="Filter by location"
                  value={filters.location || ''}
                  onChange={(e) => onFiltersChange({ 
                    ...filters, 
                    location: e.target.value || undefined 
                  })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Perishable Filter */}
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-900 mb-3">Item Type</h4>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="perishable"
                      checked={filters.isPerishable === undefined}
                      onChange={() => onFiltersChange({ ...filters, isPerishable: undefined })}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">All Items</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="perishable"
                      checked={filters.isPerishable === true}
                      onChange={() => onFiltersChange({ ...filters, isPerishable: true })}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Perishable Only</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="perishable"
                      checked={filters.isPerishable === false}
                      onChange={() => onFiltersChange({ ...filters, isPerishable: false })}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Non-Perishable Only</span>
                  </label>
                </div>
              </div>

              {/* Expiring Within Filter */}
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-900 mb-3">Expiring Within</h4>
                <select
                  value={filters.expiringWithin || ''}
                  onChange={(e) => onFiltersChange({ 
                    ...filters, 
                    expiringWithin: e.target.value ? parseInt(e.target.value) : undefined 
                  })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">Any time</option>
                  <option value="1">1 day</option>
                  <option value="3">3 days</option>
                  <option value="7">1 week</option>
                  <option value="14">2 weeks</option>
                  <option value="30">1 month</option>
                </select>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}