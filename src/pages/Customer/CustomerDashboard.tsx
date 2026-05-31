import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { LogOut, Package, Heart, MapPin, Gift, Settings, ChevronRight, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function CustomerDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'orders' | 'favorites' | 'addresses' | 'loyalty' | 'profile'>('orders');

  const handleLogout = () => {
    logout();
    navigate('/auth/login');
  };

  // Mock data
  const mockOrders = [
    {
      id: 'ORD-001',
      date: '2024-05-28',
      total: '$45.99',
      status: 'delivered',
      items: ['Grilled Salmon', 'Caesar Salad'],
    },
    {
      id: 'ORD-002',
      date: '2024-05-25',
      total: '$32.50',
      status: 'delivered',
      items: ['Pasta Carbonara', 'Garlic Bread'],
    },
  ];

  const mockFavorites = [
    { id: 1, name: 'Grilled Salmon', category: 'Main Course', price: '$28' },
    { id: 2, name: 'Caesar Salad', category: 'Appetizer', price: '$12' },
    { id: 3, name: 'Chocolate Cake', category: 'Dessert', price: '$8' },
  ];

  const mockAddresses = [
    { id: 1, type: 'Home', address: '123 Main St, Apt 4B, New York, NY 10001', default: true },
    { id: 2, type: 'Work', address: '456 Business Ave, Suite 200, New York, NY 10002', default: false },
  ];

  const loyaltyPoints = 245;
  const loyaltyTier = 'Gold';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-orange-600">RestaurantOS</h1>
            <p className="text-gray-600 text-sm">Customer Dashboard</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 text-red-600 border border-red-300 rounded-lg hover:bg-red-50"
          >
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </div>
      </header>

      {/* Welcome Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg p-8 mb-8">
          <h2 className="text-3xl font-bold mb-2">Welcome back, {user?.name}! 👋</h2>
          <p className="text-orange-100">Order your favorite meals and track deliveries</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Total Orders</p>
                <p className="text-3xl font-bold text-orange-600 mt-2">{mockOrders.length}</p>
              </div>
              <Package className="w-12 h-12 text-orange-200" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Loyalty Points</p>
                <p className="text-3xl font-bold text-orange-600 mt-2">{loyaltyPoints}</p>
              </div>
              <Gift className="w-12 h-12 text-orange-200" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Loyalty Tier</p>
                <p className="text-3xl font-bold text-orange-600 mt-2">{loyaltyTier}</p>
              </div>
              <Gift className="w-12 h-12 text-orange-200" />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="border-b border-gray-200 flex">
            <button
              onClick={() => setActiveTab('orders')}
              className={`flex-1 py-4 px-4 text-center font-medium border-b-2 transition ${
                activeTab === 'orders'
                  ? 'border-orange-600 text-orange-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <Package className="w-5 h-5 inline mr-2" /> My Orders
            </button>
            <button
              onClick={() => setActiveTab('favorites')}
              className={`flex-1 py-4 px-4 text-center font-medium border-b-2 transition ${
                activeTab === 'favorites'
                  ? 'border-orange-600 text-orange-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <Heart className="w-5 h-5 inline mr-2" /> Favorites
            </button>
            <button
              onClick={() => setActiveTab('addresses')}
              className={`flex-1 py-4 px-4 text-center font-medium border-b-2 transition ${
                activeTab === 'addresses'
                  ? 'border-orange-600 text-orange-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <MapPin className="w-5 h-5 inline mr-2" /> Addresses
            </button>
            <button
              onClick={() => setActiveTab('loyalty')}
              className={`flex-1 py-4 px-4 text-center font-medium border-b-2 transition ${
                activeTab === 'loyalty'
                  ? 'border-orange-600 text-orange-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <Gift className="w-5 h-5 inline mr-2" /> Loyalty
            </button>
            <button
              onClick={() => setActiveTab('profile')}
              className={`flex-1 py-4 px-4 text-center font-medium border-b-2 transition ${
                activeTab === 'profile'
                  ? 'border-orange-600 text-orange-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <Settings className="w-5 h-5 inline mr-2" /> Profile
            </button>
          </div>

          {/* Tab Content */}
          <div className="p-8">
            {/* Orders Tab */}
            {activeTab === 'orders' && (
              <div>
                <h3 className="text-lg font-semibold mb-6">Order History</h3>
                <div className="space-y-4">
                  {mockOrders.map((order) => (
                    <div key={order.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-lg transition">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <p className="font-semibold text-gray-900">{order.id}</p>
                          <p className="text-sm text-gray-600">{order.date}</p>
                        </div>
                        <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium capitalize">
                          {order.status}
                        </span>
                      </div>
                      <p className="text-gray-700 mb-3">{order.items.join(', ')}</p>
                      <div className="flex justify-between items-center">
                        <p className="text-2xl font-bold text-orange-600">{order.total}</p>
                        <button className="text-orange-600 hover:text-orange-700 font-medium flex items-center gap-1">
                          View Details <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Favorites Tab */}
            {activeTab === 'favorites' && (
              <div>
                <h3 className="text-lg font-semibold mb-6">Your Favorite Meals</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {mockFavorites.map((item) => (
                    <div key={item.id} className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition">
                      <div className="bg-gradient-to-r from-orange-200 to-yellow-200 h-32 flex items-center justify-center">
                        <Heart className="w-12 h-12 text-orange-600" />
                      </div>
                      <div className="p-4">
                        <p className="text-orange-600 text-xs font-semibold">{item.category}</p>
                        <h4 className="font-semibold text-gray-900 mt-1">{item.name}</h4>
                        <div className="flex justify-between items-center mt-4">
                          <p className="text-xl font-bold text-orange-600">{item.price}</p>
                          <button className="bg-orange-600 text-white px-3 py-1 rounded hover:bg-orange-700 text-sm">
                            Add to Cart
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Addresses Tab */}
            {activeTab === 'addresses' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-semibold">Saved Addresses</h3>
                  <button className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 flex items-center gap-2">
                    <Plus className="w-4 h-4" /> Add Address
                  </button>
                </div>
                <div className="space-y-4">
                  {mockAddresses.map((addr) => (
                    <div key={addr.id} className="border border-gray-200 rounded-lg p-6">
                      <div className="flex justify-between items-start mb-2">
                        <p className="font-semibold text-gray-900">{addr.type}</p>
                        {addr.default && <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded">Default</span>}
                      </div>
                      <p className="text-gray-700">{addr.address}</p>
                      <div className="flex gap-2 mt-4">
                        <button className="text-orange-600 hover:text-orange-700 text-sm font-medium">Edit</button>
                        <button className="text-red-600 hover:text-red-700 text-sm font-medium">Delete</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Loyalty Tab */}
            {activeTab === 'loyalty' && (
              <div>
                <h3 className="text-lg font-semibold mb-6">Loyalty Program</h3>
                <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg p-8 mb-6">
                  <p className="text-orange-100 mb-2">Your Tier</p>
                  <p className="text-4xl font-bold">{loyaltyTier}</p>
                  <p className="text-orange-100 mt-2">You have {loyaltyPoints} loyalty points</p>
                </div>
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h4 className="font-semibold text-gray-900 mb-4">Benefits</h4>
                  <ul className="space-y-2 text-gray-700">
                    <li>✓ 10% discount on all orders</li>
                    <li>✓ Free delivery on orders over $30</li>
                    <li>✓ Double points during special events</li>
                    <li>✓ Birthday bonus rewards</li>
                    <li>✓ Priority customer support</li>
                  </ul>
                </div>
              </div>
            )}

            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div>
                <h3 className="text-lg font-semibold mb-6">Profile Settings</h3>
                <div className="space-y-6 max-w-2xl">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                    <input type="text" defaultValue={user?.name} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    <input type="email" defaultValue={user?.email} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                    <input type="tel" defaultValue={user?.phone || ''} placeholder="Add your phone number" className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
                  </div>
                  <button className="bg-orange-600 text-white px-8 py-2 rounded-lg hover:bg-orange-700">
                    Save Changes
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
