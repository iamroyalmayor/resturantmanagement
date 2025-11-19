import React, { useState } from 'react';
import { Plus, Search, Grid, List, Settings, Eye, EyeOff } from 'lucide-react';
import { MenuItemCard } from '../components/Menu/MenuItemCard';
import { MenuItemModal } from '../components/Menu/MenuItemModal';
import { CategoryModal } from '../components/Menu/CategoryModal';
import { MenuFilters } from '../components/Menu/MenuFilters';
import { useMenu, useMenuCategories, useMenuStats } from '../hooks/useMenu';
import { MenuItem, MenuCategory, MenuFilters as MenuFiltersType } from '../types/menu';
import { formatCurrency } from '../constants/currency';

type ViewMode = 'grid' | 'list';

export function Menu() {
  const [filters, setFilters] = useState<MenuFiltersType>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<MenuCategory | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [showItemModal, setShowItemModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  // Apply search term to filters
  const activeFilters = {
    ...filters,
    searchTerm: searchTerm || undefined,
  };

  const { menuItems, loading, error, createMenuItem, updateMenuItem, deleteMenuItem, updateItemAvailability } = useMenu(activeFilters);
  const { categories, createCategory, updateCategory, deleteCategory } = useMenuCategories();
  const { stats } = useMenuStats();

  const handleCreateItem = async (itemData: Partial<MenuItem>) => {
    try {
      await createMenuItem(itemData);
      setShowItemModal(false);
      setSelectedItem(null);
    } catch (err) {
      console.error('Failed to create menu item:', err);
    }
  };

  const handleUpdateItem = async (itemData: Partial<MenuItem>) => {
    if (!selectedItem) return;
    
    try {
      await updateMenuItem(selectedItem.id, itemData);
      setShowItemModal(false);
      setSelectedItem(null);
    } catch (err) {
      console.error('Failed to update menu item:', err);
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this menu item?')) {
      try {
        await deleteMenuItem(id);
      } catch (err) {
        console.error('Failed to delete menu item:', err);
      }
    }
  };

  const handleToggleAvailability = async (id: string, isAvailable: boolean) => {
    try {
      await updateItemAvailability([id], isAvailable);
    } catch (err) {
      console.error('Failed to update item availability:', err);
    }
  };

  const handleBulkAvailabilityUpdate = async (isAvailable: boolean) => {
    if (selectedItems.length === 0) return;
    
    try {
      await updateItemAvailability(selectedItems, isAvailable);
      setSelectedItems([]);
    } catch (err) {
      console.error('Failed to update items availability:', err);
    }
  };

  const handleCreateCategory = async (categoryData: Partial<MenuCategory>) => {
    try {
      await createCategory(categoryData);
      setShowCategoryModal(false);
      setSelectedCategory(null);
    } catch (err) {
      console.error('Failed to create category:', err);
    }
  };

  const handleUpdateCategory = async (categoryData: Partial<MenuCategory>) => {
    if (!selectedCategory) return;
    
    try {
      await updateCategory(selectedCategory.id, categoryData);
      setShowCategoryModal(false);
      setSelectedCategory(null);
    } catch (err) {
      console.error('Failed to update category:', err);
    }
  };

  const clearFilters = () => {
    setFilters({});
    setSearchTerm('');
  };

  const toggleItemSelection = (itemId: string) => {
    setSelectedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-600 mb-2">Error loading menu</p>
          <p className="text-gray-500">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Menu Management</h1>
          <p className="text-gray-600">Manage your restaurant's menu items, categories, and pricing</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => {
              setSelectedCategory(null);
              setShowCategoryModal(true);
            }}
            className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <Settings className="mr-2 h-4 w-4" />
            Manage Categories
          </button>
          <button 
            onClick={() => {
              setSelectedItem(null);
              setShowItemModal(true);
            }}
            className="inline-flex items-center justify-center rounded-lg bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Menu Item
          </button>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Items</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalItems}</p>
              </div>
              <div className="rounded-lg p-3 bg-blue-50">
                <List className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Available</p>
                <p className="text-2xl font-bold text-gray-900">{stats.availableItems}</p>
              </div>
              <div className="rounded-lg p-3 bg-green-50">
                <Eye className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Price</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.averagePrice)}</p>
              </div>
              <div className="rounded-lg p-3 bg-orange-50">
                <Plus className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Categories</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalCategories}</p>
              </div>
              <div className="rounded-lg p-3 bg-purple-50">
                <Settings className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:space-y-0 lg:space-x-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search menu items by name, description, or ingredients..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
          />
        </div>
        
        <div className="flex items-center space-x-2">
          <MenuFilters
            filters={filters}
            onFiltersChange={setFilters}
            onClearFilters={clearFilters}
            categories={categories}
          />
          
          <div className="flex rounded-lg border border-gray-300 overflow-hidden">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-2 text-sm font-medium flex items-center space-x-1 ${
                viewMode === 'grid'
                  ? 'bg-orange-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Grid className="h-4 w-4" />
              <span className="hidden sm:inline">Grid</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-2 text-sm font-medium flex items-center space-x-1 ${
                viewMode === 'list'
                  ? 'bg-orange-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              <List className="h-4 w-4" />
              <span className="hidden sm:inline">List</span>
            </button>
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedItems.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-blue-800">
              {selectedItems.length} item{selectedItems.length !== 1 ? 's' : ''} selected
            </p>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleBulkAvailabilityUpdate(true)}
                className="px-3 py-1 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                <Eye className="h-4 w-4 mr-1 inline" />
                Make Available
              </button>
              <button
                onClick={() => handleBulkAvailabilityUpdate(false)}
                className="px-3 py-1 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                <EyeOff className="h-4 w-4 mr-1 inline" />
                Make Unavailable
              </button>
              <button
                onClick={() => setSelectedItems([])}
                className="px-3 py-1 text-sm bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                Clear Selection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Menu Items Display */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 animate-pulse">
              <div className="h-48 bg-gray-200 rounded mb-4"></div>
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-6 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      ) : menuItems.length === 0 ? (
        <div className="text-center py-12">
          <div className="mx-auto h-24 w-24 rounded-full bg-gray-100 flex items-center justify-center mb-4">
            <Plus className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No menu items found</h3>
          <p className="text-gray-600 mb-6">
            {Object.keys(activeFilters).length > 0
              ? 'Try adjusting your filters or search terms.'
              : 'Get started by adding your first menu item.'}
          </p>
          {Object.keys(activeFilters).length > 0 ? (
            <button
              onClick={clearFilters}
              className="text-orange-600 hover:text-orange-700 font-medium"
            >
              Clear all filters
            </button>
          ) : (
            <button
              onClick={() => setShowItemModal(true)}
              className="inline-flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add First Menu Item
            </button>
          )}
        </div>
      ) : (
        <div className={
          viewMode === 'grid'
            ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6'
            : 'space-y-4'
        }>
          {menuItems.map((item) => (
            <div key={item.id} className="relative">
              {viewMode === 'grid' && (
                <div className="absolute top-3 left-3 z-10">
                  <input
                    type="checkbox"
                    checked={selectedItems.includes(item.id)}
                    onChange={() => toggleItemSelection(item.id)}
                    className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                  />
                </div>
              )}
              <MenuItemCard
                item={item}
                onEdit={(item) => {
                  setSelectedItem(item);
                  setShowItemModal(true);
                }}
                onDelete={handleDeleteItem}
                onToggleAvailability={handleToggleAvailability}
                onViewDetails={(item) => {
                  setSelectedItem(item);
                  setShowItemModal(true);
                }}
              />
            </div>
          ))}
        </div>
      )}

      {/* Menu Item Modal */}
      <MenuItemModal
        item={selectedItem || undefined}
        categories={categories}
        isOpen={showItemModal}
        onClose={() => {
          setShowItemModal(false);
          setSelectedItem(null);
        }}
        onSave={selectedItem ? handleUpdateItem : handleCreateItem}
      />

      {/* Category Modal */}
      <CategoryModal
        category={selectedCategory || undefined}
        isOpen={showCategoryModal}
        onClose={() => {
          setShowCategoryModal(false);
          setSelectedCategory(null);
        }}
        onSave={selectedCategory ? handleUpdateCategory : handleCreateCategory}
      />
    </div>
  );
}