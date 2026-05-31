import React, { useState, useEffect, createContext, useContext, useCallback } from 'react';
import type { User } from '../types';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  signup: (email: string, password: string, name: string) => Promise<void>;
  hasRole: (role: User['role'] | User['role'][]) => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

const STORAGE_KEY = 'restaurantos-auth';
const USERS_STORAGE_KEY = 'restaurantos-users';

// Demo users with the exact emails and passwords specified
const DEMO_USERS: Record<string, { email: string; password: string; name: string; role: User['role']; avatar?: string }> = {
  'admin@gmail.com': {
    email: 'admin@gmail.com',
    password: 'admin1234',
    name: 'Admin User',
    role: 'admin',
    avatar: 'https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2',
  },
  'staff@gmail.com': {
    email: 'staff@gmail.com',
    password: 'staff1234',
    name: 'Staff Member',
    role: 'manager',
    avatar: 'https://images.pexels.com/photos/1181617/pexels-photo-1181617.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2',
  },
  'user@gmail.com': {
    email: 'user@gmail.com',
    password: 'user1234',
    name: 'Customer User',
    role: 'customer',
    avatar: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2',
  },
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load user from localStorage on mount
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

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    // Simulate API delay
    await new Promise(r => setTimeout(r, 800));
    
    // Check demo users
    const demoUser = DEMO_USERS[email];
    if (demoUser && demoUser.password === password) {
      const user: User = {
        id: email.split('@')[0],
        name: demoUser.name,
        email: demoUser.email,
        role: demoUser.role,
        avatar: demoUser.avatar,
        isActive: true,
        createdAt: new Date(),
      };
      setUser(user);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
      setIsLoading(false);
      return;
    }

    // Check registered users
    const users = JSON.parse(localStorage.getItem(USERS_STORAGE_KEY) || '{}');
    const registered = users[email];
    if (registered && registered.password === password) {
      const user: User = {
        id: registered.id,
        name: registered.name,
        email: registered.email,
        role: registered.role,
        isActive: true,
        createdAt: new Date(registered.createdAt),
      };
      setUser(user);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
      setIsLoading(false);
      return;
    }

    setIsLoading(false);
    throw new Error('Invalid email or password');
  }, []);

  const signup = useCallback(async (email: string, password: string, name: string) => {
    setIsLoading(true);
    // Simulate API delay
    await new Promise(r => setTimeout(r, 800));

    // Check if user already exists
    if (DEMO_USERS[email]) {
      setIsLoading(false);
      throw new Error('Email already registered');
    }

    const users = JSON.parse(localStorage.getItem(USERS_STORAGE_KEY) || '{}');
    if (users[email]) {
      setIsLoading(false);
      throw new Error('Email already registered');
    }

    // Create new user
    const newUser: User = {
      id: Date.now().toString(),
      name: name || email.split('@')[0],
      email,
      role: 'customer',
      isActive: true,
      createdAt: new Date(),
    };

    users[email] = {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      password,
      role: newUser.role,
      createdAt: newUser.createdAt.toISOString(),
    };

    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
    setUser(newUser);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newUser));
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
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, logout, signup, hasRole }}>
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
