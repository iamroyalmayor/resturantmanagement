import React, { useState } from 'react';
import { TrendingUp, TrendingDown, DollarSign, ShoppingCart, Users, ArrowUp, ArrowDown } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatCurrency } from '../constants/currency';

const monthlyData = [
  { month: 'Mar', revenue: 51000, orders: 830 },
  { month: 'Apr', revenue: 53000, orders: 860 },
  { month: 'May', revenue: 31600, orders: 514 },
];

export function Reports() {
  const weekRevenue = 31600;
  const revenueChange = 12.5;
  const weekOrders = 514;

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-gray-600">Performance insights and business intelligence</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Revenue', value: formatCurrency(weekRevenue), change: revenueChange, icon: <DollarSign className="h-6 w-6 text-green-600" />, bg: 'bg-green-50' },
          { label: 'Total Orders', value: weekOrders, change: 8.2, icon: <ShoppingCart className="h-6 w-6 text-blue-600" />, bg: 'bg-blue-50' },
          { label: 'Avg Order Value', value: formatCurrency(weekRevenue / weekOrders), change: 3.1, icon: <TrendingUp className="h-6 w-6 text-orange-600" />, bg: 'bg-orange-50' },
          { label: 'New Customers', value: 28, change: 15.5, icon: <Users className="h-6 w-6 text-teal-600" />, bg: 'bg-teal-50' },
        ].map((kpi, i) => (
          <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium text-gray-600">{kpi.label}</p>
              <div className={`p-2 rounded-lg ${kpi.bg}`}>{kpi.icon}</div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{kpi.value}</p>
            <div className={`flex items-center mt-2 text-sm font-medium ${kpi.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {kpi.change >= 0 ? <ArrowUp className="h-3.5 w-3.5 mr-1" /> : <ArrowDown className="h-3.5 w-3.5 mr-1" />}
              {Math.abs(kpi.change).toFixed(1)}% vs last period
            </div>
          </div>
        ))}
      </div>

      {/* Revenue Chart */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Monthly Revenue Trend</h3>
        </div>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={monthlyData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#64748B' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 12, fill: '#64748B' }} axisLine={false} tickLine={false} />
            <Tooltip />
            <Bar dataKey="revenue" name="Revenue" fill="#F97316" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
