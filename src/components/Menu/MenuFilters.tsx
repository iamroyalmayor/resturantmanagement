import React from 'react';
import { Filter, X } from 'lucide-react';
import { MenuFilters as MenuFiltersType } from '../../types/menu';

interface MenuFiltersProps {
  filters: MenuFiltersType;
  onFiltersChange: (filters: MenuFiltersType) => void;
  onClearFilters: () => void;
  categories: Array<{ id: string; name: string }>;
}

const dietaryOptions = [
  'Vegetarian', 'Vegan', 'Gluten-Free', 'Dairy-Free', 'Nut-Free',
  'Keto-Friendly', 'Low-Carb', 'High-Protein'
];

export function MenuFilters({ filters, onFiltersChange, onClearFilters, categories }: MenuFiltersProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  const handleDietaryTagChange = (tag: string, checked: boolean) => {
    const currentTags = filters.dietaryTags || [];
    const newTags = checked
      ? [...currentTags, tag]
      : currentTags.filter(t => t !== tag);
    
    onFiltersChange({ ...filters, dietaryTags: newTags });
  };

  const hasActiveFilters = () => {
    return filters.categoryId ||
           filters.isAvailable !== undefined ||
           filters.isPopular !== undefined ||
           filters.isFeatured !== undefined ||
           (filters.dietaryTags && filters.dietaryTags.length > 0) ||
           filters.priceRange;
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
            {[
              filters.categoryId ? 1 : 0,
              filters.isAvailable !== undefined ? 1 : 0,
              filters.isPopular !== undefined ? 1 : 0,
              filters.isFeatured !== undefined ? 1 : 0,
              filters.dietaryTags?.length || 0,
              filters.priceRange ? 1 : 0
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
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                >
                  <option value="">All Categories</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status Filters */}
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-900 mb-3">Status</h4>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.isAvailable === true}
                      onChange={(e) => onFiltersChange({ 
                        ...filters, 
                        isAvailable: e.target.checked ? true : undefined 
                      })}
                      className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Available only</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.isPopular === true}
                      onChange={(e) => onFiltersChange({ 
                        ...filters, 
                        isPopular: e.target.checked ? true : undefined 
                      })}
                      className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Popular items</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.isFeatured === true}
                      onChange={(e) => onFiltersChange({ 
                        ...filters, 
                        isFeatured: e.target.checked ? true : undefined 
                      })}
                      className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Featured items</span>
                  </label>
                </div>
              </div>

              {/* Price Range */}
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-900 mb-3">Price Range</h4>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    placeholder="Min"
                    step="0.01"
                    value={filters.priceRange?.min || ''}
                    onChange={(e) => onFiltersChange({ 
                      ...filters, 
                      priceRange: {
                        min: parseFloat(e.target.value) || 0,
                        max: filters.priceRange?.max || 1000
                      }
                    })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    step="0.01"
                    value={filters.priceRange?.max || ''}
                    onChange={(e) => onFiltersChange({ 
                      ...filters, 
                      priceRange: {
                        min: filters.priceRange?.min || 0,
                        max: parseFloat(e.target.value) || 1000
                      }
                    })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                  />
                </div>
              </div>

              {/* Dietary Tags */}
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-900 mb-3">Dietary Options</h4>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {dietaryOptions.map((tag) => (
                    <label key={tag} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={filters.dietaryTags?.includes(tag) || false}
                        onChange={(e) => handleDietaryTagChange(tag, e.target.checked)}
                        className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">{tag}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}