import React, { useState } from 'react';
import { Plus, Trash2, QrCode } from 'lucide-react';

interface TableItem {
  id: string;
  number: number;
  capacity: number;
  status: 'available' | 'reserved' | 'occupied' | 'maintenance';
}

export function Tables() {
  const [tables, setTables] = useState<TableItem[]>([
    { id: 't1', number: 1, capacity: 4, status: 'available' },
    { id: 't2', number: 2, capacity: 2, status: 'reserved' },
  ]);
  const [nextNumber, setNextNumber] = useState(3);

  const createTable = () => {
    const newTable: TableItem = { id: `t${nextNumber}`, number: nextNumber, capacity: 4, status: 'available' };
    setTables((s) => [...s, newTable]);
    setNextNumber((n) => n + 1);
  };

  const removeTable = (id: string) => setTables((s) => s.filter(t => t.id !== id));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Tables</h1>
          <p className="text-gray-600">Create and manage your restaurant tables.</p>
        </div>
        <button onClick={createTable} className="inline-flex items-center gap-2 rounded-lg bg-orange-600 px-4 py-2 text-white">
          <Plus className="w-4 h-4" /> Create Table
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {tables.map(t => (
          <div key={t.id} className="bg-white border border-gray-200 rounded-lg p-4 flex items-center justify-between">
            <div>
              <div className="text-lg font-semibold">Table {t.number}</div>
              <div className="text-sm text-gray-500">Capacity: {t.capacity}</div>
              <div className="text-sm text-gray-500">Status: {t.status}</div>
            </div>
            <div className="flex items-center gap-2">
              <button title="QR" className="p-2 rounded bg-gray-100"><QrCode className="w-5 h-5 text-gray-600" /></button>
              <button onClick={() => removeTable(t.id)} className="p-2 rounded bg-red-50 text-red-600"><Trash2 className="w-5 h-5" /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Tables;
