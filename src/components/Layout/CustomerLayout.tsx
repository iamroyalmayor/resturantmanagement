import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { CustomerHeader } from './CustomerHeader';

export function CustomerLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <CustomerHeader onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} />
      <main className="flex-1 overflow-auto">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
