import React, { useState } from 'react';
import { Plus, Search, User, Phone, Mail, CreditCard as Edit, Trash2, Clock, CheckCircle, Star } from 'lucide-react';

type StaffRole = 'manager' | 'waiter' | 'kitchen' | 'host' | 'bartender' | 'cashier';

interface StaffMember {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: StaffRole;
  hoursThisWeek: number;
  rating: number;
}

const mockStaff: StaffMember[] = [
  { id: '1', name: 'Alice Johnson', email: 'alice@restaurant.com', phone: '+1-555-0101', role: 'manager', hoursThisWeek: 42, rating: 4.9 },
  { id: '2', name: 'Bob Wilson', email: 'bob@restaurant.com', phone: '+1-555-0102', role: 'waiter', hoursThisWeek: 35, rating: 4.7 },
];

const roleConfig: Record<StaffRole, { label: string; color: string }> = {
  manager: { label: 'Manager', color: 'bg-blue-100 text-blue-800' },
  waiter: { label: 'Waiter', color: 'bg-green-100 text-green-800' },
  kitchen: { label: 'Kitchen', color: 'bg-orange-100 text-orange-800' },
  host: { label: 'Host', color: 'bg-teal-100 text-teal-800' },
  bartender: { label: 'Bartender', color: 'bg-amber-100 text-amber-800' },
  cashier: { label: 'Cashier', color: 'bg-gray-100 text-gray-800' },
};

export function Staff() {
  const [staffList, setStaffList] = useState<StaffMember[]>(mockStaff);
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = staffList.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Staff Management</h1>
          <p className="text-gray-600">Manage your team, schedules, and performance</p>
        </div>
        <button className="inline-flex items-center justify-center rounded-lg bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700">
          <Plus className="mr-2 h-4 w-4" /> Add Staff Member
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input type="text" placeholder="Search staff..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500" />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Employee', 'Role', 'Hours/Week', 'Rating', 'Actions'].map(col => (
                  <th key={col} className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">{col}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(member => (
                <tr key={member.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-4">
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-medium text-orange-700">{member.name.split(' ').map(n => n[0]).join('')}</span>
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{member.name}</div>
                        <div className="flex items-center text-sm text-gray-500">
                          <Mail className="h-3 w-3 mr-1" />{member.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${roleConfig[member.role].color}`}>{roleConfig[member.role].label}</span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center text-sm text-gray-900">
                      <Clock className="h-4 w-4 mr-1 text-gray-400" />{member.hoursThisWeek}h
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-900">{member.rating.toFixed(1)}/5.0</td>
                  <td className="px-4 py-4">
                    <div className="flex items-center space-x-1">
                      <button className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors">
                        <Edit className="h-4 w-4" />
                      </button>
                      <button className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
