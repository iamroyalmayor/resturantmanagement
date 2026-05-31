import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Phone, Calendar, Star, MapPin } from 'lucide-react';
import { appConfig } from '../../config/app';
import { CartItem, MenuItem, menuItems } from '../../data/menu';
import { addCartItem, getCartCount, getCartSubtotal, loadCart, saveCart } from '../../utils/cart';

export function Home() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    setCartItems(loadCart());
  }, []);

  const cartCount = useMemo(() => getCartCount(cartItems), [cartItems]);
  const cartTotal = useMemo(() => getCartSubtotal(cartItems), [cartItems]);

  const featuredMeals = menuItems.slice(0, 3);
  const testimonials = [
    {
      name: 'Sarah Johnson',
      text: 'Amazing food and wonderful service. Will definitely come back!',
      rating: 5,
    },
    {
      name: 'Michael Chen',
      text: 'The best restaurant experience I\'ve had. Highly recommended!',
      rating: 5,
    },
    {
      name: 'Emma Wilson',
      text: 'Perfect atmosphere and delicious meals. Worth every penny!',
      rating: 5,
    },
  ];

  const categories = [
    { name: 'Appetizers', count: 15 },
    { name: 'Main Course', count: 24 },
    { name: 'Desserts', count: 12 },
    { name: 'Beverages', count: 18 },
  ];

  const handleAddToCart = (item: MenuItem) => {
    const updated = addCartItem(cartItems, item);
    setCartItems(updated);
    saveCart(updated);
    setToastMessage(`${item.name} added to cart`);
    window.setTimeout(() => setToastMessage(''), 2500);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="text-2xl font-bold text-orange-600">{appConfig.appName}</div>
          <nav className="hidden md:flex gap-8">
            <a href="#menu" className="text-gray-700 hover:text-orange-600">Menu</a>
            <a href="#about" className="text-gray-700 hover:text-orange-600">About</a>
            <a href="#contact" className="text-gray-700 hover:text-orange-600">Contact</a>
          </nav>
          <div className="flex gap-3">
            <Link to="/auth/login" className="px-4 py-2 text-orange-600 border border-orange-600 rounded-lg hover:bg-orange-50">
              Sign In
            </Link>
            <Link to="/auth/signup" className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700">
              Sign Up
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-orange-600 to-orange-700 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
            <div>
              <h1 className="text-5xl font-bold mb-4">Experience Fine Dining</h1>
              <p className="text-xl text-orange-100 mb-8">
                Discover exceptional cuisine crafted by our award-winning chefs. Order online, make reservations, or visit us today.
              </p>
              <div className="flex gap-4 flex-wrap">
                <Link to="/menu" className="bg-white text-orange-600 px-8 py-3 rounded-lg font-semibold hover:bg-orange-50 transition flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5" /> Order Now
                </Link>
                <Link to="/reservations" className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-orange-600 transition flex items-center gap-2">
                  <Calendar className="w-5 h-5" /> Reserve Table
                </Link>
                <a href={`https://wa.me/${appConfig.whatsappNumber}`} className="bg-green-500 text-white px-8 py-3 rounded-lg font-semibold hover:bg-green-600 transition flex items-center gap-2">
                  <Phone className="w-5 h-5" /> WhatsApp Order
                </a>
              </div>
              {toastMessage && (
                <div className="mt-6 inline-flex items-center gap-3 rounded-3xl bg-white/10 border border-white/30 px-5 py-4 text-sm text-white shadow-lg">
                  <ShoppingCart className="w-5 h-5" /> {toastMessage}
                </div>
              )}
            </div>
            <div>
              <img
                src="https://images.pexels.com/photos/1092730/pexels-photo-1092730.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&dpr=2"
                alt="Restaurant"
                className="rounded-lg shadow-2xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Featured Meals */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-center mb-12">Featured Meals</h2>
          <div className="max-w-3xl mx-auto mb-10 rounded-3xl border border-orange-100 bg-orange-50 p-6 text-center shadow-sm">
            <p className="text-sm uppercase tracking-[0.2em] text-orange-600 mb-2">Quick Cart Summary</p>
            <p className="text-3xl font-bold text-orange-700">{cartCount} item{cartCount === 1 ? '' : 's'} in cart</p>
            <p className="text-sm text-orange-700/80 mt-2">{appConfig.currencySymbol}{cartTotal.toFixed(2)} total</p>
            <div className="mt-4 flex flex-wrap justify-center gap-3">
              <Link to="/menu" className="rounded-full bg-white px-5 py-2 text-sm font-semibold text-orange-600 shadow-sm hover:bg-orange-100 transition">
                View Full Menu
              </Link>
              {cartCount > 0 && (
                <Link to="/order/checkout" className="rounded-full bg-orange-600 px-5 py-2 text-sm font-semibold text-white hover:bg-orange-700 transition">
                  Checkout Now
                </Link>
              )}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {featuredMeals.map((meal) => (
              <div key={meal.id} className="bg-white rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition">
                <img src={meal.image} alt={meal.name} className="w-full h-48 object-cover" />
                <div className="p-6">
                  <p className="text-orange-600 text-sm font-semibold">{meal.category}</p>
                  <h3 className="text-xl font-bold text-gray-900 mt-2">{meal.name}</h3>
                  <p className="mt-4 text-gray-600 text-sm leading-6">{meal.description}</p>
                  <div className="mt-5 flex items-center justify-between gap-3">
                    <span className="text-2xl font-bold text-orange-600">{appConfig.currencySymbol}{meal.price}</span>
                    <button
                      onClick={() => handleAddToCart(meal)}
                      className="rounded-full bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700 transition"
                    >
                      Add to Cart
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="text-center mt-12">
            <Link to="/menu" className="bg-orange-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-orange-700 transition inline-block">
              View Full Menu
            </Link>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-center mb-12">Our Categories</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {categories.map((cat) => (
              <div key={cat.name} className="bg-gradient-to-br from-orange-50 to-yellow-50 p-8 rounded-lg text-center hover:shadow-lg transition">
                <h3 className="text-xl font-bold text-gray-900">{cat.name}</h3>
                <p className="text-orange-600 text-lg font-semibold mt-2">{cat.count} Items</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-center mb-12">What Our Customers Say</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((test, idx) => (
              <div key={idx} className="bg-white p-8 rounded-lg shadow-lg">
                <div className="flex gap-1 mb-4">
                  {[...Array(test.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-700 mb-4 italic">"{test.text}"</p>
                <p className="font-semibold text-gray-900">{test.name}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-orange-600 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold mb-4">Ready to Experience Great Food?</h2>
          <p className="text-xl text-orange-100 mb-8">Join thousands of satisfied customers</p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link to="/menu" className="bg-white text-orange-600 px-8 py-3 rounded-lg font-semibold hover:bg-orange-50 transition">
              Order Online
            </Link>
            <Link to="/reservations" className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-orange-700 transition">
              Make Reservation
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="text-white font-bold mb-4">RestaurantOS</h3>
              <p>Fine dining made accessible</p>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4">Quick Links</h4>
              <ul className="space-y-2">
                <li><a href="#menu" className="hover:text-white">Menu</a></li>
                <li><a href="#about" className="hover:text-white">About</a></li>
                <li><a href="#contact" className="hover:text-white">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4">Contact</h4>
              <p>📧 {appConfig.supportEmail}</p>
              <p>📞 (555) 123-4567</p>
              <p>📍 123 Main St, City</p>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4">Hours</h4>
              <p>Mon-Thu: 11am - 11pm</p>
              <p>Fri-Sat: 11am - 1am</p>
              <p>Sun: 12pm - 10pm</p>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center">
            <p>&copy; 2024 {appConfig.appName}. All rights reserved.</p>
            <p className="text-xs mt-2 text-gray-400">Frontend demo only • Mock data</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
