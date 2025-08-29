import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { API_ENDPOINTS } from '../../config/api';
import { 
  ArrowLeft, 
  Send, 
  BarChart3, 
  Users,
  Calendar,
  Clock,
  Settings,
  Eye,
  EyeOff
} from 'lucide-react';
import Footer from '../Common/Footer';

const TestDetails = () => {
  const { id: testId } = useParams();
  const navigate = useNavigate();
  const [test, setTest] = useState(null);
  const [students, setStudents] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [customMessage, setCustomMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sendingInvitations, setSendingInvitations] = useState(false);

  useEffect(() => {
    fetchTestDetails();
    fetchStudents();
  }, [testId]);

  const fetchTestDetails = async () => {
    try {
      const response = await axios.get(API_ENDPOINTS.ADMIN_TEST_BY_ID(testId));
      setTest(response.data.test);
      setSelectedStudents(response.data.test.allowedStudents || []);
    } catch (error) {
      console.error('Error fetching test details:', error);
      toast.error('Failed to load test details');
      navigate('/admin');
    }
  };

  const fetchStudents = async () => {
    try {
      const response = await axios.get(API_ENDPOINTS.ADMIN_STUDENTS);
      setStudents(response.data.students);
    } catch (error) {
      console.error('Error fetching students:', error);
      toast.error('Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  const handleStudentSelection = (studentId) => {
    setSelectedStudents(prev => 
      prev.includes(studentId)
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const getUninvitedStudents = () => {
    return students.filter(student => !test.allowedStudents?.includes(student._id));
  };

  const selectAllStudents = () => {
    const availableStudents = getUninvitedStudents();
    setSelectedStudents(availableStudents.map(student => student._id));
  };

  const deselectAllStudents = () => {
    setSelectedStudents([]);
  };

  const sendInvitations = async () => {
    if (selectedStudents.length === 0) {
      toast.error('Please select at least one student');
      return;
    }

    setSendingInvitations(true);
    try {
      await axios.post(API_ENDPOINTS.ADMIN_TEST_SEND_INVITATIONS(testId), {
        studentIds: selectedStudents,
        customMessage
      });
      toast.success(`Invitations sent to ${selectedStudents.length} students`);
      
      // Clear selected students and custom message
      setSelectedStudents([]);
      setCustomMessage('');
      
      fetchTestDetails(); // Refresh to update allowed students
    } catch (error) {
      console.error('Error sending invitations:', error);
      toast.error('Failed to send invitations');
    } finally {
      setSendingInvitations(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!test) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Test not found</h2>
          <p className="text-gray-600 mt-2">The test you're looking for doesn't exist.</p>
          <button
            onClick={() => navigate('/admin')}
            className="btn-primary mt-4"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/admin')}
                className="btn-secondary flex items-center space-x-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back</span>
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{test.title}</h1>
                <p className="text-gray-600">Test Details & Management</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate(`/admin/test/${testId}/results`)}
                className="btn-secondary flex items-center space-x-2"
              >
                <BarChart3 className="h-4 w-4" />
                <span>View Results</span>
              </button>
              <button
                onClick={() => {
                  if (window.confirm('Are you sure you want to delete this test? This action cannot be undone.')) {
                    axios.delete(API_ENDPOINTS.ADMIN_TEST_BY_ID(testId))
                      .then(() => {
                        toast.success('Test deleted successfully');
                        navigate('/admin');
                      })
                      .catch(error => {
                        console.error('Error deleting test:', error);
                        toast.error('Failed to delete test');
                      });
                  }
                }}
                className="btn-danger flex items-center space-x-2"
              >
                <span>Delete Test</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Test Information */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Info */}
            <div className="card">
              <h2 className="text-xl font-semibold mb-4">Test Information</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Title</label>
                  <p className="mt-1 text-sm text-gray-900">{test.title}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <p className="mt-1 text-sm text-gray-900">{test.description || 'No description provided'}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Duration</label>
                    <div className="mt-1 flex items-center text-sm text-gray-900">
                      <Clock className="h-4 w-4 mr-1" />
                      {test.duration} minutes
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Sections</label>
                    <p className="mt-1 text-sm text-gray-900">{test.sections.length} sections</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Start Date</label>
                    <div className="mt-1 flex items-center text-sm text-gray-900">
                      <Calendar className="h-4 w-4 mr-1" />
                      {new Date(test.startDate).toLocaleString()}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">End Date</label>
                    <div className="mt-1 flex items-center text-sm text-gray-900">
                      <Calendar className="h-4 w-4 mr-1" />
                      {new Date(test.endDate).toLocaleString()}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <span className={`mt-1 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    test.isActive 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {test.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            </div>

            {/* Proctoring Settings */}
            <div className="card">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <Settings className="h-5 w-5 mr-2" />
                Proctoring Settings
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center">
                  {test.enableCamera ? (
                    <Eye className="h-4 w-4 text-green-600 mr-2" />
                  ) : (
                    <EyeOff className="h-4 w-4 text-gray-400 mr-2" />
                  )}
                  <span className={`text-sm ${test.enableCamera ? 'text-green-600' : 'text-gray-500'}`}>
                    Camera {test.enableCamera ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
                
                <div className="flex items-center">
                  <span className={`text-sm ${test.enableFullScreen ? 'text-green-600' : 'text-gray-500'}`}>
                    Full Screen {test.enableFullScreen ? 'Required' : 'Optional'}
                  </span>
                </div>
                
                <div className="flex items-center">
                  <span className={`text-sm ${test.preventCopyPaste ? 'text-green-600' : 'text-gray-500'}`}>
                    Copy/Paste {test.preventCopyPaste ? 'Blocked' : 'Allowed'}
                  </span>
                </div>
                
                <div className="flex items-center">
                  <span className={`text-sm ${test.preventRightClick ? 'text-green-600' : 'text-gray-500'}`}>
                    Right Click {test.preventRightClick ? 'Blocked' : 'Allowed'}
                  </span>
                </div>
              </div>
            </div>

            {/* Sections Overview */}
            <div className="card">
              <h2 className="text-xl font-semibold mb-4">Sections Overview</h2>
              <div className="space-y-4">
                {test.sections.map((section, index) => (
                  <div key={section._id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium text-gray-900">
                          {index + 1}. {section.name}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          {section.questions.length} questions • {section.timeLimit} minutes
                        </p>
                        {section.instructions && (
                          <p className="text-sm text-gray-500 mt-2">{section.instructions}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Student Management */}
          <div className="space-y-6">
            {/* Send Invitations */}
            <div className="card">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <Users className="h-5 w-5 mr-2" />
                Student Invitations
              </h2>
              
              {students.filter(student => !test.allowedStudents.includes(student._id)).length === 0 ? (
                <div className="text-center py-6 bg-gray-50 rounded-lg border border-gray-200">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <h3 className="text-lg font-medium text-gray-900 mb-1">All Students Invited</h3>
                  <p className="text-gray-600">
                    Every registered student has already been invited to this test.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Custom Message (Optional)
                    </label>
                    <textarea
                      rows="3"
                      className="input-field"
                      value={customMessage}
                      onChange={(e) => setCustomMessage(e.target.value)}
                      placeholder="Add a custom message for students..."
                    />
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">
                      {selectedStudents.length} of {students.filter(student => !test.allowedStudents.includes(student._id)).length} students selected
                    </span>
                    <div className="space-x-2">
                      <button
                        onClick={selectAllStudents}
                        className="text-primary-600 hover:text-primary-800 text-sm"
                      >
                        Select All
                      </button>
                      <button
                        onClick={deselectAllStudents}
                        className="text-gray-600 hover:text-gray-800 text-sm"
                      >
                        Clear All
                      </button>
                    </div>
                  </div>

                  <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-lg">
                    {students
                      .filter(student => !test.allowedStudents.includes(student._id))
                      .map((student) => (
                        <label
                          key={student._id}
                          className="flex items-center p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                        >
                          <input
                            type="checkbox"
                            checked={selectedStudents.includes(student._id)}
                            onChange={() => handleStudentSelection(student._id)}
                            className="rounded mr-3"
                          />
                          <div className="flex-1">
                            <div className="text-sm font-medium text-gray-900">
                              {student.name}
                            </div>
                            <div className="text-xs text-gray-500">
                              {student.email}
                            </div>
                            {student.registrationNumber && (
                              <div className="text-xs text-gray-400">
                                {student.registrationNumber}
                              </div>
                            )}
                          </div>
                        </label>
                      ))}
                  </div>

                  <button
                    onClick={sendInvitations}
                    disabled={sendingInvitations || selectedStudents.length === 0}
                    className="w-full btn-primary flex items-center justify-center space-x-2"
                  >
                    <Send className="h-4 w-4" />
                    <span>
                      {sendingInvitations 
                        ? 'Sending Invitations...' 
                        : selectedStudents.length === 0
                          ? 'Select Students to Invite'
                          : `Send Invitations to ${selectedStudents.length} Student${selectedStudents.length === 1 ? '' : 's'}`
                      }
                    </span>
                  </button>
                </div>
              )}
            </div>

            {/* Already Invited Students */}
            {test.allowedStudents && test.allowedStudents.length > 0 && (
              <div className="card">
                <h3 className="text-lg font-medium mb-4">Invited Students</h3>
                <div className="text-sm text-gray-600 mb-2">
                  {test.allowedStudents.length} students have been invited
                </div>
                <div className="max-h-32 overflow-y-auto">
                  {students
                    .filter(student => test.allowedStudents.includes(student._id))
                    .map((student) => (
                      <div key={student._id} className="flex items-center py-2 border-b border-gray-100 last:border-b-0">
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-900">
                            {student.name}
                          </div>
                          <div className="text-xs text-gray-500">
                            {student.email}
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default TestDetails;