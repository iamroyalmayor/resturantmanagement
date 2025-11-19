import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from './components/Layout/MainLayout';
import { Dashboard } from './pages/Dashboard';
import { Orders } from './pages/Orders';
import { Menu } from './pages/Menu';
import { Inventory } from './pages/Inventory';
import { NotFound } from './pages/NotFound';
import { AuthContext, useAuthProvider } from './hooks/useAuth';

// Mock authentication wrapper
function AuthProvider({ children }: { children: React.ReactNode }) {
  const auth = useAuthProvider();
  
  React.useEffect(() => {
    // Auto-login for demo purposes
    if (!auth.user && !auth.isLoading) {
      auth.login('admin@restaurant.com', 'password');
    }
  }, [auth]);

  if (auth.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<MainLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="orders" element={<Orders />} />
            <Route path="menu" element={<Menu />} />
            <Route path="inventory" element={<Inventory />} />
            <Route path="reservations" element={<div className="p-8 text-center text-gray-500">Reservations - Coming Soon</div>} />
            <Route path="staff" element={<div className="p-8 text-center text-gray-500">Staff Management - Coming Soon</div>} />
            <Route path="customers" element={<div className="p-8 text-center text-gray-500">Customer Management - Coming Soon</div>} />
            <Route path="reports" element={<div className="p-8 text-center text-gray-500">Reports & Analytics - Coming Soon</div>} />
            <Route path="settings" element={<div className="p-8 text-center text-gray-500">Settings - Coming Soon</div>} />
            <Route path="kitchen" element={<div className="p-8 text-center text-gray-500">Kitchen Display System - Coming Soon</div>} />
            <Route path="pos" element={<div className="p-8 text-center text-gray-500">POS System - Coming Soon</div>} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;