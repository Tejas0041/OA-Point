import React from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, RefreshCw, LogIn } from 'lucide-react';

const AuthError = ({ error, onRetry }) => {
  const isSessionExpired = error?.includes('expired') || error?.includes('session');
  const isLoginRequired = error?.includes('log in') || error?.includes('Login');

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-6">
          <AlertCircle className="h-8 w-8 text-red-600" />
        </div>
        
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          {isSessionExpired ? 'Session Expired' : isLoginRequired ? 'Login Required' : 'Authentication Error'}
        </h2>
        
        <p className="text-gray-600 mb-6">
          {error || 'There was an issue with your authentication. Please try logging in again.'}
        </p>

        <div className="space-y-4">
          <Link
            to="/login"
            className="w-full btn-primary flex items-center justify-center space-x-2"
          >
            <LogIn className="h-5 w-5" />
            <span>Go to Login</span>
          </Link>
          
          {onRetry && (
            <button
              onClick={onRetry}
              className="w-full btn-secondary flex items-center justify-center space-x-2"
            >
              <RefreshCw className="h-5 w-5" />
              <span>Try Again</span>
            </button>
          )}
        </div>

        <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h4 className="text-sm font-medium text-blue-800 mb-2">What happened?</h4>
          <ul className="text-sm text-blue-700 space-y-1 text-left">
            {isSessionExpired && (
              <>
                <li>• Your login session has expired (sessions last 24 hours)</li>
                <li>• You need to log in again to continue</li>
              </>
            )}
            {isLoginRequired && (
              <>
                <li>• You need to be logged in to access this page</li>
                <li>• Please log in with your student credentials</li>
              </>
            )}
            <li>• Make sure you're using the correct email and password</li>
            <li>• Contact your administrator if you continue having issues</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AuthError;