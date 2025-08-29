import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { API_ENDPOINTS } from '../../config/api';
import { formatDate } from '../../utils/dateUtils';
import axios from 'axios';
import toast from 'react-hot-toast';
import { 
  Plus, 
  FileText, 
  Users, 
  Calendar, 
  BarChart3, 
  LogOut,
  Eye,
  Edit,
  Trash2,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';
import Footer from '../Common/Footer';

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const [tests, setTests] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalTests: 0,
    activeTests: 0,
    totalStudents: 0,
    completedAttempts: 0
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [testsRes, studentsRes] = await Promise.all([
        axios.get(API_ENDPOINTS.ADMIN_TESTS),
        axios.get(API_ENDPOINTS.ADMIN_STUDENTS)
      ]);

      setTests(testsRes.data.tests);
      setStudents(studentsRes.data.students);

      // Calculate stats
      const totalTests = testsRes.data.tests.length;
      const activeTests = testsRes.data.tests.filter(test => test.isActive).length;
      const totalStudents = studentsRes.data.students.length;

      setStats({
        totalTests,
        activeTests,
        totalStudents,
        completedAttempts: 0 // This would come from test attempts
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const toggleTestStatus = async (testId, currentStatus) => {
    try {
      await axios.patch(API_ENDPOINTS.ADMIN_TEST_TOGGLE_STATUS(testId));
      toast.success(`Test ${currentStatus ? 'deactivated' : 'activated'} successfully`);
      fetchDashboardData();
    } catch (error) {
      console.error('Error toggling test status:', error);
      toast.error('Failed to update test status');
    }
  };

  const deleteTest = async (testId) => {
    if (!window.confirm('Are you sure you want to delete this test? This action cannot be undone.')) {
      return;
    }

    try {
      await axios.delete(API_ENDPOINTS.ADMIN_TEST_DELETE(testId));
      toast.success('Test deleted successfully');
      fetchDashboardData();
    } catch (error) {
      console.error('Error deleting test:', error);
      toast.error('Failed to delete test');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <img 
                src="/images/logo_oa_point.webp" 
                alt="OA Point Logo" 
                className="h-14 w-14 object-contain"
                style={{ mixBlendMode: 'multiply' }}
              />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  <span className="text-primary-600">OA Point</span> Admin
                </h1>
                <p className="text-gray-600">Welcome back, {user.name}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                to="/admin/create-test"
                className="btn-primary flex items-center space-x-2"
              >
                <Plus className="h-5 w-5" />
                <span>Create Test</span>
              </Link>
              <Link
                to="/admin/students"
                className="btn-secondary flex items-center space-x-2"
              >
                <Users className="h-5 w-5" />
                <span>Manage Students</span>
              </Link>
              <button
                onClick={logout}
                className="btn-secondary flex items-center space-x-2"
              >
                <LogOut className="h-5 w-5" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Admin Guide */}
        <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">
                Admin Guide: How to Assign Tests to Students
              </h3>
              <div className="mt-2 text-sm text-blue-700">
                <p><strong>Step 1:</strong> Create a test and add questions</p>
                <p><strong>Step 2:</strong> Click "Activate" to make the test available</p>
                <p><strong>Step 3:</strong> Go to "Test Details" to send invitations to specific students</p>
                <p><strong>Note:</strong> When you activate a test, all students are automatically added. Use "Test Details" to customize student access.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="card">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Tests</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalTests}</p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <Calendar className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Tests</p>
                <p className="text-2xl font-bold text-gray-900">{stats.activeTests}</p>
              </div>
            </div>
          </div>

          <Link to="/admin/students" className="card hover:shadow-lg transition-shadow cursor-pointer">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Students</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalStudents}</p>
                <p className="text-xs text-purple-600 mt-1">Click to manage →</p>
              </div>
            </div>
          </Link>

          <div className="card">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <BarChart3 className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-gray-900">{stats.completedAttempts}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tests Table */}
        <div className="card">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Your Tests</h2>
            <Link
              to="/admin/create-test"
              className="btn-primary flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>New Test</span>
            </Link>
          </div>

          {tests.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No tests</h3>
              <p className="mt-1 text-sm text-gray-500">Get started by creating a new test.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Test Details
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Schedule
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {tests.map((test) => (
                    <tr key={test._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{test.title}</div>
                          <div className="text-sm text-gray-500">{test.description}</div>
                          <div className="text-xs text-gray-400 mt-1">
                            {test.sections.length} sections • {test.duration} minutes
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {formatDate(test.startDate, 'dd/mm/yyyy')} - {formatDate(test.endDate, 'dd/mm/yyyy')}
                        </div>
                        <div className="text-sm text-gray-500">
                          {formatDate(test.startDate, 'dd/mm/yyyy hh:mm')} - {formatDate(test.endDate, 'dd/mm/yyyy hh:mm')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          test.isActive 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {test.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <Link
                            to={`/admin/test/${test._id}`}
                            className="text-primary-600 hover:text-primary-900"
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </Link>
                          <Link
                            to={`/admin/edit-test/${test._id}`}
                            className="text-orange-600 hover:text-orange-900"
                            title="Edit Test"
                          >
                            <Edit className="h-4 w-4" />
                          </Link>
                          <Link
                            to={`/admin/test/${test._id}/results`}
                            className="text-green-600 hover:text-green-900"
                            title="View Results"
                          >
                            <BarChart3 className="h-4 w-4" />
                          </Link>
                          <button
                            onClick={() => toggleTestStatus(test._id, test.isActive)}
                            className="text-blue-600 hover:text-blue-900"
                            title={test.isActive ? 'Deactivate' : 'Activate'}
                          >
                            {test.isActive ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
                          </button>
                          <button
                            onClick={() => deleteTest(test._id)}
                            className="text-red-600 hover:text-red-900"
                            title="Delete Test"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Help & Support */}
        <div className="card mt-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Need Help?</h3>
          <div className="space-y-3 text-sm text-gray-600">
            <div className="flex items-start">
              <div className="w-2 h-2 bg-primary-600 rounded-full mt-2 mr-3 flex-shrink-0"></div>
              <p>If you need assistance with creating tests, managing students, or any other administrative tasks, please contact our support team.</p>
            </div>
            <div className="flex items-start">
              <div className="w-2 h-2 bg-primary-600 rounded-full mt-2 mr-3 flex-shrink-0"></div>
              <p><strong>Support Email:</strong> <a href="mailto:onlineassessment.point@gmail.com" className="text-primary-600 hover:text-primary-800">onlineassessment.point@gmail.com</a></p>
            </div>
            <div className="flex items-start">
              <div className="w-2 h-2 bg-primary-600 rounded-full mt-2 mr-3 flex-shrink-0"></div>
              <p>We provide comprehensive support for test creation, student management, and platform usage.</p>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default AdminDashboard;