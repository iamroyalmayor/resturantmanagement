import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, CreditCard, Home, MapPin, Pencil, Truck, CheckCircle2 } from 'lucide-react';
import { appConfig } from '../../config/app';
import { CartItem } from '../../data/menu';
import { loadCart, saveCart, getCartSubtotal } from '../../utils/cart';

export function Checkout() {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [orderType, setOrderType] = useState<'dine-in' | 'takeaway' | 'delivery'>('delivery');
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'cash' | 'wallet'>('card');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [isPlacing, setIsPlacing] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderId, setOrderId] = useState('');
  const [toast, setToast] = useState('');

  useEffect(() => {
    setCartItems(loadCart());
  }, []);

  const subtotal = useMemo(() => getCartSubtotal(cartItems), [cartItems]);
  const tax = useMemo(() => subtotal * appConfig.taxRate, [subtotal]);
  const serviceCharge = useMemo(() => subtotal * appConfig.serviceCharge, [subtotal]);
  const total = useMemo(() => subtotal + tax + serviceCharge, [subtotal, tax, serviceCharge]);

  const handlePlaceOrder = () => {
    if (!name || !phone || (orderType === 'delivery' && !address)) {
      setToast('Please complete your contact and delivery details.');
      setTimeout(() => setToast(''), 3000);
      return;
    }

    setIsPlacing(true);
    setTimeout(() => {
      setIsPlacing(false);
      setOrderPlaced(true);
      setOrderId(`WEB-${Math.floor(1000 + Math.random() * 9000)}`);
      saveCart([]);
    }, 1200);
  };

  const handleReturn = () => {
    navigate('/menu');
  };

  if (orderPlaced) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-xl overflow-hidden">
          <div className="p-8 text-center bg-gradient-to-r from-orange-600 to-orange-700 text-white">
            <div className="flex items-center justify-center gap-3 mx-auto w-fit mb-6">
              <CheckCircle2 className="w-10 h-10" />
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-orange-100">Order Confirmed</p>
                <h1 className="text-3xl font-bold mt-2">Thank you, your order is on the way</h1>
              </div>
            </div>
            <p className="max-w-2xl mx-auto text-orange-100/90">Your order has been queued for the kitchen and will be prepared shortly.</p>
          </div>

          <div className="p-8 space-y-6">
            <div className="rounded-3xl border border-gray-200 p-6 bg-gray-50">
              <p className="text-sm text-gray-500">Order ID</p>
              <p className="text-2xl font-semibold text-gray-900 mt-2">{orderId}</p>
              <p className="mt-4 text-gray-600">Placed with {paymentMethod === 'card' ? 'Card' : paymentMethod === 'cash' ? 'Cash' : 'Wallet'} payment.</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl border border-gray-200 p-6">
                <p className="text-sm uppercase tracking-[0.18em] text-gray-500">Order Summary</p>
                <p className="mt-4 text-lg font-semibold text-gray-900">{cartItems.length} items</p>
                <p className="text-sm text-gray-500 mt-2">Subtotal: {appConfig.currencySymbol}{subtotal.toFixed(2)}</p>
                <p className="text-sm text-gray-500">Tax: {appConfig.currencySymbol}{tax.toFixed(2)}</p>
                <p className="text-sm text-gray-500">Service charge: {appConfig.currencySymbol}{serviceCharge.toFixed(2)}</p>
              </div>
              <div className="rounded-3xl border border-gray-200 p-6">
                <p className="text-sm uppercase tracking-[0.18em] text-gray-500">Delivery Details</p>
                <p className="mt-4 text-lg font-semibold text-gray-900">{name}</p>
                <p className="text-sm text-gray-500">{phone}</p>
                {orderType === 'delivery' && <p className="text-sm text-gray-500 mt-2">{address}</p>}
              </div>
            </div>

            <button
              onClick={handleReturn}
              className="w-full bg-orange-600 hover:bg-orange-700 text-white py-3 rounded-2xl font-semibold transition"
            >
              Back to Menu
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto grid gap-6 lg:grid-cols-[1.5fr_0.9fr]">
        <div className="space-y-6">
          <div className="bg-white rounded-3xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <Link to="/menu" className="inline-flex items-center gap-2 text-orange-600 hover:text-orange-700 text-sm font-semibold">
                  <ArrowLeft className="w-4 h-4" /> Back to Menu
                </Link>
                <h1 className="text-3xl font-bold text-gray-900 mt-4">Checkout</h1>
                <p className="text-sm text-gray-600 mt-2">Complete your order details before submitting.</p>
              </div>
              <div className="text-right text-sm text-gray-500">
                <p>{cartItems.length} items in cart</p>
                <p className="mt-1">Website order flow</p>
              </div>
            </div>

            <section className="space-y-4">
              <div className="rounded-3xl border border-gray-200 p-5 bg-gray-50">
                <p className="text-sm font-semibold text-gray-900 mb-4">Order Type</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { value: 'dine-in', label: 'Dine In', icon: Home },
                    { value: 'takeaway', label: 'Takeaway', icon: Truck },
                    { value: 'delivery', label: 'Delivery', icon: MapPin },
                  ].map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setOrderType(option.value as 'dine-in' | 'takeaway' | 'delivery')}
                      className={`rounded-3xl border p-4 text-left transition ${
                        orderType === option.value ? 'border-orange-500 bg-white shadow-sm' : 'border-gray-200 bg-white hover:border-orange-300'
                      }`}
                    >
                      <option.icon className="w-5 h-5 text-orange-600 mb-3" />
                      <p className="font-semibold text-gray-900">{option.label}</p>
                      <p className="text-sm text-gray-500 mt-1">{option.value === 'delivery' ? 'Fast delivery to your door' : option.value === 'takeaway' ? 'Grab and go' : 'Dine comfortably in our restaurant'}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-3xl border border-gray-200 p-5 bg-white space-y-6">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Contact Information</h2>
                  <p className="text-sm text-gray-500 mt-1">We will use this to confirm your order.</p>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="space-y-2 text-sm text-gray-700">
                    Name
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full rounded-2xl border border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="Full name"
                    />
                  </label>
                  <label className="space-y-2 text-sm text-gray-700">
                    Phone
                    <input
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full rounded-2xl border border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="Phone number"
                    />
                  </label>
                  <label className="space-y-2 text-sm text-gray-700">
                    Email
                    <input
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full rounded-2xl border border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="Email address"
                    />
                  </label>
                  <label className="space-y-2 text-sm text-gray-700">
                    Delivery Address
                    <input
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      disabled={orderType !== 'delivery'}
                      className="w-full rounded-2xl border border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:bg-gray-100"
                      placeholder="Street, city, apartment"
                    />
                  </label>
                </div>
              </div>

              <div className="rounded-3xl border border-gray-200 p-5 bg-white space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Payment Method</h2>
                    <p className="text-sm text-gray-500 mt-1">Mock payment options for demo checkout.</p>
                  </div>
                  <CreditCard className="w-5 h-5 text-orange-600" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { value: 'card', label: 'Credit Card' },
                    { value: 'cash', label: 'Cash' },
                    { value: 'wallet', label: 'Wallet' },
                  ].map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setPaymentMethod(option.value as 'card' | 'cash' | 'wallet')}
                      className={`rounded-3xl border p-4 text-left transition ${
                        paymentMethod === option.value ? 'border-orange-500 bg-orange-50 shadow-sm' : 'border-gray-200 bg-white hover:border-orange-300'
                      }`}
                    >
                      <p className="font-semibold text-gray-900">{option.label}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-3xl border border-gray-200 p-5 bg-white space-y-4">
                <div className="flex items-center gap-3">
                  <Pencil className="w-5 h-5 text-orange-600" />
                  <h2 className="text-lg font-semibold text-gray-900">Order Notes</h2>
                </div>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add any special instructions or dietary requests"
                  className="w-full min-h-[120px] rounded-3xl border border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </section>
          </div>

          <div className="bg-white rounded-3xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-gray-500">Order Summary</p>
                <h2 className="text-xl font-semibold text-gray-900">{cartItems.length} items</h2>
              </div>
              <span className="inline-flex items-center gap-2 rounded-full bg-orange-50 px-3 py-1 text-sm font-semibold text-orange-700">
                Website
              </span>
            </div>
            <div className="space-y-4">
              {cartItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-semibold text-gray-900">{item.name}</p>
                    <p className="text-sm text-gray-500">Qty {item.quantity}</p>
                  </div>
                  <p className="font-semibold text-gray-900">${(item.price * item.quantity).toFixed(2)}</p>
                </div>
              ))}
            </div>
            <div className="mt-6 border-t border-gray-200 pt-4 space-y-3 text-sm text-gray-600">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax</span>
                <span>${tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Delivery fee</span>
                <span>$3.50</span>
              </div>
              <div className="flex justify-between text-lg font-semibold text-gray-900">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>
            <button
              onClick={handlePlaceOrder}
              disabled={isPlacing || cartItems.length === 0}
              className="mt-6 w-full rounded-3xl bg-orange-600 px-5 py-3 text-white font-semibold shadow-lg hover:bg-orange-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPlacing ? 'Placing Order...' : 'Place Order'}
            </button>
            {toast && <p className="mt-4 text-sm text-red-600">{toast}</p>}
          </div>
        </div>

        {/* Aside Summary */}
        <aside className="space-y-6">
          <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
            <p className="text-sm text-gray-500">Your Order</p>
            <div className="mt-4 space-y-4">
              {cartItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-gray-900">{item.name}</p>
                    <p className="text-sm text-gray-500">Qty {item.quantity}</p>
                  </div>
                  <p className="text-sm font-semibold text-gray-900">${(item.price * item.quantity).toFixed(2)}</p>
                </div>
              ))}
            </div>
            <div className="mt-5 border-t border-gray-200 pt-4 text-sm text-gray-600">
              <p>Subtotal: ${subtotal.toFixed(2)}</p>
              <p>Tax: ${tax.toFixed(2)}</p>
              <p>Delivery: $3.50</p>
              <p className="mt-3 font-semibold text-gray-900">Total: ${total.toFixed(2)}</p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
