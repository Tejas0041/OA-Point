import React, { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import AuthError from '../Auth/AuthError'
import axios from 'axios'
import toast from 'react-hot-toast'
import { API_ENDPOINTS } from '../../config/api'
import {
  FileText,
  Clock,
  Calendar,
  CheckCircle,
  XCircle,
  LogOut,
  User,
  BookOpen,
  RefreshCw
} from 'lucide-react'
import Footer from '../Common/Footer'

const StudentDashboard = () => {
  const { user, logout, loading: authLoading } = useAuth()
  const [tests, setTests] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const fetchAvailableTests = useCallback(async () => {
    try {
      const userId = user?.id || user?._id
      console.log(
        'fetchAvailableTests called - user:',
        userId,
        'user object:',
        user
      )

      setLoading(true)
      setError(null)

      // Force refresh token from localStorage
      const token = localStorage.getItem('token')
      if (!token) {
        console.error('No authentication token found')
        setError('Authentication error. Please log in again.')
        setLoading(false)
        return
      }

      console.log('Making request to:', API_ENDPOINTS.STUDENT_TESTS)

      // Set up request with explicit headers
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000 // 30 second timeout
      }

      const response = await axios.get(API_ENDPOINTS.STUDENT_TESTS, config)
      console.log('Tests response:', response.data)

      // Handle response
      if (response.data && Array.isArray(response.data.tests)) {
        setTests(response.data.tests)
        console.log(
          'Set tests from response.data.tests:',
          response.data.tests.length
        )
      } else if (response.data && Array.isArray(response.data)) {
        setTests(response.data)
        console.log('Set tests from response.data:', response.data.length)
      } else {
        setTests([])
        console.log('Set empty tests array')
      }
    } catch (error) {
      console.error('Error fetching tests:', error)

      setError(error.response?.data?.message || 'Failed to load tests')
      if (error.response?.status === 401) {
        setError('Your session has expired. Please log in again.')
        // Don't auto-logout here as the interceptor will handle it
      } else if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
        toast.error('Request timeout. Please check your connection.')
      } else if (
        error.code === 'ERR_NETWORK' ||
        error.message?.includes('Network Error')
      ) {
        toast.error('Network error. Please check your connection.')
      } else {
        toast.error('Failed to load available tests. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }, [user])

  // Simplified effect - just fetch tests when user is available
  useEffect(() => {
    const userId = user?.id || user?._id
    console.log(
      'StudentDashboard useEffect - authLoading:',
      authLoading,
      'user:',
      userId,
      'user object:',
      user
    )

    if (!authLoading && user && userId) {
      console.log('User is available, fetching tests')
      setError(null)
      fetchAvailableTests()
    } else if (!authLoading && !user) {
      console.log('No user found after auth loading')
      setLoading(false)
      setError('Please log in to view your tests.')
    }
  }, [user, authLoading, fetchAvailableTests])

  // Add timeout to prevent infinite loading
  useEffect(() => {
    if (loading && !authLoading) {
      const timeout = setTimeout(() => {
        if (loading) {
          console.log('Loading timeout reached, setting error')
          setError(
            'Loading timeout. Please check your connection and try again.'
          )
          setLoading(false)
          // Don't auto-retry to avoid potential infinite loops
        }
      }, 10000) // 10 seconds timeout - reduced from 30 seconds

      return () => clearTimeout(timeout)
    }
  }, [loading, authLoading])

  const handleRetry = () => {
    setLoading(true)
    setError(null)
    fetchAvailableTests()
  }

  const getTestStatus = test => {
    const now = new Date()

    // Check if test is inactive first
    if (test.isActive === false) {
      return { status: 'inactive', color: 'gray', text: 'Inactive' }
    }

    // If test has a status from backend, use it
    if (test.status) {
      switch (test.status) {
        case 'completed':
          return { status: 'completed', color: 'green', text: 'Completed' }
        case 'missed':
          return { status: 'expired', color: 'red', text: 'Missed' }
        case 'to_attempt': {
          const startDate = new Date(test.startDate)
          const endDate = new Date(test.endDate)

          if (now < startDate) {
            return { status: 'upcoming', color: 'blue', text: 'Upcoming' }
          }
          if (now > endDate) {
            return { status: 'expired', color: 'red', text: 'Expired' }
          }
          return { status: 'available', color: 'green', text: 'Available' }
        }
        default:
          return { status: 'unknown', color: 'gray', text: 'Unknown' }
      }
    }

    // If no status from backend, calculate based on dates
    const startDate = new Date(test.startDate)
    const endDate = new Date(test.endDate)

    if (now < startDate) {
      return { status: 'upcoming', color: 'blue', text: 'Upcoming' }
    }

    if (now > endDate) {
      return { status: 'expired', color: 'red', text: 'Expired' }
    }

    return { status: 'available', color: 'green', text: 'Available' }
  }

  if (authLoading || loading) {
    return (
      <div className='min-h-screen flex flex-col items-center justify-center'>
        <div className='animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600'></div>
        <p className='mt-4 text-gray-600'>
          {authLoading
            ? 'Loading user profile...'
            : 'Loading available tests...'}
        </p>
        {!authLoading && loading && (
          <div className='mt-4 space-y-2'>
            <p className='text-sm text-gray-500'>
              This may take a moment if you have many tests...
            </p>
            <div className='w-64 bg-gray-200 rounded-full h-2'>
              <div
                className='bg-primary-600 h-2 rounded-full animate-pulse'
                style={{ width: '60%' }}
              ></div>
            </div>
          </div>
        )}

        {/* Debug info */}
        <div className='mt-8 p-4 bg-gray-100 rounded-lg text-xs text-gray-600 max-w-md'>
          <p>
            <strong>Debug Info:</strong>
          </p>
          <p>Auth Loading: {authLoading ? 'true' : 'false'}</p>
          <p>Loading: {loading ? 'true' : 'false'}</p>
          <p>User ID: {user?._id || 'null'}</p>
          <p>User Name: {user?.name || 'null'}</p>
          <p>
            Token exists: {localStorage.getItem('token') ? 'true' : 'false'}
          </p>
          <button
            onClick={async () => {
              try {
                const response = await axios.get(API_ENDPOINTS.ME)
                console.log('Manual user fetch:', response.data)
                alert(
                  'User fetch successful: ' + JSON.stringify(response.data.user)
                )
              } catch (error) {
                console.error('Manual user fetch failed:', error)
                alert('User fetch failed: ' + error.message)
              }
            }}
            className='mt-2 px-3 py-1 bg-blue-500 text-white rounded text-xs mr-2'
          >
            Test User Fetch
          </button>
          <button
            onClick={async () => {
              try {
                const response = await axios.get(API_ENDPOINTS.STUDENT_TESTS)
                console.log('Manual tests fetch:', response.data)
                alert(
                  'Tests fetch successful: ' + JSON.stringify(response.data)
                )
              } catch (error) {
                console.error('Manual tests fetch failed:', error)
                alert('Tests fetch failed: ' + error.message)
              }
            }}
            className='mt-2 px-3 py-1 bg-green-500 text-white rounded text-xs mr-2'
          >
            Test Fetch Tests
          </button>
          <button
            onClick={() => {
              console.log('Force fetching tests - current user:', user)
              setError(null)
              setLoading(true)
              fetchAvailableTests()
            }}
            className='mt-2 px-3 py-1 bg-purple-500 text-white rounded text-xs'
          >
            Force Fetch Tests
          </button>
        </div>
      </div>
    )
  }

  // Show error if authentication failed
  if (
    error &&
    (error.includes('Please log in') || error.includes('session has expired'))
  ) {
    return <AuthError error={error} onRetry={handleRetry} />
  }

  if (error) {
    return (
      <div className='min-h-screen flex flex-col items-center justify-center'>
        <div className='text-center'>
          <div className='mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100'>
            <svg
              className='h-6 w-6 text-red-600'
              fill='none'
              viewBox='0 0 24 24'
              stroke='currentColor'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z'
              />
            </svg>
          </div>
          <h3 className='mt-4 text-lg font-medium text-gray-900'>
            Failed to load tests
          </h3>
          <p className='mt-2 text-sm text-gray-500'>{error}</p>
          <div className='mt-6'>
            <button onClick={handleRetry} className='btn-primary'>
              Try Again
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className='min-h-screen bg-gray-50 flex flex-col'>
      {/* Header */}
      <header className='bg-white shadow-sm border-b'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='flex justify-between items-center py-4'>
            <div className='flex items-center space-x-3'>
              <img
                src='/images/logo_oa_point.webp'
                alt='OA Point Logo'
                className='h-14 w-14 object-contain'
                style={{ mixBlendMode: 'multiply' }}
              />
              <div>
                <h1 className='text-2xl font-bold text-gray-900'>
                  <span className='text-primary-600'>OA Point</span>
                </h1>
                <p className='text-gray-600'>Welcome back, {user.name}</p>
              </div>
            </div>
            <div className='flex items-center space-x-4'>
              <Link
                to='/student/profile'
                className='btn-primary flex items-center space-x-2'
              >
                <User className='h-5 w-5' />
                <span>Profile</span>
              </Link>
              <button
                onClick={handleRetry}
                disabled={loading}
                className='btn-secondary flex items-center space-x-2'
                title='Refresh tests'
              >
                <RefreshCw
                  className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`}
                />
                <span>Refresh</span>
              </button>
              <button
                onClick={logout}
                className='btn-secondary flex items-center space-x-2'
              >
                <LogOut className='h-5 w-5' />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        {/* Welcome Message */}
        <div className='mb-6 p-4 bg-green-50 rounded-lg border border-green-200'>
          <div className='flex items-start'>
            <div className='flex-shrink-0'>
              <svg
                className='h-5 w-5 text-green-400'
                viewBox='0 0 20 20'
                fill='currentColor'
              >
                <path
                  fillRule='evenodd'
                  d='M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z'
                  clipRule='evenodd'
                />
              </svg>
            </div>
            <div className='ml-3'>
              <h3 className='text-sm font-medium text-green-800'>
                Welcome to Your Student Dashboard
              </h3>
              <div className='mt-2 text-sm text-green-700'>
                <p>
                  All your assigned assessments will appear below. Click on any
                  test to begin or continue.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Available Tests */}
        <div className='card'>
          <div className='flex items-center mb-6'>
            <BookOpen className='h-6 w-6 text-primary-600 mr-3' />
            <h2 className='text-xl font-semibold text-gray-900'>
              Available Assessments
            </h2>
          </div>

          {tests.length === 0 ? (
            <div className='text-center py-12'>
              <FileText className='mx-auto h-12 w-12 text-gray-400' />
              <h3 className='mt-2 text-sm font-medium text-gray-900'>
                No assessments available
              </h3>
              <p className='mt-1 text-sm text-gray-500'>
                You don't have any assessments assigned at the moment.
              </p>
              <div className='mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200'>
                <p className='text-sm text-blue-800'>
                  <strong>Note:</strong> If you received an email invitation but
                  don't see the test here, please contact your administrator.
                  Tests are only visible on this dashboard once they are
                  activated and you are added to the allowed students list.
                </p>
              </div>
              <div className='mt-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200'>
                <p className='text-sm text-yellow-800'>
                  <strong>What to do:</strong>
                </p>
                <ul className='mt-2 text-sm text-yellow-700 space-y-1'>
                  <li>• Check your email for test invitations</li>
                  <li>
                    • Contact your administrator if you expect to see tests
                  </li>
                  <li>• Ensure you're using the correct account</li>
                  <li>• Try refreshing the page</li>
                  <li>
                    • Check if the test is active and you're properly registered
                  </li>
                </ul>
              </div>
              {/* <div className="mt-6">
                <button
                  onClick={handleRetry}
                  className="btn-primary"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh Tests
                </button>
              </div> */}
            </div>
          ) : (
            <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-3'>
              {tests.map(test => {
                const status = getTestStatus(test)
                return (
                  <div
                    key={test._id}
                    className='border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow'
                  >
                    <div className='flex justify-between items-start mb-4'>
                      <h3 className='text-lg font-semibold text-gray-900 line-clamp-2'>
                        {test.title}
                      </h3>
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-${status.color}-100 text-${status.color}-800`}
                      >
                        {status.text}
                      </span>
                    </div>

                    <p className='text-gray-600 text-sm mb-4 line-clamp-3'>
                      {test.description}
                    </p>

                    <div className='space-y-2 mb-4'>
                      <div className='flex items-center text-sm text-gray-600'>
                        <Calendar className='h-4 w-4 mr-2' />
                        <span>
                          {new Date(test.startDate).toLocaleDateString('en-GB')}{' '}
                          - {new Date(test.endDate).toLocaleDateString('en-GB')}
                        </span>
                      </div>
                      <div className='flex items-center text-sm text-gray-600'>
                        <Clock className='h-4 w-4 mr-2' />
                        <span>{test.duration} minutes</span>
                      </div>
                      <div className='flex items-center text-sm text-gray-600'>
                        <FileText className='h-4 w-4 mr-2' />
                        <span>{test.sections.length} sections</span>
                      </div>
                    </div>

                    <div className='flex justify-between items-center'>
                      {status.status === 'completed' ? (
                        <div className='flex items-center space-x-2'>
                          <div className='flex items-center text-green-600'>
                            <CheckCircle className='h-4 w-4 mr-1' />
                            <span className='text-sm'>Completed</span>
                          </div>
                          <Link
                            to={`/student/test/${test._id}/results`}
                            className='text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200'
                          >
                            View Results
                          </Link>
                        </div>
                      ) : status.status === 'expired' ? (
                        <div className='flex items-center text-red-600'>
                          <XCircle className='h-4 w-4 mr-1' />
                          <span className='text-sm'>Expired</span>
                        </div>
                      ) : status.status === 'inactive' ? (
                        <div className='flex items-center text-gray-600'>
                          <XCircle className='h-4 w-4 mr-1' />
                          <span className='text-sm'>Test Inactive</span>
                        </div>
                      ) : status.status === 'upcoming' ? (
                        <div className='flex items-center text-blue-600'>
                          <Clock className='h-4 w-4 mr-1' />
                          <span className='text-sm'>
                            Starts{' '}
                            {new Date(test.startDate).toLocaleString('en-GB')}
                          </span>
                        </div>
                      ) : (
                        <Link
                          to={`/student/test/${test._id}`}
                          className='btn-primary text-sm'
                        >
                          {test.hasAttempted ? 'Continue Test' : 'Start Test'}
                        </Link>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className='card mt-8'>
          <h3 className='text-lg font-semibold text-gray-900 mb-4'>
            Important Instructions
          </h3>
          <div className='space-y-3 text-sm text-gray-600'>
            <div className='flex items-start'>
              <div className='w-2 h-2 bg-primary-600 rounded-full mt-2 mr-3 flex-shrink-0'></div>
              <p>
                <strong>Access Tests:</strong> All your assigned assessments are
                listed above. Click "Start Test" to begin.
              </p>
            </div>
            <div className='flex items-start'>
              <div className='w-2 h-2 bg-primary-600 rounded-full mt-2 mr-3 flex-shrink-0'></div>
              <p>
                Ensure you have a stable internet connection before starting any
                assessment.
              </p>
            </div>
            <div className='flex items-start'>
              <div className='w-2 h-2 bg-primary-600 rounded-full mt-2 mr-3 flex-shrink-0'></div>
              <p>
                Use a desktop or laptop computer with a working webcam for
                proctored assessments.
              </p>
            </div>
            <div className='flex items-start'>
              <div className='w-2 h-2 bg-primary-600 rounded-full mt-2 mr-3 flex-shrink-0'></div>
              <p>
                Close all unnecessary applications and browser tabs before
                starting.
              </p>
            </div>
            <div className='flex items-start'>
              <div className='w-2 h-2 bg-primary-600 rounded-full mt-2 mr-3 flex-shrink-0'></div>
              <p>
                The assessment will be in full-screen mode. Exiting full-screen
                may be flagged as suspicious activity.
              </p>
            </div>
            <div className='flex items-start'>
              <div className='w-2 h-2 bg-primary-600 rounded-full mt-2 mr-3 flex-shrink-0'></div>
              <p>
                Copy-paste functionality and right-click context menu will be
                disabled during the test.
              </p>
            </div>
            <div className='flex items-start'>
              <div className='w-2 h-2 bg-primary-600 rounded-full mt-2 mr-3 flex-shrink-0'></div>
              <p>
                Make sure to submit your answers before the time limit expires.
              </p>
            </div>
          </div>
        </div>

        {/* Help & Support */}
        <div className='card mt-8'>
          <h3 className='text-lg font-semibold text-gray-900 mb-4'>
            Need Help?
          </h3>
          <div className='space-y-3 text-sm text-gray-600'>
            <div className='flex items-start'>
              <div className='w-2 h-2 bg-primary-600 rounded-full mt-2 mr-3 flex-shrink-0'></div>
              <p>
                If you encounter any technical issues or have questions about
                your assessments, please contact our support team.
              </p>
            </div>
            <div className='flex items-start'>
              <div className='w-2 h-2 bg-primary-600 rounded-full mt-2 mr-3 flex-shrink-0'></div>
              <p>
                <strong>Support Email:</strong>{' '}
                <a
                  href='mailto:onlineassessment.point@gmail.com'
                  className='text-primary-600 hover:text-primary-800'
                >
                  onlineassessment.point@gmail.com
                </a>
              </p>
            </div>
            <div className='flex items-start'>
              <div className='w-2 h-2 bg-primary-600 rounded-full mt-2 mr-3 flex-shrink-0'></div>
              <p>
                We typically respond to support requests within 24 hours during
                business days.
              </p>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}
export default StudentDashboard
