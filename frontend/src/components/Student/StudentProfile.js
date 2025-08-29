import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_ENDPOINTS } from '../../config/api';
import { formatDate } from '../../utils/dateUtils';
import toast from 'react-hot-toast';
import { 
  User, 
  Clock, 
  Calendar, 
  BookOpen, 
  Percent, 
  Award, 
  ArrowLeft,
  Mail,
  Phone,
  Hash,
  Edit3,
  Save,
  X
} from 'lucide-react';

const StudentProfile = () => {
  const { user, updateProfile } = useAuth();
  const navigate = useNavigate();
  const [testHistory, setTestHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    phone: ''
  });
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    toAttempt: 0,
    missed: 0,
    avgScore: 0
  });

  const fetchTestHistory = useCallback(async () => {
    if (!user?._id) {
      setLoading(false);
      return;
    }

    try {
      // Fetch both statistics and test history
      console.log('Fetching statistics and test history...');
      const [statsResponse, historyResponse] = await Promise.all([
        axios.get(API_ENDPOINTS.STUDENT_STATISTICS),
        axios.get(API_ENDPOINTS.STUDENT_TEST_HISTORY)
      ]);
      
      console.log('Statistics response:', statsResponse.data);
      console.log('History response:', historyResponse.data);
      
      const tests = historyResponse.data.registeredTests || [];
      setTestHistory(tests);
      
      // Use the calculated statistics from backend
      const statistics = statsResponse.data.statistics;
      console.log('Setting stats:', statistics);
      console.log('Raw statistics object:', JSON.stringify(statistics, null, 2));
      
      // Ensure we have valid statistics
      const validStats = {
        total: statistics?.totalTests || 0,
        completed: statistics?.completedTests || 0,
        toAttempt: statistics?.toAttemptTests || 0,
        missed: statistics?.missedTests || 0,
        avgScore: statistics?.averageScore || 0
      };
      
      console.log('Valid stats being set:', validStats);
      setStats(validStats);
    } catch (error) {
      console.error('Error fetching test data:', error);
      console.error('Error details:', error.response?.data);
      
      // Set default stats if there's an error
      setStats({
        total: 0,
        completed: 0,
        toAttempt: 0,
        missed: 0,
        avgScore: 0
      });
      
      // Don't show error toast if it's just a 404 (no history)
      if (error.response?.status !== 404) {
        toast.error('Failed to load test data');
      }
    } finally {
      setLoading(false);
    }
  }, [user?._id]);

  useEffect(() => {
    if (user) {
      setEditForm({
        name: user.name || '',
        phone: user.phone || ''
      });
      fetchTestHistory();
    }
  }, [user, fetchTestHistory]);

  // Refresh data when component becomes visible (e.g., after completing a test)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && user) {
        fetchTestHistory();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [user, fetchTestHistory]);

  const handleEditToggle = () => {
    if (isEditing) {
      // Reset form if canceling
      setEditForm({
        name: user.name || '',
        phone: user.phone || ''
      });
    }
    setIsEditing(!isEditing);
  };

  const handleSaveProfile = async () => {
    try {
      const result = await updateProfile(editForm);
      if (result.success) {
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  const handleInputChange = (e) => {
    setEditForm({
      ...editForm,
      [e.target.name]: e.target.value
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header with Back Button */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/student/dashboard')}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>Back to Dashboard</span>
            </button>
          </div>
          <div className="flex items-center space-x-3">
            <img 
              src="/images/logo_oa_point.webp" 
              alt="OA Point Logo" 
              className="h-12 w-12 object-contain"
              style={{ mixBlendMode: 'multiply' }}
            />
            <h1 className="text-2xl font-bold text-gray-900">
              <span className="text-primary-600">OA Point</span> Profile
            </h1>
          </div>
        </div>

        {/* Profile Information Card */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <div className="bg-primary-100 p-4 rounded-full">
                <User className="w-8 h-8 text-primary-600" />
              </div>
              <div>
                <h2 className="text-2xl font-semibold text-gray-900">Student Profile</h2>
                <p className="text-gray-600">Manage your account information</p>
              </div>
            </div>
            <button
              onClick={isEditing ? handleSaveProfile : handleEditToggle}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                isEditing 
                  ? 'bg-green-600 hover:bg-green-700 text-white' 
                  : 'bg-primary-600 hover:bg-primary-700 text-white'
              }`}
            >
              {isEditing ? (
                <>
                  <Save className="h-4 w-4" />
                  <span>Save Changes</span>
                </>
              ) : (
                <>
                  <Edit3 className="h-4 w-4" />
                  <span>Edit Profile</span>
                </>
              )}
            </button>
            {isEditing && (
              <button
                onClick={handleEditToggle}
                className="ml-2 flex items-center space-x-2 px-4 py-2 rounded-lg bg-gray-500 hover:bg-gray-600 text-white transition-colors"
              >
                <X className="h-4 w-4" />
                <span>Cancel</span>
              </button>
            )}
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Personal Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Personal Information</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="name"
                      value={editForm.name}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  ) : (
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-900">{user?.name || 'Not provided'}</span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                  <div className="flex items-center space-x-2">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-900">{user?.email}</span>
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">Cannot be changed</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                  {isEditing ? (
                    <input
                      type="tel"
                      name="phone"
                      value={editForm.phone}
                      onChange={handleInputChange}
                      placeholder="Enter your phone number"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  ) : (
                    <div className="flex items-center space-x-2">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-900">{user?.phone || 'Not provided'}</span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Registration Number</label>
                  <div className="flex items-center space-x-2">
                    <Hash className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-900">{user?.registrationNumber || user?.enrollmentNumber || 'Not provided'}</span>
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">Cannot be changed</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Account Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Account Information</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Account Type</label>
                  <div className="flex items-center space-x-2">
                    <Award className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-900 capitalize">{user?.role}</span>
                    <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded">Student Account</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Account Status</label>
                  <div className="flex items-center space-x-2">
                    <div className={`h-2 w-2 rounded-full ${user?.isActive !== false ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <span className="text-gray-900">{user?.isActive !== false ? 'Active' : 'Inactive'}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Member Since</label>
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-900">
                      {formatDate(user?.createdAt)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Test Statistics */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <BookOpen className="h-5 w-5 mr-2" />
            Test Statistics
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
              <div className="text-sm text-blue-800">Total Tests</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
              <div className="text-sm text-green-800">Completed</div>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">{stats.toAttempt}</div>
              <div className="text-sm text-yellow-800">To Attempt</div>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">{stats.missed}</div>
              <div className="text-sm text-red-800">Missed</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{stats.avgScore}%</div>
              <div className="text-sm text-purple-800">Avg Score</div>
            </div>
          </div>
        </div>

        {/* Test History */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Clock className="h-5 w-5 mr-2" />
            Test History
          </h3>
          {testHistory.length === 0 ? (
            <div className="text-center py-8">
              <BookOpen className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-600 mb-2">No test history available</p>
              <p className="text-sm text-gray-500">Your completed tests will appear here</p>
            </div>
          ) : (
            <div className="space-y-4">
              {testHistory.map((test) => (
                <div key={test._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">{test.title}</h4>
                      <p className="text-sm text-gray-600">{test.description}</p>
                    </div>
                    <div className="text-right">
                      <span className={`inline-block px-3 py-1 text-sm font-semibold rounded-full ${
                        test.score >= 80 ? 'bg-green-100 text-green-800' : 
                        test.score >= 60 ? 'bg-yellow-100 text-yellow-800' : 
                        'bg-red-100 text-red-800'
                      }`}>
                        {test.score || 0}%
                      </span>
                      <div className="text-xs text-gray-500 mt-1">
                        {test.status === 'completed' ? 'Completed' : test.status}
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                      <span>
                        {test.completedAt ? 
                          `Completed: ${formatDate(test.completedAt, 'dd/mm/yyyy')}` :
                          `Due: ${formatDate(test.testId?.endDate || test.endDate, 'dd/mm/yyyy')}`
                        }
                      </span>
                    </div>
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 mr-2 text-gray-400" />
                      <span>Duration: {test.duration} min</span>
                    </div>
                    <div className="flex items-center">
                      <Percent className="w-4 h-4 mr-2 text-gray-400" />
                      <span>
                        {test.totalQuestions ? 
                          `${test.correctAnswers || 0}/${test.totalQuestions} correct` :
                          'Score calculated'
                        }
                      </span>
                    </div>
                  </div>
                  {test.feedback && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-700">
                        <strong>Feedback:</strong> {test.feedback}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              to="/student/dashboard"
              className="flex items-center justify-center space-x-2 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <BookOpen className="h-5 w-5 text-primary-600" />
              <span>View Available Tests</span>
            </Link>
            <button
              onClick={() => window.location.reload()}
              className="flex items-center justify-center space-x-2 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Clock className="h-5 w-5 text-primary-600" />
              <span>Refresh Data</span>
            </button>
            <Link
              to="/student/help"
              className="flex items-center justify-center space-x-2 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <User className="h-5 w-5 text-primary-600" />
              <span>Get Help</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentProfile;
