import React, { useState } from 'react';
import { X, Package, TrendingUp, TrendingDown } from 'lucide-react';
import { InventoryItem, StockMovement } from '../../types/inventory';
import { formatCurrency } from '../../constants/currency';

interface StockMovementModalProps {
  item: InventoryItem;
  isOpen: boolean;
  onClose: () => void;
  onSave: (movement: Partial<StockMovement>) => Promise<void>;
}

const movementTypes = [
  { value: 'purchase', label: 'Purchase/Restock', icon: TrendingUp, color: 'text-green-600' },
  { value: 'usage', label: 'Usage/Consumption', icon: TrendingDown, color: 'text-blue-600' },
  { value: 'waste', label: 'Waste/Spoilage', icon: TrendingDown, color: 'text-red-600' },
  { value: 'adjustment', label: 'Stock Adjustment', icon: Package, color: 'text-purple-600' },
  { value: 'return', label: 'Return to Supplier', icon: TrendingDown, color: 'text-orange-600' },
  { value: 'transfer', label: 'Transfer', icon: Package, color: 'text-gray-600' },
];

export function StockMovementModal({ item, isOpen, onClose, onSave }: StockMovementModalProps) {
  const [formData, setFormData] = useState({
    type: 'usage' as StockMovement['type'],
    quantity: 0,
    unitCost: item.unitCost,
    reason: '',
    reference: '',
    notes: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.quantity || !formData.reason) return;

    setIsSubmitting(true);
    try {
      await onSave({
        ...formData,
        itemId: item.id,
        performedBy: 'Current User', // In real app, get from auth context
        totalCost: formData.quantity * formData.unitCost,
      });
      
      // Reset form
      setFormData({
        type: 'usage',
        quantity: 0,
        unitCost: item.unitCost,
        reason: '',
        reference: '',
        notes: '',
      });
      onClose();
    } catch (error) {
      console.error('Failed to record stock movement:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedMovementType = movementTypes.find(type => type.value === formData.type);
  const isIncrease = formData.type === 'purchase' || (formData.type === 'adjustment' && formData.quantity > 0);
  const newStockLevel = isIncrease ? 
    item.currentStock + Math.abs(formData.quantity) : 
    Math.max(0, item.currentStock - Math.abs(formData.quantity));

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={onClose} />
        
        <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Package className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Stock Movement</h2>
                <p className="text-sm text-gray-600">{item.name}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Current Stock Info */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Current Stock:</span>
                <span className="font-medium text-gray-900">
                  {item.currentStock} {item.unit}
                </span>
              </div>
              <div className="flex justify-between items-center mt-1">
                <span className="text-sm text-gray-600">Unit Cost:</span>
                <span className="font-medium text-gray-900">
                  {formatCurrency(item.unitCost)}
                </span>
              </div>
            </div>

            {/* Movement Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Movement Type *
              </label>
              <div className="grid grid-cols-1 gap-2">
                {movementTypes.map((type) => {
                  const Icon = type.icon;
                  return (
                    <label
                      key={type.value}
                      className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                        formData.type === type.value
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="type"
                        value={type.value}
                        checked={formData.type === type.value}
                        onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as any }))}
                        className="sr-only"
                      />
                      <Icon className={`h-5 w-5 mr-3 ${type.color}`} />
                      <span className="text-sm font-medium text-gray-900">{type.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Quantity */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Quantity ({item.unit}) *
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.quantity}
                onChange={(e) => setFormData(prev => ({ ...prev, quantity: parseFloat(e.target.value) || 0 }))}
                required
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Enter quantity"
              />
            </div>

            {/* Unit Cost (for purchases) */}
            {formData.type === 'purchase' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Unit Cost
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.unitCost}
                  onChange={(e) => setFormData(prev => ({ ...prev, unitCost: parseFloat(e.target.value) || 0 }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            )}

            {/* Reason */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reason *
              </label>
              <input
                type="text"
                value={formData.reason}
                onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                required
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Reason for stock movement"
              />
            </div>

            {/* Reference */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reference
              </label>
              <input
                type="text"
                value={formData.reference}
                onChange={(e) => setFormData(prev => ({ ...prev, reference: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="PO number, order ID, etc."
              />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                rows={3}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Additional notes"
              />
            </div>

            {/* Preview */}
            {formData.quantity > 0 && (
              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="text-sm font-medium text-blue-900 mb-2">Preview</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-blue-700">Current Stock:</span>
                    <span className="font-medium text-blue-900">{item.currentStock} {item.unit}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-700">
                      {isIncrease ? 'Adding:' : 'Removing:'}
                    </span>
                    <span className={`font-medium ${isIncrease ? 'text-green-600' : 'text-red-600'}`}>
                      {isIncrease ? '+' : '-'}{Math.abs(formData.quantity)} {item.unit}
                    </span>
                  </div>
                  <div className="flex justify-between border-t border-blue-200 pt-1">
                    <span className="text-blue-700">New Stock Level:</span>
                    <span className="font-medium text-blue-900">{newStockLevel} {item.unit}</span>
                  </div>
                  {formData.type === 'purchase' && (
                    <div className="flex justify-between">
                      <span className="text-blue-700">Total Cost:</span>
                      <span className="font-medium text-blue-900">
                        {formatCurrency(formData.quantity * formData.unitCost)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !formData.quantity || !formData.reason}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Recording...' : 'Record Movement'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}