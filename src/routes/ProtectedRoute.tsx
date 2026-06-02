import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import type { User } from '../types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: User['role'][];
}

export function ProtectedRoute({ children, requiredRoles }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, hasRole } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" replace />;
  }

  if (requiredRoles && !hasRole(requiredRoles)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">You don't have permission to view this page.</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

export function StaffOnlyRoute({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute requiredRoles={['admin', 'manager', 'kitchen', 'waiter']}>
      {children}
    </ProtectedRoute>
  );
}

export function CustomerOnlyRoute({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute requiredRoles={['customer']}>
      {children}
    </ProtectedRoute>
  );
}
