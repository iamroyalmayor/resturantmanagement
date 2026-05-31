import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';

// Public Pages
import { Home } from './pages/Public/Home';
import { PublicMenu } from './pages/Public/Menu';
import { Checkout } from './pages/Public/Checkout';
import { Reservations as PublicReservations } from './pages/Public/Reservations.tsx';
import { Login } from './pages/Auth/Login';
import { Signup } from './pages/Auth/Signup';

// Admin/Staff Pages
import { MainLayout } from './components/Layout/MainLayout';
import { Dashboard } from './pages/Dashboard';
import { Orders } from './pages/Orders';
import { Menu } from './pages/Menu';
import { Inventory } from './pages/Inventory';
import { Reservations as AdminReservations } from './pages/Reservations';
import { Staff } from './pages/Staff';
import { StaffPermissions } from './pages/StaffPermissions';
import { Tables } from './pages/Tables';
import { Customers } from './pages/Customers';
import { Reports } from './pages/Reports';
import { Accounting } from './pages/Accounting';
import { Settings } from './pages/Settings';
import { KitchenDisplay } from './pages/KitchenDisplay';
import { POS } from './pages/POS';
import { NotFound } from './pages/NotFound';
import { CustomerDashboard } from './pages/Customer/CustomerDashboard';
import { Conversations } from './pages/Conversations/Conversations';
import { AuthProvider } from './contexts/AuthContext';

// Protected Route Component
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth/login" replace />;
  }

  // Only allow admin, manager, and kitchen staff in dashboard
  if (!['admin', 'manager', 'kitchen'].includes(user.role)) {
    return <Navigate to="/customer/dashboard" replace />;
  }

  return <>{children}</>;
}

// Customer-only Route Component
function CustomerRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth/login" replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Auto-redirect authenticated users to their dashboard
  if (user && window.location.pathname === '/') {
    if (['admin', 'manager', 'kitchen'].includes(user.role)) {
      return <Navigate to="/dashboard" replace />;
    } else if (user.role === 'customer') {
      return <Navigate to="/customer/dashboard" replace />;
    }
  }

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Home />} />
      <Route path="/menu" element={<PublicMenu />} />
      <Route path="/order/checkout" element={<Checkout />} />
      <Route path="/reservations" element={<PublicReservations />} />
      <Route path="/auth/login" element={<Login />} />
      <Route path="/auth/signup" element={<Signup />} />

      {/* Admin/Staff Dashboard Routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="orders" element={<Orders />} />
        <Route path="conversations" element={<Conversations />} />
        <Route path="menu" element={<Menu />} />
        <Route path="inventory" element={<Inventory />} />
        <Route path="reservations" element={<AdminReservations />} />
        <Route path="staff" element={<Staff />} />
        <Route path="staff/permissions" element={<StaffPermissions />} />
        <Route path="tables" element={<Tables />} />
        <Route path="customers" element={<Customers />} />
        <Route path="reports" element={<Reports />} />
        <Route path="accounting" element={<Accounting />} />
        <Route path="settings" element={<Settings />} />
        <Route path="kitchen" element={<KitchenDisplay />} />
        <Route path="pos" element={<POS />} />
      </Route>

      {/* Customer Dashboard Routes */}
      <Route path="/customer/dashboard" element={<CustomerRoute><CustomerDashboard /></CustomerRoute>} />

      {/* Fallback */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
}

export default App;