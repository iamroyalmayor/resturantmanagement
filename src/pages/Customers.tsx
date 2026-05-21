import React, { useState } from 'react';
import { Plus, Search, User, Phone, Mail, CreditCard as Edit, Trash2, TrendingUp, Gift } from 'lucide-react';
import { formatCurrency } from '../constants/currency';

interface Customer {
  id: string;
  name: string;
  email?: string;
  phone: string;
  loyaltyPoints: number;
  totalOrders: number;
  totalSpent: number;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
}

const mockCustomers: Customer[] = [
  { id: '1', name: 'James Anderson', email: 'james@email.com', phone: '+1-555-1001', loyaltyPoints: 2850, totalOrders: 47, totalSpent: 1823.50, tier: 'gold' },
  { id: '2', name: 'Sophie Martinez', email: 'sophie@email.com', phone: '+1-555-1002', loyaltyPoints: 5200, totalOrders: 89, totalSpent: 3412.00, tier: 'platinum' },
];

const tierConfig = {
  bronze: { label: 'Bronze', color: 'bg-amber-100 text-amber-800 border-amber-200' },
  silver: { label: 'Silver', color: 'bg-gray-100 text-gray-700 border-gray-300' },
  gold: { label: 'Gold', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  platinum: { label: 'Platinum', color: 'bg-blue-100 text-blue-800 border-blue-200' },
};

export function Customers() {
  const [customers, setCustomers] = useState<Customer[]>(mockCustomers);
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = customers.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone.includes(searchTerm) ||
      (c.email || '').toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const totalRevenue = customers.reduce((sum, c) => sum + c.totalSpent, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customer Management</h1>
          <p className="text-gray-600">Manage customer profiles, loyalty points, and preferences</p>
        </div>
        <button className="inline-flex items-center justify-center rounded-lg bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700">
          <Plus className="mr-2 h-4 w-4" /> Add Customer
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Total Customers', value: customers.length, icon: <User className="h-6 w-6 text-blue-600" />, bg: 'bg-blue-50' },
          { label: 'Total Revenue', value: formatCurrency(totalRevenue), icon: <TrendingUp className="h-6 w-6 text-green-600" />, bg: 'bg-green-50' },
          { label: 'Platinum Members', value: customers.filter(c => c.tier === 'platinum').length, icon: <Gift className="h-6 w-6 text-blue-600" />, bg: 'bg-blue-50' },
        ].map((stat, i) => (
          <div key={i} className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
              <div className={`rounded-lg p-3 ${stat.bg}`}>{stat.icon}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input type="text" placeholder="Search customers..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map(customer => {
          const cfg = tierConfig[customer.tier];
          return (
            <div key={customer.id} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center">
                    <span className="text-base font-bold text-orange-700">{customer.name.split(' ').map(n => n[0]).join('')}</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{customer.name}</h3>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${cfg.color}`}>{tierConfig[customer.tier].label}</span>
                  </div>
                </div>
                <div className="flex space-x-1">
                  <button className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors">
                    <Edit className="h-4 w-4" />
                  </button>
                  <button className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-1.5 mb-4">
                <div className="flex items-center text-sm text-gray-600">
                  <Phone className="h-3.5 w-3.5 mr-2 text-gray-400" />{customer.phone}
                </div>
                {customer.email && (
                  <div className="flex items-center text-sm text-gray-600">
                    <Mail className="h-3.5 w-3.5 mr-2 text-gray-400" />{customer.email}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="text-center p-2 bg-gray-50 rounded-lg">
                  <div className="text-lg font-bold text-gray-900">{customer.totalOrders}</div>
                  <div className="text-xs text-gray-500">Orders</div>
                </div>
                <div className="text-center p-2 bg-gray-50 rounded-lg">
                  <div className="text-sm font-bold text-gray-900">{formatCurrency(customer.totalSpent)}</div>
                  <div className="text-xs text-gray-500">Spent</div>
                </div>
                <div className="text-center p-2 bg-orange-50 rounded-lg">
                  <div className="text-lg font-bold text-orange-700">{customer.loyaltyPoints}</div>
                  <div className="text-xs text-orange-600">Points</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
