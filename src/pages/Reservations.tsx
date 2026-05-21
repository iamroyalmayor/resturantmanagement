import React, { useState } from 'react';
import { Plus, Search, Calendar, Clock, Users, Phone, Mail, CheckCircle, XCircle, AlertCircle, CreditCard as Edit, Trash2 } from 'lucide-react';
import { formatCurrency } from '../constants/currency';

type ReservationStatus = 'confirmed' | 'seated' | 'completed' | 'cancelled' | 'no-show';

interface Reservation {
  id: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  tableNumber: number;
  date: string;
  time: string;
  partySize: number;
  status: ReservationStatus;
  specialRequests?: string;
  createdAt: Date;
}

const mockReservations: Reservation[] = [
  { id: '1', customerName: 'Alice Morgan', customerPhone: '+1-555-0201', customerEmail: 'alice@email.com', tableNumber: 3, date: '2026-05-20', time: '19:00', partySize: 4, status: 'confirmed', specialRequests: 'Window seat preferred', createdAt: new Date() },
  { id: '2', customerName: 'Bob Carter', customerPhone: '+1-555-0202', tableNumber: 7, date: '2026-05-20', time: '20:30', partySize: 2, status: 'confirmed', createdAt: new Date() },
];

const statusConfig: Record<ReservationStatus, { label: string; color: string; icon: React.ReactNode }> = {
  confirmed: { label: 'Confirmed', color: 'bg-blue-100 text-blue-800', icon: <CheckCircle className="h-3 w-3" /> },
  seated: { label: 'Seated', color: 'bg-green-100 text-green-800', icon: <CheckCircle className="h-3 w-3" /> },
  completed: { label: 'Completed', color: 'bg-gray-100 text-gray-800', icon: <CheckCircle className="h-3 w-3" /> },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-800', icon: <XCircle className="h-3 w-3" /> },
  'no-show': { label: 'No Show', color: 'bg-orange-100 text-orange-800', icon: <AlertCircle className="h-3 w-3" /> },
};

export function Reservations() {
  const [reservations, setReservations] = useState<Reservation[]>(mockReservations);
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = reservations.filter(r => {
    const matchesSearch = r.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.customerPhone.includes(searchTerm);
    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reservations</h1>
          <p className="text-gray-600">Manage table bookings and guest reservations</p>
        </div>
        <button className="inline-flex items-center justify-center rounded-lg bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700">
          <Plus className="mr-2 h-4 w-4" /> New Reservation
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Search reservations..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Guest', 'Date & Time', 'Table', 'Party', 'Status', 'Actions'].map(col => (
                  <th key={col} className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">{col}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(reservation => {
                const cfg = statusConfig[reservation.status];
                return (
                  <tr key={reservation.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-4">
                      <div className="font-medium text-gray-900">{reservation.customerName}</div>
                      <div className="flex items-center text-sm text-gray-500 mt-1">
                        <Phone className="h-3 w-3 mr-1" />{reservation.customerPhone}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center text-sm font-medium text-gray-900">
                        <Calendar className="h-4 w-4 mr-1 text-gray-400" />
                        {new Date(reservation.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </div>
                      <div className="flex items-center text-sm text-gray-500 mt-1">
                        <Clock className="h-3 w-3 mr-1" />{reservation.time}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm font-medium text-gray-900">Table {reservation.tableNumber}</td>
                    <td className="px-4 py-4">
                      <div className="flex items-center text-sm text-gray-900">
                        <Users className="h-4 w-4 mr-1 text-gray-400" />{reservation.partySize}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${cfg.color}`}>
                        {cfg.icon}{cfg.label}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center space-x-2">
                        <button className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors">
                          <Edit className="h-4 w-4" />
                        </button>
                        <button className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
