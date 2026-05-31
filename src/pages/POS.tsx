import React, { useState } from 'react';
import { Plus, Minus, Trash2, DollarSign, CreditCard, Banknote, QrCode, Receipt, X, Archive, Clock } from 'lucide-react';
import { formatCurrency } from '../constants/currency';
import { appConfig } from '../config/app';

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

interface HeldOrder {
  id: string;
  name: string;
  tableNumber: string;
  notes: string;
  items: CartItem[];
  createdAt: string;
  total: number;
  type: OrderType;
  contact?: string;
  customerName?: string;
  address?: string;
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
type OrderType = 'dine-in' | 'carryout' | 'delivery';

export function POS() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('mains');
  const [showPayment, setShowPayment] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card');
  const [tableNumber, setTableNumber] = useState('5');
  const [notes, setNotes] = useState('');
  const [posTab, setPosTab] = useState<'active' | 'held'>('active');
  const [holdOrders, setHoldOrders] = useState<HeldOrder[]>([]);
  const [taxRate] = useState(appConfig.taxRate);
  const [orderType, setOrderType] = useState<OrderType>('dine-in');
  const [contactPhone, setContactPhone] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');

  const holdCurrentOrder = () => {
    if (!cart.length) return;
    const total = subtotal + tax;
    const held = {
      id: `hold-${Date.now()}`,
      name: `Held Order ${holdOrders.length + 1}`,
      tableNumber,
      notes,
      items: cart,
      createdAt: new Date().toISOString(),
      total,
      type: orderType,
      contact: contactPhone,
      customerName,
      address: deliveryAddress,
    };
    setHoldOrders((prev) => [held, ...prev]);
    setCart([]);
    setNotes('');
  };

  const restoreHeldOrder = (orderId: string) => {
    const order = holdOrders.find((item) => item.id === orderId);
    if (!order) return;
    setCart(order.items);
    setNotes(order.notes);
    setTableNumber(order.tableNumber);
    setOrderType(order.type);
    setCustomerName(order.customerName || '');
    setContactPhone(order.contact || '');
    setDeliveryAddress(order.address || '');
    setHoldOrders((prev) => prev.filter((item) => item.id !== orderId));
    setPosTab('active');
  };

  const discardHeldOrder = (orderId: string) => {
    setHoldOrders((prev) => prev.filter((item) => item.id !== orderId));
  };

  const createNewOrder = () => {
    setCart([]);
    setNotes('');
    setTableNumber('1');
    setPosTab('active');
  };

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

