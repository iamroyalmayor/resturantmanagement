import React, { useState } from 'react';
import { Plus, Search, Grid, List, Package, AlertTriangle, TrendingUp } from 'lucide-react';
import { InventoryCard } from '../components/Inventory/InventoryCard';
import { InventoryModal } from '../components/Inventory/InventoryModal';
import { StockMovementModal } from '../components/Inventory/StockMovementModal';
import { InventoryFilters } from '../components/Inventory/InventoryFilters';
import { useInventory, useInventoryCategories, useSuppliers, useInventoryStats, useInventoryAlerts } from '../hooks/useInventory';
import { InventoryItem, InventoryFilters as InventoryFiltersType } from '../types/inventory';
import { formatCurrency } from '../constants/currency';

type ViewMode = 'grid' | 'list';

export function Inventory() {
  const [filters, setFilters] = useState<InventoryFiltersType>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [stockMovementItem, setStockMovementItem] = useState<InventoryItem | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [showItemModal, setShowItemModal] = useState(false);
  const [showStockModal, setShowStockModal] = useState(false);

  // Apply search term to filters
  const activeFilters = {
    ...filters,
    searchTerm: searchTerm || undefined,
  };

  const { items, loading, error, createItem, updateItem, deleteItem, recordStockMovement } = useInventory(activeFilters);
  const { categories } = useInventoryCategories();
  const { suppliers } = useSuppliers();
  const { stats } = useInventoryStats();
  const { alerts } = useInventoryAlerts();

  const handleCreateItem = async (itemData: Partial<InventoryItem>) => {
    try {
      await createItem(itemData);
      setShowItemModal(false);
      setSelectedItem(null);
    } catch (err) {
      console.error('Failed to create inventory item:', err);
    }
  };

  const handleUpdateItem = async (itemData: Partial<InventoryItem>) => {
    if (!selectedItem) return;
    
    try {
      await updateItem(selectedItem.id, itemData);
      setShowItemModal(false);
      setSelectedItem(null);
    } catch (err) {
      console.error('Failed to update inventory item:', err);
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this inventory item?')) {
      try {
        await deleteItem(id);
      } catch (err) {
        console.error('Failed to delete inventory item:', err);
      }
    }
  };

  const handleStockMovement = async (movementData: any) => {
    try {
      await recordStockMovement(movementData);
      setShowStockModal(false);
      setStockMovementItem(null);
    } catch (err) {
      console.error('Failed to record stock movement:', err);
    }
  };

  const clearFilters = () => {
    setFilters({});
    setSearchTerm('');
  };

  const unreadAlerts = alerts.filter(alert => !alert.isRead);

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-600 mb-2">Error loading inventory</p>
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
          <h1 className="text-2xl font-bold text-gray-900">Inventory Management</h1>
          <p className="text-gray-600">Track stock levels, manage suppliers, and monitor inventory health</p>
        </div>
        <div className="flex items-center space-x-3">
          {unreadAlerts.length > 0 && (
            <div className="flex items-center space-x-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <span className="text-sm font-medium text-red-700">
                {unreadAlerts.length} alert{unreadAlerts.length !== 1 ? 's' : ''}
              </span>
            </div>
          )}
          <button 
            onClick={() => {
              setSelectedItem(null);
              setShowItemModal(true);
            }}
            className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Item
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
                <Package className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Value</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalValue)}</p>
              </div>
              <div className="rounded-lg p-3 bg-green-50">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Low Stock</p>
                <p className="text-2xl font-bold text-gray-900">{stats.lowStockItems}</p>
              </div>
              <div className="rounded-lg p-3 bg-yellow-50">
                <AlertTriangle className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Out of Stock</p>
                <p className="text-2xl font-bold text-gray-900">{stats.outOfStockItems}</p>
              </div>
              <div className="rounded-lg p-3 bg-red-50">
                <AlertTriangle className="h-6 w-6 text-red-600" />
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
            placeholder="Search inventory by name, SKU, or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        
        <div className="flex items-center space-x-2">
          <InventoryFilters
            filters={filters}
            onFiltersChange={setFilters}
            onClearFilters={clearFilters}
            categories={categories}
            suppliers={suppliers}
          />
          
          <div className="flex rounded-lg border border-gray-300 overflow-hidden">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-2 text-sm font-medium flex items-center space-x-1 ${
                viewMode === 'grid'
                  ? 'bg-blue-600 text-white'
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
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              <List className="h-4 w-4" />
              <span className="hidden sm:inline">List</span>
            </button>
          </div>
        </div>
      </div>

      {/* Inventory Items Display */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 animate-pulse">
              <div className="h-4 bg-gray-200 rounded mb-4"></div>
              <div className="h-6 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 rounded mb-4"></div>
              <div className="h-8 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-12">
          <div className="mx-auto h-24 w-24 rounded-full bg-gray-100 flex items-center justify-center mb-4">
            <Package className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No inventory items found</h3>
          <p className="text-gray-600 mb-6">
            {Object.keys(activeFilters).length > 0
              ? 'Try adjusting your filters or search terms.'
              : 'Get started by adding your first inventory item.'}
          </p>
          {Object.keys(activeFilters).length > 0 ? (
            <button
              onClick={clearFilters}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Clear all filters
            </button>
          ) : (
            <button
              onClick={() => setShowItemModal(true)}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add First Item
            </button>
          )}
        </div>
      ) : (
        <div className={
          viewMode === 'grid'
            ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6'
            : 'space-y-4'
        }>
          {items.map((item) => (
            <InventoryCard
              key={item.id}
              item={item}
              onEdit={(item) => {
                setSelectedItem(item);
                setShowItemModal(true);
              }}
              onDelete={handleDeleteItem}
              onStockMovement={(item) => {
                setStockMovementItem(item);
                setShowStockModal(true);
              }}
            />
          ))}
        </div>
      )}

      {/* Inventory Item Modal */}
      <InventoryModal
        item={selectedItem || undefined}
        categories={categories}
        suppliers={suppliers}
        isOpen={showItemModal}
        onClose={() => {
          setShowItemModal(false);
          setSelectedItem(null);
        }}
        onSave={selectedItem ? handleUpdateItem : handleCreateItem}
      />

      {/* Stock Movement Modal */}
      {stockMovementItem && (
        <StockMovementModal
          item={stockMovementItem}
          isOpen={showStockModal}
          onClose={() => {
            setShowStockModal(false);
            setStockMovementItem(null);
          }}
          onSave={handleStockMovement}
        />
      )}
    </div>
  );
}