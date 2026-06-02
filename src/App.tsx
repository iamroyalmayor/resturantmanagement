import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { appConfig } from './config/app';

// Public Pages
import { Home } from './pages/Public/Home';
import { PublicMenu } from './pages/Public/Menu';
import { Checkout } from './pages/Public/Checkout';
import { Reservations as PublicReservations } from './pages/Public/Reservations';
import { Login } from './pages/Auth/Login';
import { Signup } from './pages/Auth/Signup';

// Layouts
import { MainLayout } from './components/Layout/MainLayout';
import { CustomerLayout } from './components/Layout/CustomerLayout';

// Admin/Staff Pages
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

// Customer Pages
import { CustomerHome } from './pages/Customer/Home';
import { CustomerDashboard } from './pages/Customer/CustomerDashboard';

// Other
import { Conversations } from './pages/Conversations/Conversations';
import { NotFound } from './pages/NotFound';
import { AuthProvider } from './contexts/AuthContext';

// Protected Route Components
function StaffRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || !['admin', 'manager', 'kitchen', 'waiter'].includes(user.role)) {
    return <Navigate to="/auth/login" replace />;
  }

  return <>{children}</>;
}

function CustomerRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== 'customer') {
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
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Auto-redirect authenticated users
  if (user && window.location.pathname === '/') {
    if (user.role === 'customer') {
      return <Navigate to="/customer" replace />;
    } else if (['admin', 'manager', 'kitchen', 'waiter'].includes(user.role)) {
      return <Navigate to="/operations" replace />;
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

      {/* Staff/Admin Routes */}
      <Route
        path="/operations"
        element={
          <StaffRoute>
            <MainLayout />
          </StaffRoute>
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

      {/* Customer Routes */}
      <Route
        path="/customer"
        element={
          <CustomerRoute>
            <CustomerLayout />
          </CustomerRoute>
        }
      >
        <Route index element={<CustomerHome />} />
        <Route path="menu" element={<PublicMenu />} />
        <Route path="reservations" element={<PublicReservations />} />
        <Route path="orders" element={<CustomerDashboard />} />
        <Route path="profile" element={<CustomerDashboard />} />
        <Route path="loyalty" element={<CustomerDashboard />} />
        <Route path="cart" element={<Checkout />} />
      </Route>

      {/* Fallback for old routes */}
      <Route path="/dashboard" element={<Navigate to="/operations" replace />} />
      <Route path="/customer/dashboard" element={<Navigate to="/customer" replace />} />

      {/* 404 */}
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