  const printOrder = (data: {
    orderNumber: string;
    table: string;
    items: CartItem[];
    notes?: string;
    total: number;
    type: OrderType;
    contact?: string;
    customerName?: string;
    address?: string;
  }) => {
    const isDineIn = data.type === 'dine-in';
    const isCarryout = data.type === 'carryout';
    const isDelivery = data.type === 'delivery';

    const html = `
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Receipt ${data.orderNumber}</title>
          <style>
            body { font-family: Arial, sans-serif; color: #111; padding: 16px; max-width: 400px }
            h2 { margin: 0 0 12px 0; font-size: 18px }
            .meta { margin-bottom: 8px; font-size: 13px }
            .section { margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid #ddd }
            .section:last-child { border-bottom: none }
            .items { width: 100%; border-collapse: collapse; margin-top: 8px }
            .items tr { border-bottom: 1px solid #eee }
            .items td { padding: 6px 0; font-size: 13px }
            .items td:last-child { text-align: right }
            .total { font-weight: bold; margin-top: 12px; font-size: 14px }
            .label { font-weight: bold; margin-bottom: 4px; font-size: 12px; color: #666 }
            .value { font-size: 13px; margin-bottom: 8px }
          </style>
        </head>
        <body>
          <h2>${appConfig.appName} - Receipt</h2>

          <div class="section">
            <div class="label">ORDER DETAILS</div>
            <div class="meta">Order #: ${data.orderNumber}</div>
            <div class="meta">Type: ${data.type.toUpperCase()}</div>
            ${isDineIn ? `<div class="meta">Table: ${data.table}</div>` : ''}
            ${isCarryout || isDelivery ? `<div class="meta">Customer: ${data.customerName || 'N/A'}</div>` : ''}
            ${isDelivery ? `<div class="meta">Phone: ${data.contact || 'N/A'}</div>` : ''}
            ${isDelivery ? `<div class="meta">Address: ${data.address || 'N/A'}</div>` : ''}
            ${isCarryout ? `<div class="meta">Phone: ${data.contact || 'N/A'}</div>` : ''}
          </div>

          <div class="section">
            <div class="label">ITEMS</div>
            <table class="items">
              ${data.items.map(i => `<tr><td>${i.name} (x${i.quantity})</td><td>${formatCurrency(i.price * i.quantity)}</td></tr>`).join('')}
            </table>
          </div>

          ${data.notes ? `<div class="section"><div class="label">SPECIAL INSTRUCTIONS</div><div class="value">${data.notes}</div></div>` : ''}

          <div class="section">
            <div style="display: flex; justify-content: space-between; margin-bottom: 6px; font-size: 13px">
              <span>Subtotal:</span>
              <span>${formatCurrency(data.items.reduce((s, i) => s + i.price * i.quantity, 0))}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 6px; font-size: 13px">
              <span>Tax:</span>
              <span>${formatCurrency(data.total - data.items.reduce((s, i) => s + i.price * i.quantity, 0))}</span>
            </div>
            <div class="total" style="display: flex; justify-content: space-between">
              <span>TOTAL:</span>
              <span>${formatCurrency(data.total)}</span>
            </div>
          </div>

          <div style="margin-top: 20px; text-align: center; font-size: 12px; color: #999">
            ${new Date().toLocaleString()}
          </div>
        </body>
      </html>
    `;

    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(html);
    w.document.close();
    setTimeout(() => {
      w.print();
    }, 300);
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
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold flex items-center space-x-2">
                <Receipt className="h-5 w-5" />
                <span>Order</span>
              </h2>
              <div className="text-xs text-gray-400 mt-1">Table {tableNumber}</div>
            </div>
            <div className="inline-flex rounded-lg bg-gray-800 p-1">
              <button
                onClick={() => setPosTab('active')}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition ${posTab === 'active' ? 'bg-orange-600 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`}
              >
                Live Order
              </button>
              <button
                onClick={() => setPosTab('held')}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition ${posTab === 'held' ? 'bg-orange-600 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`}
              >
                Held Orders ({holdOrders.length})
              </button>
            </div>
          </div>
        </div>

        {posTab === 'active' ? (
          <>
            <div className="bg-gray-700 border-b border-gray-600 p-3">
              <label className="block text-xs font-semibold text-gray-300 mb-2">Order Type</label>
              <div className="flex space-x-1 text-xs">
                {(['dine-in', 'carryout', 'delivery'] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => { setOrderType(type); setTableNumber(type === 'dine-in' ? '5' : ''); setCustomerName(''); setContactPhone(''); setDeliveryAddress(''); }}
                    className={`flex-1 px-2 py-1 rounded transition ${orderType === type ? 'bg-orange-600 text-white' : 'bg-gray-600 text-gray-300 hover:bg-gray-500'}`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-auto">
              {cart.length === 0 ? (
                <div className="flex items-center justify-center h-full text-gray-500">
                  <p className="text-center">Add items to order or restore a held order</p>
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

            {/* Customer/Contact Fields */}
            {orderType !== 'dine-in' && (
              <div className="border-t border-gray-700 p-3 space-y-2">
                <input
                  type="text"
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                  placeholder="Customer name"
                  className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-orange-500"
                />
                <input
                  type="tel"
                  value={contactPhone}
                  onChange={e => setContactPhone(e.target.value)}
                  placeholder="Phone number"
                  className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-orange-500"
                />
                {orderType === 'delivery' && (
                  <input
                    type="text"
                    value={deliveryAddress}
                    onChange={e => setDeliveryAddress(e.target.value)}
                    placeholder="Delivery address"
                    className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-orange-500"
                  />
                )}
              </div>
            )}

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
                  onClick={holdCurrentOrder}
                  disabled={cart.length === 0}
                  className="flex-1 bg-yellow-600 hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-2 px-3 rounded-lg text-sm font-medium transition-colors"
                >
                  Hold Order
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
          </>
        ) : (
          <div className="flex-1 overflow-auto p-4 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-gray-400">Held Orders</p>
                <h3 className="text-xl font-semibold text-white">Orders on hold</h3>
              </div>
              <button onClick={createNewOrder} className="inline-flex items-center gap-2 rounded-lg bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700">
                <Clock className="h-4 w-4" />
                New Order
              </button>
            </div>

            {holdOrders.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center rounded-3xl border border-dashed border-gray-700 bg-gray-900/40 p-8 text-center text-gray-400">
                <Archive className="mb-4 h-10 w-10 text-gray-500" />
                <p className="text-sm font-medium">No held orders yet.</p>
                <p className="text-xs text-gray-500">Hold an order from the Live Order tab to keep it pending while attending another customer.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {holdOrders.map((order) => (
                  <div key={order.id} className="rounded-3xl border border-gray-700 bg-gray-900 p-4">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="text-sm text-gray-400">{new Date(order.createdAt).toLocaleString()}</p>
                        <h4 className="text-lg font-semibold text-white">{order.name}</h4>
                        <p className="text-sm text-gray-400">Table {order.tableNumber} • {order.items.length} items</p>
                      </div>
                      <div className="space-x-1 text-right">
                        <button onClick={() => restoreHeldOrder(order.id)} className="rounded-lg bg-green-600 px-3 py-2 text-xs font-semibold text-white hover:bg-green-500">Resume</button>
                        <button onClick={() => printOrder({ orderNumber: order.id, table: order.tableNumber, items: order.items, notes: order.notes, total: order.total, type: order.type, contact: order.contact, customerName: order.customerName, address: order.address })} className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-500">Print</button>
                        <button onClick={() => discardHeldOrder(order.id)} className="rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white hover:bg-red-500">Discard</button>
                      </div>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-2 text-sm text-gray-400">
                      <div>Total</div>
                      <div className="text-right text-white font-semibold">{formatCurrency(order.total)}</div>
                      <div>Notes</div>
                      <div className="text-right">{order.notes || 'None'}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
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
              <button
                onClick={() => {
                  const orderNumber = `ORD-${Date.now()}`;
                  printOrder({ orderNumber, table: tableNumber, items: cart, notes, total, type: orderType, contact: contactPhone, customerName, address: deliveryAddress });
                  handleCompletePayment();
                }}
                className="flex-1 bg-green-700 hover:bg-green-800 text-white py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
              >
                <DollarSign className="h-5 w-5" />
                <span>Complete & Print</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
