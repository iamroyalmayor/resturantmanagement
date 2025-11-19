import React from 'react';
import { Link } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';

export function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-6 sm:mb-8">
          <div className="mx-auto h-16 w-16 sm:h-24 sm:w-24 rounded-full bg-orange-100 flex items-center justify-center mb-4 sm:mb-6">
            <span className="text-2xl sm:text-3xl font-bold text-orange-600">404</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Page Not Found</h1>
          <p className="text-sm sm:text-base text-gray-600 px-4">The page you're looking for doesn't exist or has been moved.</p>
        </div>
        
        <div className="space-y-3">
          <Link
            to="/"
            className="inline-flex items-center justify-center w-full rounded-lg bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700 transition-colors duration-200"
          >
            <Home className="mr-2 h-4 w-4" />
            Go to Dashboard
          </Link>
          
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center justify-center w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors duration-200"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
}