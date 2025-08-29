import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Home, ArrowLeft, Search, AlertCircle } from 'lucide-react';

const NotFound = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Determine home route based on user role
  const getHomeRoute = () => {
    if (!user) return '/login';
    return user.role === 'admin' ? '/admin/dashboard' : '/student/dashboard';
  };

  const getHomeLabel = () => {
    if (!user) return 'Login';
    return user.role === 'admin' ? 'Admin Dashboard' : 'Student Dashboard';
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {/* 404 Illustration */}
        <div className="mb-8">
          <div className="mx-auto w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <AlertCircle className="h-12 w-12 text-red-600" />
          </div>
          <h1 className="text-6xl font-bold text-gray-900 mb-2">404</h1>
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">Page Not Found</h2>
        </div>

        {/* Error Message */}
        <div className="mb-8">
          <p className="text-gray-600 mb-4">
            Sorry, the page you are looking for doesn't exist or has been moved.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-start space-x-3">
              <Search className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="text-left">
                <h3 className="text-sm font-medium text-blue-800 mb-1">What you can do:</h3>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Check the URL for typos</li>
                  <li>• Go back to the previous page</li>
                  <li>• Visit your dashboard</li>
                  <li>• Contact support if you think this is an error</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-4">
          <Link
            to={getHomeRoute()}
            className="w-full inline-flex items-center justify-center space-x-2 bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg transition-colors"
          >
            <Home className="h-5 w-5" />
            <span>Go to {getHomeLabel()}</span>
          </Link>

          <button
            onClick={() => navigate(-1)}
            className="w-full inline-flex items-center justify-center space-x-2 bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Go Back</span>
          </button>

          {user && (
            <div className="pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600 mb-3">Quick Links:</p>
              <div className="space-y-2">
                {user.role === 'admin' ? (
                  <>
                    <Link
                      to="/admin/dashboard"
                      className="block text-sm text-blue-600 hover:text-blue-800"
                    >
                      Admin Dashboard
                    </Link>
                    <Link
                      to="/admin/tests"
                      className="block text-sm text-blue-600 hover:text-blue-800"
                    >
                      Manage Tests
                    </Link>
                    <Link
                      to="/admin/students"
                      className="block text-sm text-blue-600 hover:text-blue-800"
                    >
                      Manage Students
                    </Link>
                  </>
                ) : (
                  <>
                    <Link
                      to="/student/dashboard"
                      className="block text-sm text-blue-600 hover:text-blue-800"
                    >
                      Student Dashboard
                    </Link>
                    <Link
                      to="/student/profile"
                      className="block text-sm text-blue-600 hover:text-blue-800"
                    >
                      My Profile
                    </Link>
                    <Link
                      to="/student/help"
                      className="block text-sm text-blue-600 hover:text-blue-800"
                    >
                      Help & Support
                    </Link>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            If you believe this is an error, please contact your administrator.
          </p>
        </div>
      </div>
    </div>
  );
};

export default NotFound;