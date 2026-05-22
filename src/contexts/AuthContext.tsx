import React, { useState, useEffect, createContext, useContext, useCallback } from 'react';
import type { User } from '../types';
import { appConfig } from '../config/app';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  hasRole: (role: User['role'] | User['role'][]) => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

const STORAGE_KEY = 'restaurantos-auth';

const DEMO_USERS: Record<string, User> = {
  [appConfig.supportEmail]: {
    id: '1',
    name: 'Admin User',
    email: appConfig.supportEmail,
    role: 'admin',
    avatar: 'https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2',
    isActive: true,
    createdAt: new Date('2022-01-01'),
  },
  [`manager@${appConfig.domain.replace(/https?:\/\//, '').split('.')[0]}.com`]: {
    id: '2',
    name: 'Manager User',
    email: `manager@${appConfig.domain.replace(/https?:\/\//, '').split('.')[0]}.com`,
    role: 'manager',
    isActive: true,
    createdAt: new Date('2022-06-01'),
  },
  [`kitchen@${appConfig.domain.replace(/https?:\/\//, '').split('.')[0]}.com`]: {
    id: '3',
    name: 'Kitchen Staff',
    email: `kitchen@${appConfig.domain.replace(/https?:\/\//, '').split('.')[0]}.com`,
    role: 'kitchen',
    isActive: true,
    createdAt: new Date('2023-01-01'),
  },
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setUser({ ...parsed, createdAt: new Date(parsed.createdAt) });
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (!user && !isLoading) {
      const demoUser = DEMO_USERS[appConfig.supportEmail];
      setUser(demoUser);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(demoUser));
    }
  }, [user, isLoading]);

  const login = useCallback(async (email: string, _password: string) => {
    setIsLoading(true);
    await new Promise(r => setTimeout(r, 500));
    const matched = DEMO_USERS[email];
    if (matched) {
      setUser(matched);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(matched));
    } else {
      const newUser: User = {
        id: Date.now().toString(),
        name: email.split('@')[0],
        email,
        role: 'waiter',
        isActive: true,
        createdAt: new Date(),
      };
      setUser(newUser);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newUser));
    }
    setIsLoading(false);
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const hasRole = useCallback((role: User['role'] | User['role'][]) => {
    if (!user) return false;
    const roles = Array.isArray(role) ? role : [role];
    return roles.includes(user.role);
  }, [user]);

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

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, logout, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
