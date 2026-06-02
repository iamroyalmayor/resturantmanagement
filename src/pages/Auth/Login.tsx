import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Mail, Lock, AlertCircle, ChefHat, Utensils } from 'lucide-react';
import { appConfig } from '../../config/app';

export function Login() {
  const navigate = useNavigate();
  const { login, isLoading, user } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      await login(email, password);
      // Redirect happens automatically based on user role in AuthContext
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    }
  };

  const fillDemoCredentials = async (demoEmail: string, demoPassword: string) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    // Auto-submit after setting credentials
    try {
      await login(demoEmail, demoPassword);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <ChefHat className="h-12 w-12 text-orange-600 mx-auto mb-3" />
          <h1 className="text-3xl font-bold text-orange-600 mb-2">{appConfig.appName}</h1>
          <p className="text-gray-600">Complete Restaurant Management Platform</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-1">Sign In</h2>
          <p className="text-sm text-gray-600 mb-6">Choose your account type</p>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  required
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold py-2 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {/* Divider */}
          <div className="my-6 flex items-center">
            <div className="flex-1 border-t border-gray-300"></div>
            <span className="px-3 text-sm text-gray-500">Demo Accounts</span>
            <div className="flex-1 border-t border-gray-300"></div>
          </div>

          {/* Demo Buttons - Staff */}
          <div className="mb-4">
            <p className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1">
              <Utensils className="w-3 h-3" /> Staff / Admin
            </p>
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => fillDemoCredentials('admin@gmail.com', 'admin1234')}
                className="w-full bg-blue-50 hover:bg-blue-100 text-blue-900 font-medium py-2 rounded-lg transition text-sm border border-blue-200"
              >
                👔 Admin (admin@gmail.com)
              </button>
              <button
                type="button"
                onClick={() => fillDemoCredentials('staff@gmail.com', 'staff1234')}
                className="w-full bg-blue-50 hover:bg-blue-100 text-blue-900 font-medium py-2 rounded-lg transition text-sm border border-blue-200"
              >
                👨‍💼 Staff (staff@gmail.com)
              </button>
            </div>
          </div>

          {/* Demo Buttons - Customer */}
          <div className="mb-6">
            <p className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1">
              <ChefHat className="w-3 h-3" /> Customer
            </p>
            <button
              type="button"
              onClick={() => fillDemoCredentials('user@gmail.com', 'user1234')}
              className="w-full bg-orange-50 hover:bg-orange-100 text-orange-900 font-medium py-2 rounded-lg transition text-sm border border-orange-200"
            >
              👤 Customer (user@gmail.com)
            </button>
          </div>

          {/* Sign Up Link */}
          <p className="text-center text-gray-600 text-sm">
            Don't have an account?{' '}
            <Link to="/auth/signup" className="text-orange-600 hover:text-orange-700 font-semibold">
              Sign Up
            </Link>
          </p>
        </div>

        {/* Footer */}
        <p className="text-center text-gray-600 text-xs mt-6">
          Frontend demo only • No real authentication • Mock data
        </p>
      </div>
    </div>
  );
}

