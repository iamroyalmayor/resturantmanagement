import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, Search, Heart, Plus, Trash2, ChevronRight } from 'lucide-react';
import { appConfig } from '../../config/app';
import { CartItem, MenuItem, menuItems } from '../../data/menu';
import {
  addCartItem,
  getCartCount,
  getCartSubtotal,
  loadCart,
  removeCartItem,
  saveCart,
  updateCartItemQuantity,
} from '../../utils/cart';

export function PublicMenu() {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  useEffect(() => {
    setCartItems(loadCart());
  }, []);

  useEffect(() => {
    saveCart(cartItems);
  }, [cartItems]);

  const filteredItems = menuItems.filter((item) => {
    const matchCategory = selectedCategory === 'all' || item.category.toLowerCase() === selectedCategory.toLowerCase();
    const matchSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchCategory && matchSearch;
  });

  const itemCount = useMemo(() => getCartCount(cartItems), [cartItems]);
  const subtotal = useMemo(() => getCartSubtotal(cartItems), [cartItems]);

  const toggleFavorite = (id: string) => {
    const newFavorites = new Set(favorites);
    if (newFavorites.has(id)) {
      newFavorites.delete(id);
    } else {
      newFavorites.add(id);
    }
    setFavorites(newFavorites);
  };

  const addToCart = (itemId: string) => {
    const selectedItem = menuItems.find((item) => item.id === itemId);
    if (!selectedItem) return;
    setCartItems((current) => addCartItem(current, selectedItem));
  };

  const updateQuantity = (id: string, delta: number) => {
    setCartItems((current) => updateCartItemQuantity(current, id, delta));
  };

  const removeFromCart = (id: string) => {
    setCartItems((current) => removeCartItem(current, id));
  };

  const handleCheckout = () => {
    navigate('/order/checkout');
  };

  return (
    <div className="min-h-screen bg-white">
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-orange-600">{appConfig.appName}</h1>
            <p className="text-gray-600 text-sm">Online Menu & Order</p>
          </div>

          <div className="flex items-center gap-3">
            <Link to="/" className="text-gray-700 hover:text-orange-600 font-medium">
              ← Back to Home
            </Link>
            <button
              type="button"
              onClick={handleCheckout}
              className="relative inline-flex items-center gap-2 bg-orange-600 px-4 py-2 text-white rounded-full hover:bg-orange-700 transition"
            >
              <ShoppingCart className="w-4 h-4" />
              Checkout
              {itemCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                  {itemCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-4xl font-bold">Order your favorites online.</h2>
            <p className="mt-3 max-w-2xl text-orange-100">Select dishes, manage your cart, and checkout with a simulated restaurant order flow.</p>
          </div>
          <div className="rounded-3xl bg-white/10 p-4">
            <p className="text-sm uppercase tracking-[0.2em] text-orange-100">Website order</p>
            <p className="text-3xl font-semibold mt-2">{itemCount} item{itemCount === 1 ? '' : 's'}</p>
            <p className="text-sm text-orange-100/90 mt-1">Subtotal {appConfig.currencySymbol}{subtotal.toFixed(2)}</p>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 grid gap-8 lg:grid-cols-[1.5fr_0.9fr]">
        <section>
          <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full lg:max-w-xl">
              <Search className="absolute left-4 top-3 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search menu items..."
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-3xl focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {['All', 'Appetizers', 'Main Course', 'Desserts', 'Beverages'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat.toLowerCase())}
                  className={`px-4 py-2 rounded-full font-medium transition ${
                    selectedCategory === cat.toLowerCase()
                      ? 'bg-white text-orange-600 shadow-sm'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {filteredItems.map((item) => (
              <div key={item.id} className="rounded-3xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-lg transition">
                <div className="relative h-52 bg-gray-100">
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => toggleFavorite(item.id)}
                    className="absolute top-4 right-4 rounded-full bg-white p-3 shadow-sm hover:bg-gray-100 transition"
                  >
                    <Heart className={`w-5 h-5 ${favorites.has(item.id) ? 'fill-red-500 text-red-500' : 'text-gray-400'}`} />
                  </button>
                </div>
                <div className="p-5 bg-white">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm text-orange-600 font-semibold">{item.category}</p>
                      <h3 className="text-xl font-semibold text-gray-900 mt-1">{item.name}</h3>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-orange-600">{appConfig.currencySymbol}{item.price}</p>
                    </div>
                  </div>
                  <p className="mt-4 text-sm leading-6 text-gray-600">{item.description}</p>
                  <div className="mt-5 flex flex-wrap items-center gap-3">
                    {item.vegetarian && <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">Vegetarian</span>}
                    {item.spicy && <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">Spicy</span>}
                    <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-semibold text-yellow-700">{item.rating} ★</span>
                  </div>
                  <div className="mt-6 flex items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => addToCart(item.id)}
                      className="inline-flex items-center gap-2 rounded-full bg-orange-600 px-5 py-3 text-sm font-semibold text-white hover:bg-orange-700 transition"
                    >
                      <Plus className="w-4 h-4" /> Add to Cart
                    </button>
                    <button
                      type="button"
                      onClick={handleCheckout}
                      className="text-sm font-semibold text-orange-600 hover:text-orange-700"
                    >
                      Checkout now <ChevronRight className="w-4 h-4 inline" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredItems.length === 0 && (
            <div className="rounded-3xl border border-dashed border-gray-300 bg-gray-50 p-10 text-center">
              <p className="text-lg font-semibold text-gray-900">No items found</p>
              <p className="mt-2 text-sm text-gray-500">Try another search term or clear the filters.</p>
            </div>
          )}
        </section>

        <aside className="space-y-6">
          <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-gray-500">Your Cart</p>
                <h2 className="text-2xl font-semibold text-gray-900">{itemCount} item{itemCount === 1 ? '' : 's'}</h2>
              </div>
              <div className="inline-flex items-center rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-700">Website</div>
            </div>

            <div className="space-y-4">
              {cartItems.length === 0 && (
                <div className="rounded-3xl border border-dashed border-orange-200 bg-orange-50 p-6 text-center text-sm text-orange-700">
                  Your cart is empty. Add items to begin checkout.
                </div>
              )}

              {cartItems.map((item) => (
                <div key={item.id} className="rounded-3xl border border-gray-200 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-semibold text-gray-900">{item.name}</p>
                      <p className="text-sm text-gray-500">${item.price.toFixed(2)} each</p>
                    </div>
                    <button onClick={() => removeFromCart(item.id)} className="rounded-full p-2 text-gray-400 hover:text-gray-600">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="mt-4 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1">
                      <button type="button" onClick={() => updateQuantity(item.id, -1)} className="text-orange-600 font-bold">-</button>
                      <span className="font-semibold">{item.quantity}</span>
                      <button type="button" onClick={() => updateQuantity(item.id, 1)} className="text-orange-600 font-bold">+</button>
                    </div>
                    <p className="font-semibold text-gray-900">${(item.price * item.quantity).toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>

            {cartItems.length > 0 && (
              <div className="mt-6 space-y-4">
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <button
                  type="button"
                  onClick={handleCheckout}
                  className="w-full rounded-full bg-orange-600 px-5 py-3 text-sm font-semibold text-white hover:bg-orange-700 transition"
                >
                  Proceed to Checkout
                </button>
              </div>
            )}
          </div>
        </aside>
      </main>

      <footer className="bg-gray-900 text-gray-300 py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p>&copy; 2024 RestaurantOS. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
