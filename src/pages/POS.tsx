import React, { useState } from 'react';
import { Plus, Minus, Trash2, DollarSign, CreditCard, Banknote, QrCode, Receipt, X } from 'lucide-react';
import { formatCurrency } from '../constants/currency';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  category: string;
}

interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: string;
  icon: string;
}

const menuItems: MenuItem[] = [
  // Appetizers
  { id: '1', name: 'Bruschetta', price: 8.99, category: 'appetizers', icon: '🍞' },
  { id: '2', name: 'Calamari', price: 12.99, category: 'appetizers', icon: '🦑' },
  { id: '3', name: 'Spring Rolls', price: 7.99, category: 'appetizers', icon: '🍲' },

  // Main Courses
  { id: '4', name: 'Grilled Salmon', price: 24.99, category: 'mains', icon: '🐟' },
  { id: '5', name: 'Ribeye Steak', price: 28.99, category: 'mains', icon: '🥩' },
  { id: '6', name: 'Pasta Carbonara', price: 16.99, category: 'mains', icon: '🍝' },
  { id: '7', name: 'Chicken Marsala', price: 18.99, category: 'mains', icon: '🍗' },

  // Desserts
  { id: '8', name: 'Chocolate Lava Cake', price: 9.99, category: 'desserts', icon: '🍰' },
  { id: '9', name: 'Tiramisu', price: 8.99, category: 'desserts', icon: '🎂' },
  { id: '10', name: 'Ice Cream', price: 6.99, category: 'desserts', icon: '🍦' },

  // Beverages
  { id: '11', name: 'Espresso', price: 3.99, category: 'beverages', icon: '☕' },
  { id: '12', name: 'Coca Cola', price: 2.99, category: 'beverages', icon: '🥤' },
  { id: '13', name: 'Red Wine', price: 12.99, category: 'beverages', icon: '🍷' },
];

const categories = ['appetizers', 'mains', 'desserts', 'beverages'];
const categoryLabels = {
  appetizers: 'Appetizers',
  mains: 'Main Courses',
  desserts: 'Desserts',
  beverages: 'Beverages',
};

type PaymentMethod = 'cash' | 'card' | 'digital';

