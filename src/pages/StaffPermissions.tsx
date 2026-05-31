import React, { useState } from 'react';
import { Check, UserPlus } from 'lucide-react';

type Permission = 'pos' | 'conversations' | 'kitchen' | 'inventory' | 'reports';

interface StaffPerm {
  id: string;
  name: string;
  permissions: Permission[];
}

const mock: StaffPerm[] = [
  { id: '1', name: 'Alice Johnson', permissions: ['pos', 'conversations', 'reports'] },
  { id: '2', name: 'Bob Wilson', permissions: ['kitchen'] },
];

export function StaffPermissions() {
  const [list, setList] = useState<StaffPerm[]>(mock);

  const togglePermission = (id: string, perm: Permission) => {
    setList((prev) =>
      prev.map((s) => {
        if (s.id !== id) return s;
        const has = s.permissions.includes(perm);
        return { ...s, permissions: has ? s.permissions.filter(p => p !== perm) : [...s.permissions, perm] };
      }),
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Staff Permissions</h1>
        <p className="text-gray-600">Assign module access to staff members.</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-4">
        {list.map((s) => (
          <div key={s.id} className="flex items-center justify-between">
            <div>
              <div className="font-medium text-gray-900">{s.name}</div>
              <div className="text-sm text-gray-500">Permissions: {s.permissions.join(', ') || 'None'}</div>
            </div>
            <div className="flex items-center gap-2">
              {(['pos', 'conversations', 'kitchen', 'inventory', 'reports'] as Permission[]).map((p) => (
                <button
                  key={p}
                  onClick={() => togglePermission(s.id, p)}
                  className={`px-3 py-1 rounded-full text-sm ${s.permissions.includes(p) ? 'bg-orange-600 text-white' : 'bg-gray-100 text-gray-700'}`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default StaffPermissions;
