import React from 'react';
import { Edit, Trash2, Package, AlertTriangle, Calendar, MapPin } from 'lucide-react';
import { InventoryItem } from '../../types/inventory';
import { formatCurrency } from '../../constants/currency';
import { formatDate } from '../../utils/dateUtils';

interface InventoryCardProps {
  item: InventoryItem;
  onEdit: (item: InventoryItem) => void;
  onDelete: (id: string) => void;
  onStockMovement: (item: InventoryItem) => void;
}

export function InventoryCard({ item, onEdit, onDelete, onStockMovement }: InventoryCardProps) {
  const getStatusColor = (status: InventoryItem['status']) => {
    const colors = {
      'in-stock': 'bg-green-100 text-green-800 border-green-200',
      'low-stock': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'out-of-stock': 'bg-red-100 text-red-800 border-red-200',
      'expired': 'bg-red-100 text-red-800 border-red-200',
      'discontinued': 'bg-gray-100 text-gray-800 border-gray-200',
    };
    return colors[status] || colors['in-stock'];
  };

  const getStockLevelPercentage = () => {
    if (item.maximumStock === 0) return 0;
    return Math.min((item.currentStock / item.maximumStock) * 100, 100);
  };

  const getStockLevelColor = () => {
    const percentage = getStockLevelPercentage();
    if (percentage <= 20) return 'bg-red-500';
    if (percentage <= 40) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const isExpiringSoon = () => {
    if (!item.expirationDate) return false;
    const now = new Date();
    const daysUntilExpiry = Math.ceil((item.expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 7 && daysUntilExpiry > 0;
  };

  const isExpired = () => {
    if (!item.expirationDate) return false;
    return item.expirationDate <= new Date();
  };

  return (
    <div className={`bg-white rounded-xl border-2 transition-all duration-200 hover:shadow-lg ${
      item.status === 'out-of-stock' ? 'border-red-200 bg-red-50' : 
      item.status === 'low-stock' ? 'border-yellow-200 bg-yellow-50' : 
      'border-gray-200'
    }`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 truncate">{item.name}</h3>
            <p className="text-sm text-gray-600 mt-1">{item.sku}</p>
          </div>
          <div className="flex items-center space-x-2 ml-3">
            {(isExpiringSoon() || isExpired()) && (
              <AlertTriangle className={`h-5 w-5 ${isExpired() ? 'text-red-500' : 'text-yellow-500'}`} />
            )}
            <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(item.status)}`}>
              {item.status.replace('-', ' ')}
            </span>
          </div>
        </div>

        {item.description && (
          <p className="text-sm text-gray-600 line-clamp-2">{item.description}</p>
        )}
      </div>

      {/* Stock Information */}
      <div className="p-4">
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Stock Level</span>
            <span className="text-sm text-gray-600">
              {item.currentStock} / {item.maximumStock} {item.unit}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${getStockLevelColor()}`}
              style={{ width: `${getStockLevelPercentage()}%` }}
            />
          </div>
          {item.currentStock <= item.minimumStock && (
            <p className="text-xs text-red-600 mt-1">
              Below minimum stock level ({item.minimumStock} {item.unit})
            </p>
          )}
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-xs text-gray-500">Category</p>
            <p className="text-sm font-medium text-gray-900">{item.category?.name || 'Uncategorized'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Unit Cost</p>
            <p className="text-sm font-medium text-gray-900">{formatCurrency(item.unitCost)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Total Value</p>
            <p className="text-sm font-medium text-gray-900">{formatCurrency(item.totalValue)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Supplier</p>
            <p className="text-sm font-medium text-gray-900 truncate">{item.supplier?.name || 'N/A'}</p>
          </div>
        </div>

        {/* Location and Expiry */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center text-sm text-gray-600">
            <MapPin className="h-4 w-4 mr-2" />
            <span>{item.location}</span>
          </div>
          
          {item.expirationDate && (
            <div className="flex items-center text-sm">
              <Calendar className="h-4 w-4 mr-2" />
              <span className={
                isExpired() ? 'text-red-600 font-medium' :
                isExpiringSoon() ? 'text-yellow-600 font-medium' :
                'text-gray-600'
              }>
                {isExpired() ? 'Expired: ' : 'Expires: '}
                {formatDate(item.expirationDate)}
              </span>
            </div>
          )}

          {item.isPerishable && (
            <div className="flex items-center text-sm text-orange-600">
              <Package className="h-4 w-4 mr-2" />
              <span>Perishable ({item.shelfLife} days shelf life)</span>
            </div>
          )}
        </div>

        {/* Usage Information */}
        {item.usageRate > 0 && (
          <div className="mb-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-xs text-blue-600 font-medium">Usage Analytics</p>
            <p className="text-sm text-blue-800">
              {item.usageRate} {item.unit}/day average usage
            </p>
            {item.currentStock > 0 && item.usageRate > 0 && (
              <p className="text-xs text-blue-600 mt-1">
                ~{Math.ceil(item.currentStock / item.usageRate)} days remaining at current rate
              </p>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-200">
          <button
            onClick={() => onStockMovement(item)}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center"
          >
            <Package className="h-4 w-4 mr-1" />
            Stock Movement
          </button>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => onEdit(item)}
              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
            >
              <Edit className="h-4 w-4" />
            </button>
            <button
              onClick={() => onDelete(item.id)}
              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}