export function POS() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('mains');
  const [showPayment, setShowPayment] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card');
  const [tableNumber, setTableNumber] = useState('5');
  const [notes, setNotes] = useState('');
  const [taxRate] = useState(0.085);

  const addToCart = (item: MenuItem) => {
    setCart(prev => {
      const existing = prev.find(p => p.id === item.id);
      if (existing) {
        return prev.map(p => p.id === item.id ? { ...p, quantity: p.quantity + 1 } : p);
      }
      return [...prev, { id: item.id, name: item.name, price: item.price, quantity: 1, category: item.category }];
    });
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(id);
    } else {
      setCart(prev => prev.map(p => p.id === id ? { ...p, quantity } : p));
    }
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(p => p.id !== id));
  };

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const tax = subtotal * taxRate;
  const total = subtotal + tax;

  const handleCompletePayment = () => {
    setShowPayment(false);
    setCart([]);
    setNotes('');
  };

  const categoryItems = menuItems.filter(m => m.category === selectedCategory);

  return (
    <div className="h-screen flex bg-gray-900 text-white">
      {/* Menu Section */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-gray-800 border-b border-gray-700 p-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold flex items-center space-x-2">
              <DollarSign className="h-8 w-8 text-orange-500" />
              <span>Point of Sale</span>
            </h1>
            <div className="text-sm text-gray-300">Table: <span className="font-bold text-white">{tableNumber}</span></div>
          </div>

          {/* Category Tabs */}
          <div className="flex space-x-2 overflow-x-auto">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
                  selectedCategory === cat
                    ? 'bg-orange-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {categoryLabels[cat as keyof typeof categoryLabels]}
              </button>
            ))}
          </div>
        </div>

        {/* Menu Grid */}
        <div className="flex-1 overflow-auto p-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {categoryItems.map(item => (
              <button
                key={item.id}
                onClick={() => addToCart(item)}
                className="bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg p-3 transition-colors group"
              >
                <div className="text-3xl mb-2">{item.icon}</div>
                <h3 className="text-sm font-semibold text-white group-hover:text-orange-400 transition-colors truncate">{item.name}</h3>
                <p className="text-lg font-bold text-orange-500 mt-1">{formatCurrency(item.price)}</p>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Cart Section */}
      <div className="w-80 bg-gray-800 border-l border-gray-700 flex flex-col">
        {/* Cart Header */}
        <div className="bg-gray-900 border-b border-gray-700 p-4">
          <h2 className="text-lg font-bold flex items-center space-x-2">
            <Receipt className="h-5 w-5" />
            <span>Order</span>
          </h2>
          <div className="text-xs text-gray-400 mt-1">Table {tableNumber}</div>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-auto">
          {cart.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-500">
              <p className="text-center">Add items to order</p>
            </div>
          ) : (
            <div className="p-4 space-y-2">
              {cart.map(item => (
                <div key={item.id} className="bg-gray-700 rounded-lg p-3 flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{item.name}</p>
                    <p className="text-xs text-gray-400">{formatCurrency(item.price)} each</p>
                  </div>
                  <div className="flex items-center space-x-1 bg-gray-600 rounded-lg">
                    <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="p-1 hover:bg-gray-500">
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="w-6 text-center text-xs font-semibold">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="p-1 hover:bg-gray-500">
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                  <button onClick={() => removeFromCart(item.id)} className="p-1 text-red-400 hover:text-red-300">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Notes */}
        <div className="border-t border-gray-700 p-3">
          <input
            type="text"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Special instructions..."
            className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-orange-500"
          />
        </div>

        {/* Totals */}
        <div className="border-t border-gray-700 p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Subtotal</span>
            <span className="font-semibold">{formatCurrency(subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Tax ({(taxRate * 100).toFixed(1)}%)</span>
            <span className="font-semibold">{formatCurrency(tax)}</span>
          </div>
          <div className="flex justify-between text-lg font-bold border-t border-gray-700 pt-2 mt-2">
            <span>Total</span>
            <span className="text-orange-400">{formatCurrency(total)}</span>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-2 pt-2">
            <button
              onClick={() => setCart([])}
              className="flex-1 bg-red-900 hover:bg-red-800 text-white py-2 px-3 rounded-lg text-sm font-medium transition-colors"
            >
              Clear
            </button>
            <button
              onClick={() => setShowPayment(true)}
              disabled={cart.length === 0}
              className="flex-1 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-2 px-3 rounded-lg text-sm font-medium transition-colors"
            >
              Pay
            </button>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {showPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg max-w-md w-full mx-4 p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold">Complete Payment</h3>
              <button onClick={() => setShowPayment(false)} className="p-1 hover:bg-gray-700 rounded">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Order Summary */}
            <div className="bg-gray-700 rounded-lg p-4 mb-6 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Tax</span>
                <span>{formatCurrency(tax)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold border-t border-gray-600 pt-2 mt-2">
                <span>Total</span>
                <span className="text-orange-400">{formatCurrency(total)}</span>
              </div>
            </div>

            {/* Payment Method */}
            <div className="mb-6">
              <label className="block text-sm font-semibold mb-3">Payment Method</label>
              <div className="space-y-2">
                {[
                  { val: 'card' as const, label: 'Card', icon: <CreditCard className="h-4 w-4" /> },
                  { val: 'cash' as const, label: 'Cash', icon: <Banknote className="h-4 w-4" /> },
                  { val: 'digital' as const, label: 'Digital Wallet', icon: <QrCode className="h-4 w-4" /> },
                ].map(method => (
                  <label key={method.val} className="flex items-center space-x-3 p-3 bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-600 transition-colors">
                    <input type="radio" name="payment" value={method.val} checked={paymentMethod === method.val} onChange={e => setPaymentMethod(e.target.value as PaymentMethod)} className="w-4 h-4" />
                    <div className="flex items-center space-x-2 flex-1">
                      {method.icon}
                      <span className="font-medium">{method.label}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3">
              <button
                onClick={() => setShowPayment(false)}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCompletePayment}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
              >
                <DollarSign className="h-5 w-5" />
                <span>Complete</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
