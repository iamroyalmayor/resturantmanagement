import React, { useState, useEffect } from 'react';
import { X, Plus, Minus, Upload, Star } from 'lucide-react';
import { MenuItem, MenuCategory, MenuModifier, NutritionalInfo } from '../../types/menu';
import { formatCurrency } from '../../constants/currency';

interface MenuItemModalProps {
  item?: MenuItem;
  categories: MenuCategory[];
  isOpen: boolean;
  onClose: () => void;
  onSave: (itemData: Partial<MenuItem>) => Promise<void>;
}

const dietaryOptions = [
  'Vegetarian', 'Vegan', 'Gluten-Free', 'Dairy-Free', 'Nut-Free',
  'Keto-Friendly', 'Low-Carb', 'High-Protein', 'Organic', 'Halal', 'Kosher'
];

const allergenOptions = [
  'Dairy', 'Eggs', 'Fish', 'Shellfish', 'Tree Nuts', 'Peanuts',
  'Wheat', 'Gluten', 'Soy', 'Sesame'
];

const spiceLevels = [
  { value: 'mild', label: 'Mild' },
  { value: 'medium', label: 'Medium' },
  { value: 'hot', label: 'Hot' },
  { value: 'extra-hot', label: 'Extra Hot' },
];

export function MenuItemModal({ item, categories, isOpen, onClose, onSave }: MenuItemModalProps) {
  const [formData, setFormData] = useState<Partial<MenuItem>>({
    name: '',
    description: '',
    price: 0,
    categoryId: '',
    image: '',
    isAvailable: true,
    isPopular: false,
    isFeatured: false,
    preparationTime: 15,
    servingSize: '',
    ingredients: [],
    allergens: [],
    dietaryTags: [],
    spiceLevel: undefined,
    nutritionalInfo: undefined,
    modifiers: [],
    cost: 0,
    profitMargin: 0,
  });

  const [newIngredient, setNewIngredient] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'basic' | 'nutrition' | 'modifiers'>('basic');

  useEffect(() => {
    if (item) {
      setFormData({
        ...item,
        nutritionalInfo: item.nutritionalInfo || {
          calories: 0,
          protein: 0,
          carbohydrates: 0,
          fat: 0,
        },
      });
    } else {
      setFormData({
        name: '',
        description: '',
        price: 0,
        categoryId: categories[0]?.id || '',
        image: '',
        isAvailable: true,
        isPopular: false,
        isFeatured: false,
        preparationTime: 15,
        servingSize: '',
        ingredients: [],
        allergens: [],
        dietaryTags: [],
        spiceLevel: undefined,
        nutritionalInfo: {
          calories: 0,
          protein: 0,
          carbohydrates: 0,
          fat: 0,
        },
        modifiers: [],
        cost: 0,
        profitMargin: 0,
      });
    }
  }, [item, categories]);

  // Calculate profit margin when price or cost changes
  useEffect(() => {
    if (formData.price && formData.cost) {
      const margin = ((formData.price - formData.cost) / formData.price) * 100;
      setFormData(prev => ({ ...prev, profitMargin: margin }));
    }
  }, [formData.price, formData.cost]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.categoryId || !formData.price) return;

    setIsSubmitting(true);
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error('Failed to save menu item:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const addIngredient = () => {
    if (newIngredient.trim()) {
      setFormData(prev => ({
        ...prev,
        ingredients: [...(prev.ingredients || []), newIngredient.trim()]
      }));
      setNewIngredient('');
    }
  };

  const removeIngredient = (index: number) => {
    setFormData(prev => ({
      ...prev,
      ingredients: prev.ingredients?.filter((_, i) => i !== index) || []
    }));
  };

  const toggleDietaryTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      dietaryTags: prev.dietaryTags?.includes(tag)
        ? prev.dietaryTags.filter(t => t !== tag)
        : [...(prev.dietaryTags || []), tag]
    }));
  };

  const toggleAllergen = (allergen: string) => {
    setFormData(prev => ({
      ...prev,
      allergens: prev.allergens?.includes(allergen)
        ? prev.allergens.filter(a => a !== allergen)
        : [...(prev.allergens || []), allergen]
    }));
  };

  const updateNutritionalInfo = (field: keyof NutritionalInfo, value: number) => {
    setFormData(prev => ({
      ...prev,
      nutritionalInfo: {
        ...prev.nutritionalInfo!,
        [field]: value
      }
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={onClose} />
        
        <div className="relative bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">
              {item ? 'Edit Menu Item' : 'Add New Menu Item'}
            </h2>
            <button
              onClick={onClose}
              className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {[
                { id: 'basic', label: 'Basic Info' },
                { id: 'nutrition', label: 'Nutrition & Tags' },
                { id: 'modifiers', label: 'Modifiers' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-orange-500 text-orange-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
            <div className="p-6">
              {/* Basic Info Tab */}
              {activeTab === 'basic' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Left Column */}
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Item Name *
                        </label>
                        <input
                          type="text"
                          value={formData.name}
                          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                          required
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                          placeholder="Enter item name"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Description *
                        </label>
                        <textarea
                          value={formData.description}
                          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                          required
                          rows={3}
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                          placeholder="Describe the menu item"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Category *
                        </label>
                        <select
                          value={formData.categoryId}
                          onChange={(e) => setFormData(prev => ({ ...prev, categoryId: e.target.value }))}
                          required
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                        >
                          <option value="">Select a category</option>
                          {categories.map((category) => (
                            <option key={category.id} value={category.id}>
                              {category.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Price *
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={formData.price}
                            onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                            required
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                            placeholder="0.00"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Cost
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={formData.cost}
                            onChange={(e) => setFormData(prev => ({ ...prev, cost: parseFloat(e.target.value) || 0 }))}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                            placeholder="0.00"
                          />
                        </div>
                      </div>

                      {formData.price && formData.cost && formData.cost > 0 && (
                        <div className="p-3 bg-green-50 rounded-lg">
                          <p className="text-sm text-green-800">
                            <strong>Profit Margin:</strong> {formData.profitMargin?.toFixed(1)}%
                          </p>
                          <p className="text-sm text-green-600">
                            Profit per item: {formatCurrency((formData.price || 0) - (formData.cost || 0))}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Right Column */}
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Image URL
                        </label>
                        <input
                          type="url"
                          value={formData.image}
                          onChange={(e) => setFormData(prev => ({ ...prev, image: e.target.value }))}
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                          placeholder="https://example.com/image.jpg"
                        />
                        {formData.image && (
                          <img
                            src={formData.image}
                            alt="Preview"
                            className="mt-2 w-full h-32 object-cover rounded-lg"
                          />
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Prep Time (min)
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={formData.preparationTime}
                            onChange={(e) => setFormData(prev => ({ ...prev, preparationTime: parseInt(e.target.value) || 15 }))}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Serving Size
                          </label>
                          <input
                            type="text"
                            value={formData.servingSize}
                            onChange={(e) => setFormData(prev => ({ ...prev, servingSize: e.target.value }))}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                            placeholder="e.g., 1 bowl, 8oz"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Spice Level
                        </label>
                        <select
                          value={formData.spiceLevel || ''}
                          onChange={(e) => setFormData(prev => ({ ...prev, spiceLevel: e.target.value as any || undefined }))}
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                        >
                          <option value="">No spice level</option>
                          {spiceLevels.map((level) => (
                            <option key={level.value} value={level.value}>
                              {level.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="isAvailable"
                            checked={formData.isAvailable}
                            onChange={(e) => setFormData(prev => ({ ...prev, isAvailable: e.target.checked }))}
                            className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                          />
                          <label htmlFor="isAvailable" className="ml-2 text-sm text-gray-700">
                            Available for ordering
                          </label>
                        </div>

                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="isPopular"
                            checked={formData.isPopular}
                            onChange={(e) => setFormData(prev => ({ ...prev, isPopular: e.target.checked }))}
                            className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                          />
                          <label htmlFor="isPopular" className="ml-2 text-sm text-gray-700 flex items-center">
                            <Star className="h-4 w-4 mr-1" />
                            Mark as popular
                          </label>
                        </div>

                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="isFeatured"
                            checked={formData.isFeatured}
                            onChange={(e) => setFormData(prev => ({ ...prev, isFeatured: e.target.checked }))}
                            className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                          />
                          <label htmlFor="isFeatured" className="ml-2 text-sm text-gray-700">
                            Feature on menu
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Ingredients */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ingredients
                    </label>
                    <div className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={newIngredient}
                        onChange={(e) => setNewIngredient(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addIngredient())}
                        className="flex-1 rounded-lg border border-gray-300 px-3 py-2 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                        placeholder="Add ingredient"
                      />
                      <button
                        type="button"
                        onClick={addIngredient}
                        className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {formData.ingredients?.map((ingredient, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-800"
                        >
                          {ingredient}
                          <button
                            type="button"
                            onClick={() => removeIngredient(index)}
                            className="ml-2 text-gray-500 hover:text-red-500"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Nutrition & Tags Tab */}
              {activeTab === 'nutrition' && (
                <div className="space-y-6">
                  {/* Nutritional Information */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Nutritional Information</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Calories
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={formData.nutritionalInfo?.calories || 0}
                          onChange={(e) => updateNutritionalInfo('calories', parseInt(e.target.value) || 0)}
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Protein (g)
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.1"
                          value={formData.nutritionalInfo?.protein || 0}
                          onChange={(e) => updateNutritionalInfo('protein', parseFloat(e.target.value) || 0)}
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Carbs (g)
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.1"
                          value={formData.nutritionalInfo?.carbohydrates || 0}
                          onChange={(e) => updateNutritionalInfo('carbohydrates', parseFloat(e.target.value) || 0)}
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Fat (g)
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.1"
                          value={formData.nutritionalInfo?.fat || 0}
                          onChange={(e) => updateNutritionalInfo('fat', parseFloat(e.target.value) || 0)}
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Dietary Tags */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Dietary Tags</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {dietaryOptions.map((tag) => (
                        <label key={tag} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={formData.dietaryTags?.includes(tag) || false}
                            onChange={() => toggleDietaryTag(tag)}
                            className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                          />
                          <span className="ml-2 text-sm text-gray-700">{tag}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Allergens */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Allergens</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {allergenOptions.map((allergen) => (
                        <label key={allergen} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={formData.allergens?.includes(allergen) || false}
                            onChange={() => toggleAllergen(allergen)}
                            className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                          />
                          <span className="ml-2 text-sm text-gray-700">{allergen}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Modifiers Tab */}
              {activeTab === 'modifiers' && (
                <div className="space-y-6">
                  <div className="text-center py-8">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Modifiers & Options</h3>
                    <p className="text-gray-600 mb-4">
                      Add customization options like size, add-ons, and special preparations
                    </p>
                    <p className="text-sm text-gray-500">
                      Modifier management coming in next iteration...
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !formData.name || !formData.categoryId || !formData.price}
                className="px-4 py-2 text-sm font-medium text-white bg-orange-600 rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Saving...' : item ? 'Update Item' : 'Create Item'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}