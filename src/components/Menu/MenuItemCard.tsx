import React from 'react';
import { Edit, Trash2, Eye, EyeOff, Star, Clock, DollarSign } from 'lucide-react';
import { MenuItem } from '../../types/menu';
import { formatCurrency } from '../../constants/currency';

interface MenuItemCardProps {
  item: MenuItem;
  onEdit: (item: MenuItem) => void;
  onDelete: (id: string) => void;
  onToggleAvailability: (id: string, isAvailable: boolean) => void;
  onViewDetails: (item: MenuItem) => void;
}

export function MenuItemCard({ item, onEdit, onDelete, onToggleAvailability, onViewDetails }: MenuItemCardProps) {
  const getDietaryTagColor = (tag: string) => {
    const colors: Record<string, string> = {
      'Vegetarian': 'bg-green-100 text-green-800',
      'Vegan': 'bg-green-100 text-green-800',
      'Gluten-Free': 'bg-blue-100 text-blue-800',
      'Keto-Friendly': 'bg-purple-100 text-purple-800',
      'High-Protein': 'bg-orange-100 text-orange-800',
      'Low-Carb': 'bg-yellow-100 text-yellow-800',
    };
    return colors[tag] || 'bg-gray-100 text-gray-800';
  };

  const getSpiceLevelColor = (level: string) => {
    const colors: Record<string, string> = {
      'mild': 'text-green-600',
      'medium': 'text-yellow-600',
      'hot': 'text-orange-600',
      'extra-hot': 'text-red-600',
    };
    return colors[level] || 'text-gray-600';
  };

  return (
    <div className={`bg-white rounded-xl border-2 transition-all duration-200 hover:shadow-lg ${
      item.isAvailable ? 'border-gray-200' : 'border-red-200 bg-red-50'
    }`}>
      {/* Image */}
      <div className="relative">
        <img
          src={item.image || 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&dpr=2'}
          alt={item.name}
          className="w-full h-48 object-cover rounded-t-xl"
        />
        
        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1">
          {item.isFeatured && (
            <span className="bg-orange-500 text-white px-2 py-1 rounded-full text-xs font-medium">
              Featured
            </span>
          )}
          {item.isPopular && (
            <span className="bg-yellow-500 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center">
              <Star className="h-3 w-3 mr-1" />
              Popular
            </span>
          )}
          {!item.isAvailable && (
            <span className="bg-red-500 text-white px-2 py-1 rounded-full text-xs font-medium">
              Unavailable
            </span>
          )}
        </div>

        {/* Availability toggle */}
        <button
          onClick={() => onToggleAvailability(item.id, !item.isAvailable)}
          className={`absolute top-3 right-3 p-2 rounded-full ${
            item.isAvailable ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'
          } text-white transition-colors duration-200`}
        >
          {item.isAvailable ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
        </button>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 truncate">{item.name}</h3>
            <p className="text-sm text-gray-600 mt-1">{item.category?.name}</p>
          </div>
          <div className="text-right ml-3">
            <p className="text-lg font-bold text-gray-900">{formatCurrency(item.price)}</p>
            {item.cost > 0 && (
              <p className="text-xs text-gray-500">
                Margin: {item.profitMargin.toFixed(1)}%
              </p>
            )}
          </div>
        </div>

        {/* Description */}
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{item.description}</p>

        {/* Details */}
        <div className="space-y-2 mb-3">
          <div className="flex items-center text-sm text-gray-600">
            <Clock className="h-4 w-4 mr-2" />
            <span>{item.preparationTime} min prep</span>
            {item.spiceLevel && (
              <>
                <span className="mx-2">•</span>
                <span className={getSpiceLevelColor(item.spiceLevel)}>
                  {item.spiceLevel} spice
                </span>
              </>
            )}
          </div>

          {item.nutritionalInfo && (
            <div className="flex items-center text-sm text-gray-600">
              <DollarSign className="h-4 w-4 mr-2" />
              <span>{item.nutritionalInfo.calories} cal</span>
              <span className="mx-2">•</span>
              <span>{item.nutritionalInfo.protein}g protein</span>
            </div>
          )}
        </div>

        {/* Dietary Tags */}
        {item.dietaryTags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {item.dietaryTags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className={`px-2 py-1 rounded-full text-xs font-medium ${getDietaryTagColor(tag)}`}
              >
                {tag}
              </span>
            ))}
            {item.dietaryTags.length > 3 && (
              <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                +{item.dietaryTags.length - 3} more
              </span>
            )}
          </div>
        )}

        {/* Allergens Warning */}
        {item.allergens.length > 0 && (
          <div className="mb-3">
            <p className="text-xs text-red-600">
              <strong>Allergens:</strong> {item.allergens.join(', ')}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-200">
          <button
            onClick={() => onViewDetails(item)}
            className="text-sm text-gray-600 hover:text-gray-900 font-medium"
          >
            View Details
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