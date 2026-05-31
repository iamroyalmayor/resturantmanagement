import React from 'react';
import { DollarSign, CreditCard, BarChart3, TrendingUp } from 'lucide-react';
import { formatCurrency } from '../constants/currency';

const metrics = [
  { title: 'Cash Flow', value: 58240, icon: DollarSign, color: 'bg-green-50 text-green-700' },
  { title: 'Receivables', value: 12980, icon: CreditCard, color: 'bg-blue-50 text-blue-700' },
  { title: 'Profit', value: 21450, icon: TrendingUp, color: 'bg-orange-50 text-orange-700' },
];

const recentTransactions = [
  { id: 'txn-1', description: 'Online order payment', amount: 86.5, type: 'income', date: 'May 29' },
  { id: 'txn-2', description: 'Supplier invoice', amount: -430, type: 'expense', date: 'May 28' },
  { id: 'txn-3', description: 'POS cash deposit', amount: 195, type: 'income', date: 'May 28' },
  { id: 'txn-4', description: 'Credit card batch', amount: 475.75, type: 'income', date: 'May 27' },
];

export function Accounting() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Accounting</h1>
          <p className="text-gray-600">ERP financial overview for restaurant operations.</p>
        </div>
        <button className="inline-flex items-center rounded-lg bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700">
          <CreditCard className="mr-2 h-4 w-4" /> New Ledger Entry
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {metrics.map((metric) => (
          <div key={metric.title} className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div className="rounded-2xl p-3 text-white bg-orange-500">
                <metric.icon className="h-5 w-5" />
              </div>
              <p className="text-sm font-medium text-gray-500">{metric.title}</p>
            </div>
            <p className={`mt-6 text-3xl font-semibold ${metric.color}`}>{formatCurrency(metric.value)}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Recent Transactions</h2>
              <p className="text-sm text-gray-500">Track the latest inflows and outflows.</p>
            </div>
            <button className="rounded-lg bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200">
              View All
            </button>
          </div>
          <div className="space-y-3">
            {recentTransactions.map((transaction) => (
              <div key={transaction.id} className="flex items-center justify-between rounded-3xl border border-gray-100 bg-gray-50 p-4">
                <div>
                  <p className="font-semibold text-gray-900">{transaction.description}</p>
                  <p className="text-sm text-gray-500">{transaction.date}</p>
                </div>
                <p className={`font-semibold ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                  {transaction.type === 'income' ? '+' : '-'}{formatCurrency(Math.abs(transaction.amount))}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Ledger Snapshot</h2>
          <div className="space-y-4">
            <div className="rounded-2xl bg-gray-50 p-4">
              <p className="text-sm text-gray-500">Accounts Payable</p>
              <p className="mt-2 text-xl font-semibold text-gray-900">{formatCurrency(8340)}</p>
            </div>
            <div className="rounded-2xl bg-gray-50 p-4">
              <p className="text-sm text-gray-500">Accounts Receivable</p>
              <p className="mt-2 text-xl font-semibold text-gray-900">{formatCurrency(12640)}</p>
            </div>
            <div className="rounded-2xl bg-gray-50 p-4">
              <p className="text-sm text-gray-500">Net Cash Position</p>
              <p className="mt-2 text-xl font-semibold text-gray-900">{formatCurrency(42800)}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
