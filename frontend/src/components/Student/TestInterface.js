import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'
import toast from 'react-hot-toast'
import { API_ENDPOINTS } from '../../config/api'
import Webcam from 'react-webcam'
import Editor from '@monaco-editor/react'
import './TestInterface.css'
import {
  Clock,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  Camera,
  CameraOff,
  Minimize2,
  Maximize2,
  Play,
  Send,
  AlertTriangle,
  XCircle
} from 'lucide-react'

const TestInterface = () => {
  const { id: testId } = useParams()
  const navigate = useNavigate()
  const webcamRef = useRef(null)
  const [test, setTest] = useState(null)
  const [attempt, setAttempt] = useState(null)
  const [currentSection, setCurrentSection] = useState(0)
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState({})
  const [timeLeft, setTimeLeft] = useState(0)
  const [sectionTimeLeft, setSectionTimeLeft] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [webcamEnabled, setWebcamEnabled] = useState(true)
  const [webcamCollapsed, setWebcamCollapsed] = useState(true)
  const [customInput, setCustomInput] = useState('')
  const [customOutput, setCustomOutput] = useState('')
  const [code, setCode] = useState('')
  const [codeOutput, setCodeOutput] = useState('')
  const [isRunning, setIsRunning] = useState(false)
  const [testStarted, setTestStarted] = useState(false)
  const [showSectionModal, setShowSectionModal] = useState(false)
  const [showSubmitModal, setShowSubmitModal] = useState(false)

  // Timer for section time
  useEffect(() => {
    if (testStarted && sectionTimeLeft > 0) {
      const timer = setInterval(() => {
        setSectionTimeLeft(prev => {
          if (prev <= 1) {
            handleSectionComplete()
            return 0
          }
          return prev - 1
        })
      }, 1000)
      return () => clearInterval(timer)
    }
  }, [testStarted])

  // Timer for overall test time
  useEffect(() => {
    if (testStarted && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleAutoSubmit()
            return 0
          }
          return prev - 1
        })
      }, 1000)
      return () => clearInterval(timer)
    }
  }, [handleAutoSubmit, testStarted, timeLeft])

  // Effect for handling security measures
  useEffect(() => {
    if (testStarted) {
      // Block ESC key
      const blockEsc = e => {
        if (e.key === 'Escape') {
          e.preventDefault()
          e.stopPropagation()
        }
      }

      // Monitor fullscreen state
      const handleFullscreenChange = () => {
        const isCurrentlyFullscreen = !!document.fullscreenElement
        setIsFullscreen(isCurrentlyFullscreen)

        if (testStarted && !isCurrentlyFullscreen) {
          toast.error('Please return to fullscreen mode to continue', {
            duration: Infinity,
            id: 'fullscreen-warning'
          })
        } else if (isCurrentlyFullscreen) {
          toast.dismiss('fullscreen-warning')
        }
      }

      document.addEventListener('fullscreenchange', handleFullscreenChange)

      // Block developer tools shortcuts
      const blockDevTools = e => {
        if (
          (e.ctrlKey &&
            (e.key === 'I' ||
              e.key === 'i' ||
              e.key === 'J' ||
              e.key === 'j' ||
              e.key === 'U' ||
              e.key === 'u')) ||
          e.key === 'F12'
        ) {
          e.preventDefault()
          e.stopPropagation()
          toast.error('Developer tools are not allowed during the test')
        }
      }

      // Block right click
      const blockRightClick = e => {
        e.preventDefault()
        e.stopPropagation()
        toast.error('Right click is not allowed during the test')
      }

      // Block inspect element
      const blockInspect = e => {
        if (e.key === 'F12' || (e.ctrlKey && e.shiftKey && e.key === 'I')) {
          e.preventDefault()
          toast.error('Inspect element is not allowed during the test')
          reportViolation('inspect', 'Inspect element attempted')
        }
      }
      const checkDevTools = () => {
        const threshold = 160
        const widthThreshold = window.outerWidth - window.innerWidth > threshold
        const heightThreshold =
          window.outerHeight - window.innerHeight > threshold

        if (widthThreshold || heightThreshold) {
          toast.error('Please close developer tools to continue the test')
          reportViolation('dev-tools', 'Developer tools detected')
        }
      }

      const devToolsInterval = setInterval(checkDevTools, 1000)

      // Cleanup
      return () => {
        document.removeEventListener('keydown', blockEsc, true)
        document.removeEventListener('keydown', blockDevTools, true)
        document.removeEventListener('contextmenu', blockRightClick, true)
        clearInterval(devToolsInterval)
      }
    }
  }, [testStarted])

  useEffect(() => {
    fetchTestDetails()
    if (testStarted) {
      setupEventListeners()
    }
    return () => {
      if (testStarted) {
        removeEventListeners()
      }
    }
  }, [testId, testStarted])

  const setupEventListeners = () => {
    if (testStarted) {
      // Block ESC key and F11
      const blockEsc = e => {
        if (e.key === 'Escape' || e.key === 'F11') {
          e.preventDefault()
          e.stopPropagation()
        }
      }
      document.addEventListener('keydown', blockEsc, true)

      // Block developer tools shortcuts
      const blockDevTools = e => {
        if (
          (e.ctrlKey &&
            (e.key === 'I' ||
              e.key === 'i' ||
              e.key === 'J' ||
              e.key === 'j' ||
              e.key === 'U' ||
              e.key === 'u')) ||
          e.key === 'F12'
        ) {
          e.preventDefault()
          e.stopPropagation()
          toast.error('Developer tools are not allowed during the test')
          reportViolation('dev-tools', 'Developer tools shortcut detected')
        }
      }
      document.addEventListener('keydown', blockDevTools, true)

      // Prevent right-click
      document.addEventListener('contextmenu', preventRightClick)

      // Prevent copy-paste
      document.addEventListener('keydown', preventCopyPaste)

      // Detect fullscreen changes
      document.addEventListener('fullscreenchange', handleFullscreenChange)

      // Detect tab switching
      document.addEventListener('visibilitychange', handleVisibilityChange)

      // Detect if devtools is open
      const checkDevTools = () => {
        const threshold = 160
        const widthThreshold = window.outerWidth - window.innerWidth > threshold
        const heightThreshold =
          window.outerHeight - window.innerHeight > threshold

        if (widthThreshold || heightThreshold) {
          toast.error('Please close developer tools to continue the test')
          reportViolation('dev-tools', 'Developer tools detected')
        }
      }

      const devToolsInterval = setInterval(checkDevTools, 1000)

      // Clean up function
      return () => {
        document.removeEventListener('keydown', blockEsc, true)
        document.removeEventListener('keydown', blockDevTools, true)
        document.removeEventListener('contextmenu', preventRightClick)
        document.removeEventListener('keydown', preventCopyPaste)
        document.removeEventListener('fullscreenchange', handleFullscreenChange)
        document.removeEventListener('visibilitychange', handleVisibilityChange)
        clearInterval(devToolsInterval)
      }
    }
  }

  const removeEventListeners = () => {
    document.removeEventListener('contextmenu', preventRightClick)
    document.removeEventListener('keydown', preventCopyPaste)
    document.removeEventListener('fullscreenchange', handleFullscreenChange)
    document.removeEventListener('visibilitychange', handleVisibilityChange)
  }

  const preventRightClick = e => {
    if (testStarted) {
      e.preventDefault()
      reportViolation('right-click', 'Right-click attempted')
    }
  }

  const preventCopyPaste = e => {
    if (testStarted && (e.ctrlKey || e.metaKey)) {
      if (e.key === 'c' || e.key === 'v' || e.key === 'x') {
        e.preventDefault()
        reportViolation(
          'copy-paste',
          `${e.key.toUpperCase()} key combination attempted`
        )
      }
    }
  }

  const handleFullscreenChange = () => {
    const isCurrentlyFullscreen = !!document.fullscreenElement
    setIsFullscreen(isCurrentlyFullscreen)

    if (testStarted) {
      if (!isCurrentlyFullscreen) {
        reportViolation('fullscreen-exit', 'Exited fullscreen mode')
        toast.error('Please return to fullscreen mode to continue', {
          duration: Infinity,
          id: 'fullscreen-warning'
        })
      } else {
        // Dismiss fullscreen warning when entering fullscreen
        toast.dismiss('fullscreen-warning')
      }
    }
  }

  const handleVisibilityChange = () => {
    if (testStarted && document.hidden) {
      reportViolation('tab-switch', 'Switched to another tab/window')
      toast.error('Tab switching detected')
    }
  }

  const reportViolation = async (type, description) => {
    try {
      await axios.post(API_ENDPOINTS.STUDENT_TEST_REPORT_VIOLATION(testId), {
        type,
        description
      })
    } catch (error) {
      console.error('Error reporting violation:', error)
    }
  }

  const fetchTestDetails = async () => {
    try {
      const response = await axios.get(API_ENDPOINTS.STUDENT_TEST_BY_ID(testId))
      const testData = response.data.test

      if (!testData || !testData.sections || testData.sections.length === 0) {
        throw new Error('Invalid test data received')
      }

      setTest(testData)

      if (response.data.existingAttempt) {
        // Resume existing attempt
        const attempt = response.data.existingAttempt
        setAttempt(attempt)

        // Validate section index
        const sectionIndex = Math.min(
          attempt.currentSection,
          testData.sections.length - 1
        )
        setCurrentSection(sectionIndex)

        setTestStarted(true)
        calculateTimeLeft(testData, attempt)
      } else {
        // Initialize with first section
        setSectionTimeLeft(testData.sections[0].timeLimit * 60)
      }
    } catch (error) {
      console.error('Error fetching test:', error)
      if (error.response?.status === 403) {
        setError(
          'You are not authorized to access this test. Please check your dashboard for available tests.'
        )
      } else if (error.response?.status === 404) {
        setError(
          'Test not found. Please check your dashboard for available tests.'
        )
      } else {
        setError(
          'Failed to load test. Please try again or contact your administrator.'
        )
      }
      setLoading(false)
    } finally {
      setLoading(false)
    }
  }

  const calculateTimeLeft = (testData, attemptData) => {
    const startTime = new Date(attemptData.startTime)
    const now = new Date()
    const elapsed = Math.floor((now - startTime) / 1000)
    const totalTime = testData.duration * 60
    setTimeLeft(Math.max(0, totalTime - elapsed))

    // Calculate section time left
    const currentSectionData = testData.sections[attemptData.currentSection]
    if (currentSectionData) {
      const sectionTime = currentSectionData.timeLimit * 60
      setSectionTimeLeft(Math.max(0, sectionTime - elapsed))
    }
  }

  const startTest = async () => {
    try {
      // Request fullscreen first if enabled
      if (test.enableFullScreen) {
        try {
          await document.documentElement.requestFullscreen()
          setIsFullscreen(true)
        } catch (error) {
          console.error('Failed to enter fullscreen:', error)
          toast.error('Please allow fullscreen mode to continue')
          return
        }
      }

      // Start webcam - always enabled in background
      setWebcamEnabled(true)

      const browserInfo = {
        userAgent: navigator.userAgent,
        screenResolution: `${window.screen.width}x${window.screen.height}`,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      }

      const response = await axios.post(
        API_ENDPOINTS.STUDENT_TEST_START(testId),
        {
          browserInfo
        }
      )

      setAttempt({ _id: response.data.attemptId })
      setTestStarted(true)
      setTimeLeft(test.duration * 60)
      setSectionTimeLeft(test.sections[0].timeLimit * 60)

      toast.success('Test started successfully')
    } catch (error) {
      console.error('Error starting test:', error)
      toast.error('Failed to start test')
    }
  }

  const handleAnswerChange = (questionId, answer) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }))
  }

  const submitAnswer = async (questionId, answer) => {
    try {
      await axios.post(API_ENDPOINTS.STUDENT_TEST_SUBMIT_ANSWER(testId), {
        questionId,
        sectionId: test.sections[currentSection]._id,
        answer,
        timeSpent: 0 // Calculate actual time spent
      })
    } catch (error) {
      console.error('Error submitting answer:', error)
    }
  }

  const handleSectionComplete = async () => {
    try {
      await axios.post(API_ENDPOINTS.STUDENT_TEST_COMPLETE_SECTION(testId), {
        sectionId: test.sections[currentSection]._id
      })

      if (currentSection < test.sections.length - 1) {
        setCurrentSection(prev => prev + 1)
        setCurrentQuestion(0)
        setSectionTimeLeft(test.sections[currentSection + 1].timeLimit * 60)
        toast.success('Section completed. Moving to next section.')
      } else {
        handleTestSubmit()
      }
    } catch (error) {
      console.error('Error completing section:', error)
      toast.error('Failed to complete section')
    }
  }

  const handleTestSubmit = async () => {
    try {
      // Stop test monitoring to prevent warnings after submission
      setTestStarted(false)

      // Dismiss any existing fullscreen warnings
      toast.dismiss('fullscreen-warning')

      // First, ensure all current answers are submitted
      console.log('Submitting final answers before test submission...')
      const submitPromises = []

      // Submit any unsaved answers
      Object.keys(answers).forEach(questionId => {
        const answer = answers[questionId]
        if (answer) {
          console.log('Submitting answer for question:', questionId, answer)
          submitPromises.push(submitAnswer(questionId, answer))
        }
      })

      // Wait for all answers to be submitted
      if (submitPromises.length > 0) {
        await Promise.all(submitPromises)
        console.log('All answers submitted, waiting 1 second...')
        // Give a small delay to ensure database writes complete
        await new Promise(resolve => setTimeout(resolve, 1000))
      }

      console.log('Now submitting test...')
      const response = await axios.post(
        API_ENDPOINTS.STUDENT_TEST_SUBMIT(testId)
      )
      toast.success('Test submitted successfully')

      // Exit fullscreen
      if (document.fullscreenElement) {
        document.exitFullscreen()
      }

      // Redirect to results page instead of dashboard
      navigate(`/student/test/${testId}/results`, {
        state: {
          testCompleted: true,
          score: response.data.score,
          maxScore: response.data.maxScore
        }
      })
    } catch (error) {
      console.error('Error submitting test:', error)
      toast.error('Failed to submit test')
    }
  }

  const handleAutoSubmit = () => {
    toast.error('Time is up! Auto-submitting test...')
    handleTestSubmit()
  }

  const runCode = async () => {
    if (!code.trim()) {
      toast.error('Please write some code first')
      return
    }

    setIsRunning(true)
    setCodeOutput('Running code...') // Clear previous output

    try {
      const response = await axios.post(API_ENDPOINTS.COMPILER_RUN, {
        code,
        language: 'cpp',
        testId,
        questionId: getCurrentQuestion()._id
      })

      const results = response.data.results || []
      const passedCount = results.filter(r => r.passed).length

      let output = `=== TEST RESULTS ===\n`
      output += `Total test cases: ${results.length}\n`
      output += `Passed: ${passedCount}/${results.length}\n\n`

      // Only show pass/fail status, not the actual test case details
      results.forEach((result, index) => {
        output += `Test Case ${index + 1}: ${
          result.passed ? '✓ PASSED' : '✗ FAILED'
        }\n`
        if (result.error) {
          output += `Error: ${result.error}\n`
        }
      })

      setCodeOutput(output)
    } catch (error) {
      console.error('Error running code:', error)
      let errorMessage = error.response?.data?.message || error.message
      setCodeOutput(
        `=== COMPILATION ERROR ===\n${errorMessage}\n\nPlease check your code for syntax errors and try again.`
      )
    } finally {
      setIsRunning(false)
    }
  }

  const runCustomInput = async () => {
    if (!code.trim()) {
      toast.error('Please write some code first')
      return
    }

    if (!customInput.trim()) {
      toast.error('Please provide custom input')
      return
    }

    setIsRunning(true)
    try {
      const response = await axios.post(API_ENDPOINTS.COMPILER_RUN, {
        code,
        language: 'cpp',
        customInput: customInput
      })

      setCustomOutput(response.data.output || 'No output')
    } catch (error) {
      console.error('Error running custom input:', error)
      setCustomOutput(
        `Compilation Error: ${error.response?.data?.message || error.message}`
      )
    } finally {
      setIsRunning(false)
    }
  }

  const submitCode = async () => {
    if (!code.trim()) {
      toast.error('Please write some code first')
      return
    }

    setIsRunning(true)
    try {
      const response = await axios.post(API_ENDPOINTS.COMPILER_SUBMIT, {
        code,
        language: 'cpp',
        testId,
        questionId: getCurrentQuestion()._id
      })

      const results = response.data.results || []
      const passedCount = results.filter(r => r.passed).length
      const totalCount = results.length

      const answer = {
        questionType: 'coding',
        code,
        language: 'cpp',
        testCaseResults: results
      }

      // Update answer with test results
      answer.testCaseResults = results
      handleAnswerChange(getCurrentQuestion()._id, answer)
      await submitAnswer(getCurrentQuestion()._id, answer)

      // Determine status and show appropriate message
      let status,
        message,
        points = getCurrentQuestion().points || 1
      let score = 0

      if (passedCount === 0) {
        status = 'Incorrect'
        score = 0
        message = `Code submitted! ${status} - 0/${totalCount} test cases passed (Score: 0/${points})`
      } else if (passedCount === totalCount) {
        status = 'Correct'
        score = points
        message = `Code submitted! ${status} - ${passedCount}/${totalCount} test cases passed (Score: ${score}/${points})`
      } else {
        status = 'Partial'
        score = Math.round((passedCount / totalCount) * points)
        message = `Code submitted! ${status} - ${passedCount}/${totalCount} test cases passed (Score: ${score}/${points})`
      }

      // Update output with submission results including hidden test cases
      let output = `=== SUBMISSION RESULTS ===\n`
      output += `Status: ${status}\n`
      output += `Score: ${score}/${points} points\n`
      output += `Test Cases: ${passedCount}/${totalCount} passed\n\n`

      results.forEach((result, index) => {
        output += `Test Case ${index + 1}: ${
          result.passed ? '✓ PASSED' : '✗ FAILED'
        }\n`
        output += `Input: ${result.input}\n`
        output += `Expected Output: ${result.expectedOutput}\n`
        output += `Your Output: ${result.actualOutput}\n`
        if (result.error) {
          output += `Error: ${result.error}\n`
        }
        output += `\n`
      })

      setCodeOutput(output)
      toast.success(message)
    } catch (error) {
      console.error('Error submitting code:', error)
      let errorMessage = 'Failed to submit code'
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message
      }

      setCodeOutput(
        `=== COMPILATION ERROR ===\n${errorMessage}\n\nPlease check your code for syntax errors.`
      )
      toast.error(errorMessage)
    } finally {
      setIsRunning(false)
    }
  }

  const getCurrentQuestion = () => {
    return test?.sections[currentSection]?.questions[currentQuestion]
  }

  const formatTime = seconds => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs
        .toString()
        .padStart(2, '0')}`
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }

  if (loading) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <div className='animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600'></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-gray-50'>
        <div className='max-w-2xl mx-auto p-8 bg-white rounded-lg shadow-lg text-center'>
          <div className='mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4'>
            <svg
              className='h-6 w-6 text-red-600'
              fill='none'
              strokeWidth='2'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                d='M6 18L18 6M6 6l12 12'
              />
            </svg>
          </div>
          <h1 className='text-2xl font-bold text-gray-900 mb-4'>
            Test Access Error
          </h1>
          <p className='text-gray-600 mb-6'>{error}</p>

          <div className='bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6'>
            <div className='flex items-start'>
              <div className='flex-shrink-0'>
                <svg
                  className='h-5 w-5 text-blue-400'
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
                <h3 className='text-sm font-medium text-blue-800'>
                  What to do next?
                </h3>
                <div className='mt-2 text-sm text-blue-700'>
                  <p>
                    Go to your student dashboard to see all available tests that
                    you have access to.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={() => navigate('/student')}
            className='w-full btn-primary text-lg py-3'
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    )
  }

  if (!testStarted) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-gray-50'>
        <div className='max-w-2xl mx-auto p-8 bg-white rounded-lg shadow-lg'>
          <h1 className='text-2xl font-bold text-gray-900 mb-4'>
            {test.title}
          </h1>
          <p className='text-gray-600 mb-6'>{test.description}</p>

          <div className='space-y-4 mb-8'>
            <div className='flex justify-between'>
              <span className='font-medium'>Duration:</span>
              <span>{test.duration} minutes</span>
            </div>
            <div className='flex justify-between'>
              <span className='font-medium'>Sections:</span>
              <span>{test.sections.length}</span>
            </div>
            <div className='flex justify-between'>
              <span className='font-medium'>Total Questions:</span>
              <span>
                {test.sections.reduce(
                  (total, section) => total + section.questions.length,
                  0
                )}
              </span>
            </div>
          </div>

          {!test.isActive && (
            <div className='bg-red-50 border border-red-200 rounded-lg p-4 mb-6'>
              <div className='flex items-start'>
                <XCircle className='h-5 w-5 text-red-600 mt-0.5 mr-3' />
                <div>
                  <h3 className='font-medium text-red-800'>
                    Test Not Available
                  </h3>
                  <p className='mt-2 text-sm text-red-700'>
                    This test is currently inactive and cannot be started.
                    Please contact your administrator or check back later.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className='bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6'>
            <div className='flex items-start'>
              <AlertTriangle className='h-5 w-5 text-yellow-600 mt-0.5 mr-3' />
              <div>
                <h3 className='font-medium text-yellow-800'>
                  Important Instructions
                </h3>
                <ul className='mt-2 text-sm text-yellow-700 space-y-1'>
                  <li>• The test will be in full-screen mode</li>
                  <li>• Your webcam will be active for proctoring</li>
                  <li>• Copy-paste and right-click are disabled</li>
                  <li>• You cannot go back to previous sections</li>
                  <li>• Make sure you have a stable internet connection</li>
                </ul>
              </div>
            </div>
          </div>

          <button
            onClick={startTest}
            disabled={!test.isActive}
            className={`w-full text-lg py-3 ${
              test.isActive
                ? 'btn-primary'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {test.isActive ? 'Start Test' : 'Test Not Available'}
          </button>
        </div>
      </div>
    )
  }

  const currentQuestionData = getCurrentQuestion()
  const section = test.sections[currentSection]

  return (
    <div
      className={`min-h-screen bg-white ${
        testStarted ? 'fullscreen-test no-select no-context-menu' : ''
      }`}
    >
      {/* Header */}
      <div className='bg-gray-900 text-white p-4 flex justify-between items-center fixed top-0 left-0 right-0 z-40'>
        <div className='flex items-center space-x-6'>
          {testStarted && !isFullscreen && (
            <button
              onClick={() => {
                document.documentElement
                  .requestFullscreen()
                  .then(() => {
                    setIsFullscreen(true)
                    toast.dismiss() // Dismiss any existing fullscreen warnings
                  })
                  .catch(error => {
                    console.error('Failed to enter fullscreen:', error)
                    toast.error('Please allow fullscreen mode')
                  })
              }}
              className='bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded text-sm flex items-center space-x-2 animate-pulse'
            >
              <Maximize2 className='h-4 w-4' />
              <span>Enter Fullscreen</span>
            </button>
          )}
          <div className='flex items-center space-x-2'>
            <img
              src='/images/logo_oa_point.webp'
              alt='OA Point Logo'
              className='h-6 w-6 object-contain'
              style={{ mixBlendMode: 'screen' }}
            />
            <h1 className='text-lg font-semibold'>{test.title}</h1>
          </div>
          <div className='text-sm'>
            Section: {section.name} ({currentSection + 1}/{test.sections.length}
            )
          </div>
        </div>

        <div className='flex items-center space-x-6'>
          {/* Video Controls - Camera always runs in background */}
          <div className='flex items-center space-x-2'>
            <button
              onClick={() => setWebcamCollapsed(!webcamCollapsed)}
              className='bg-gray-700 hover:bg-gray-600 text-white px-3 py-1 rounded text-sm flex items-center space-x-1'
              title={webcamCollapsed ? 'Show Video' : 'Hide Video'}
            >
              <Camera className='h-4 w-4' />
              <span>{webcamCollapsed ? 'Show' : 'Hide'}</span>
            </button>
            <div className='flex items-center space-x-1 text-xs text-green-400'>
              <div className='w-2 h-2 bg-green-400 rounded-full animate-pulse'></div>
              <span>Recording</span>
            </div>
          </div>

          <div className='flex items-center space-x-2 bg-gray-800 px-4 py-2 rounded-lg'>
            <Clock className='h-5 w-5 text-yellow-400' />
            <span
              className={`font-mono text-lg ${
                sectionTimeLeft < 300
                  ? 'text-red-400 animate-pulse'
                  : 'text-yellow-400'
              }`}
            >
              {formatTime(sectionTimeLeft)}
            </span>
          </div>
        </div>
      </div>
      <div className='h-16'></div> {/* Spacer for fixed header */}
      {/* Question Palette - Thin sidebar */}
      <div
        className='question-palette fixed left-0 bg-gray-800 shadow-sm z-30 w-12'
        style={{ top: '80px', height: 'calc(100vh - 80px)' }}
      >
        <div
          className='p-1 pt-3 overflow-y-auto scrollbar-hide'
          style={{ height: '100%' }}
        >
          <div className='flex flex-col space-y-1'>
            {section.questions.map((_, index) => {
              const questionStatus = answers[section.questions[index]._id]
                ? 'bg-green-500 hover:bg-green-600'
                : currentQuestion === index
                ? 'bg-blue-500 hover:bg-blue-600'
                : 'bg-gray-600 hover:bg-gray-700'

              return (
                <button
                  key={index}
                  onClick={() => setCurrentQuestion(index)}
                  className={`h-7 w-7 rounded flex items-center justify-center text-xs font-medium text-white ${questionStatus} transition-colors mx-auto`}
                  title={`Question ${index + 1}${
                    answers[section.questions[index]._id] ? ' (Answered)' : ''
                  }`}
                >
                  {index + 1}
                </button>
              )
            })}
          </div>
        </div>
      </div>
      <div className='flex h-full'>
        {/* Question Panel */}
        <div
          className='flex-1 p-6 overflow-y-auto test-content ml-12'
          style={{ height: 'calc(100vh - 64px)' }}
        >
          <div className='max-w-4xl mx-auto'>
            {/* Question Header */}
            <div className='flex justify-between items-center mb-6'>
              <div className='text-sm text-gray-600'>
                Question {currentQuestion + 1} of {section.questions.length} |
                Section {currentSection + 1} of {test.sections.length}
              </div>
              <div className='flex items-center space-x-2'>
                {currentSection === test.sections.length - 1 ? (
                  <button onClick={handleTestSubmit} className='btn-primary'>
                    Submit Test
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      if (
                        window.confirm(
                          'Are you sure you want to move to the next section? You cannot return to this section once you proceed.'
                        )
                      ) {
                        handleSectionComplete()
                      }
                    }}
                    className='btn-primary'
                  >
                    Next Section
                  </button>
                )}
              </div>
            </div>

            {/* Question Content */}
            <div className='bg-white border rounded-lg p-6 question-content'>
              <h2 className='text-xl font-semibold mb-4'>
                {currentQuestionData.questionText}
              </h2>

              {currentQuestionData.questionImage && (
                <div className='mb-4'>
                  <img
                    src={currentQuestionData.questionImage}
                    alt='Question'
                    className='max-w-full h-auto max-h-96 object-contain rounded border shadow-sm'
                  />
                </div>
              )}

              {/* MCQ Questions */}
              {currentQuestionData.questionType !== 'coding' && (
                <div className='space-y-4 mb-8'>
                  {currentQuestionData.options.map((option, index) => {
                    const isSelected =
                      answers[
                        currentQuestionData._id
                      ]?.selectedOptions?.includes(index) || false
                    return (
                      <label
                        key={index}
                        className={`option-card flex items-center space-x-3 cursor-pointer p-3 border rounded-lg transition-all ${
                          isSelected
                            ? 'selected border-primary-500 bg-primary-50'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <input
                          type={
                            currentQuestionData.questionType ===
                            'single-correct'
                              ? 'radio'
                              : 'checkbox'
                          }
                          name={`question-${currentQuestionData._id}`}
                          value={index}
                          onChange={e => {
                            const currentAnswer = answers[
                              currentQuestionData._id
                            ] || { selectedOptions: [] }
                            let newSelectedOptions

                            if (
                              currentQuestionData.questionType ===
                              'single-correct'
                            ) {
                              newSelectedOptions = [index]
                            } else {
                              newSelectedOptions = e.target.checked
                                ? [...currentAnswer.selectedOptions, index]
                                : currentAnswer.selectedOptions.filter(
                                    opt => opt !== index
                                  )
                            }

                            const answer = {
                              questionType: currentQuestionData.questionType,
                              selectedOptions: newSelectedOptions
                            }

                            handleAnswerChange(currentQuestionData._id, answer)
                            submitAnswer(currentQuestionData._id, answer)
                          }}
                          checked={isSelected}
                          className='w-4 h-4 text-primary-600 flex-shrink-0'
                        />
                        <span
                          className={`${
                            isSelected
                              ? 'text-primary-900 font-medium'
                              : 'text-gray-700'
                          }`}
                        >
                          {option.text}
                        </span>
                      </label>
                    )
                  })}
                </div>
              )}

              {/* Coding Questions */}
              {currentQuestionData.questionType === 'coding' && (
                <div className='space-y-6'>
                  {/* Problem Statement */}
                  <div>
                    <h3 className='font-semibold mb-2'>Problem Statement</h3>
                    <p className='text-gray-700 whitespace-pre-wrap'>
                      {currentQuestionData.codingDetails.problemStatement}
                    </p>
                  </div>

                  {/* Input/Output Format */}
                  <div className='grid md:grid-cols-2 gap-4'>
                    <div>
                      <h3 className='font-semibold mb-2'>Input Format</h3>
                      <p className='text-gray-700 text-sm whitespace-pre-wrap'>
                        {currentQuestionData.codingDetails.inputFormat}
                      </p>
                    </div>
                    <div>
                      <h3 className='font-semibold mb-2'>Output Format</h3>
                      <p className='text-gray-700 text-sm whitespace-pre-wrap'>
                        {currentQuestionData.codingDetails.outputFormat}
                      </p>
                    </div>
                  </div>

                  {/* Examples */}
                  <div>
                    <h3 className='font-semibold mb-2'>Examples</h3>
                    {currentQuestionData.codingDetails.examples.map(
                      (example, index) => (
                        <div
                          key={index}
                          className='bg-gray-50 p-4 rounded mb-4'
                        >
                          <div className='grid md:grid-cols-2 gap-4'>
                            <div>
                              <h4 className='font-medium text-sm'>Input:</h4>
                              <pre className='text-sm bg-white p-2 rounded border mt-1'>
                                {example.input}
                              </pre>
                            </div>
                            <div>
                              <h4 className='font-medium text-sm'>Output:</h4>
                              <pre className='text-sm bg-white p-2 rounded border mt-1'>
                                {example.output}
                              </pre>
                            </div>
                          </div>
                          {example.explanation && (
                            <div className='mt-2'>
                              <h4 className='font-medium text-sm'>
                                Explanation:
                              </h4>
                              <p className='text-sm text-gray-600 mt-1'>
                                {example.explanation}
                              </p>
                            </div>
                          )}
                        </div>
                      )
                    )}
                  </div>

                  {/* Constraints */}
                  <div>
                    <h3 className='font-semibold mb-2'>Constraints</h3>
                    <p className='text-gray-700 text-sm whitespace-pre-wrap'>
                      {currentQuestionData.codingDetails.constraints}
                    </p>
                  </div>
                </div>
              )}

              {/* Question Navigation Buttons */}
              <div className='flex justify-between items-center mt-8 pt-6 border-t border-gray-200'>
                <button
                  onClick={() =>
                    setCurrentQuestion(Math.max(0, currentQuestion - 1))
                  }
                  disabled={currentQuestion === 0}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${
                    currentQuestion === 0
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  <ChevronLeft className='h-4 w-4' />
                  <span>Previous</span>
                </button>

                <div className='flex items-center space-x-2'>
                  {currentQuestion < section.questions.length - 1 ? (
                    <button
                      onClick={() => {
                        // Save current answer and move to next
                        const currentAnswer = answers[currentQuestionData._id]
                        if (currentAnswer) {
                          submitAnswer(currentQuestionData._id, currentAnswer)
                        }
                        setCurrentQuestion(currentQuestion + 1)
                      }}
                      className='flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700'
                    >
                      <span>Save & Next</span>
                      <ChevronRight className='h-4 w-4' />
                    </button>
                  ) : currentSection < test.sections.length - 1 ? (
                    <button
                      onClick={() => setShowSectionModal(true)}
                      className='flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700'
                    >
                      <span>Next Section</span>
                      <ChevronRight className='h-4 w-4' />
                    </button>
                  ) : (
                    <button
                      onClick={() => setShowSubmitModal(true)}
                      className='flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700'
                    >
                      <span>Submit Test</span>
                      <CheckCircle className='h-4 w-4' />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Code Editor (for coding questions) */}
        {currentQuestionData.questionType === 'coding' && (
          <div
            className='w-1/2 border-l bg-gray-50 flex flex-col'
            style={{ height: 'calc(100vh - 64px)' }}
          >
            <div className='p-4 border-b bg-white flex-shrink-0'>
              <div className='flex justify-between items-center'>
                <h3 className='font-semibold'>Code Editor (C++)</h3>
                <div className='flex space-x-2'>
                  <button
                    onClick={runCode}
                    disabled={isRunning}
                    className='btn-secondary flex items-center space-x-2 disabled:opacity-50'
                  >
                    <Play className='h-4 w-4' />
                    <span>{isRunning ? 'Running...' : 'Run Tests'}</span>
                  </button>
                  <button
                    onClick={submitCode}
                    disabled={isRunning}
                    className='btn-primary flex items-center space-x-2 disabled:opacity-50'
                  >
                    <Send className='h-4 w-4' />
                    <span>{isRunning ? 'Submitting...' : 'Submit'}</span>
                  </button>
                </div>
              </div>

              {/* Show current code status */}
              <div className='mt-2 text-sm text-gray-600'>
                {answers[currentQuestionData._id]?.code ? (
                  <span className='text-green-600'>✓ Code submitted</span>
                ) : code.trim() ? (
                  <span className='text-yellow-600'>⚠ Code not submitted</span>
                ) : (
                  <span className='text-gray-500'>No code submitted</span>
                )}
              </div>
            </div>

            <div className='flex-1 flex flex-col min-h-0'>
              <div className='flex-1 min-h-0'>
                <Editor
                  height='100%'
                  defaultLanguage='cpp'
                  value={code}
                  onChange={setCode}
                  theme='vs-dark'
                  options={{
                    minimap: { enabled: false },
                    fontSize: 14,
                    wordWrap: 'on',
                    scrollBeyondLastLine: false,
                    automaticLayout: true
                  }}
                />
              </div>

              <div className='h-64 border-t bg-white flex flex-col flex-shrink-0'>
                <div className='flex border-b'>
                  <div className='flex-1 p-3 border-r'>
                    <h4 className='font-semibold text-sm mb-2'>
                      Test Results:
                    </h4>
                    <div className='h-40 overflow-y-auto bg-gray-50 p-2 rounded text-xs'>
                      <pre className='whitespace-pre-wrap font-mono'>
                        {codeOutput || 'Run your code to see test results...'}
                      </pre>
                    </div>
                  </div>
                  <div className='flex-1 p-3'>
                    <h4 className='font-semibold text-sm mb-2'>
                      Custom Input:
                    </h4>
                    <div className='space-y-2'>
                      <textarea
                        value={customInput}
                        onChange={e => setCustomInput(e.target.value)}
                        placeholder='Enter custom input...'
                        className='w-full h-16 p-2 border rounded text-xs font-mono resize-none'
                      />
                      <button
                        onClick={runCustomInput}
                        disabled={isRunning}
                        className='w-full btn-secondary text-xs py-1 disabled:opacity-50'
                      >
                        {isRunning ? 'Running...' : 'Run Custom'}
                      </button>
                      <div className='h-16 overflow-y-auto bg-gray-50 p-2 rounded'>
                        <pre className='text-xs whitespace-pre-wrap font-mono'>
                          {customOutput || 'Output will appear here...'}
                        </pre>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      {/* Webcam - Always running in background */}
      {webcamEnabled && (
        <>
          {/* Hidden webcam for continuous recording */}
          <div className='fixed top-0 left-0 opacity-0 pointer-events-none'>
            <Webcam
              ref={webcamRef}
              audio={false}
              width={160}
              height={120}
              screenshotFormat='image/jpeg'
              className='bg-black'
            />
          </div>

          {/* Visible webcam when not collapsed */}
          {!webcamCollapsed && (
            <div className='fixed bottom-6 right-6 z-50'>
              <div className='relative rounded-lg overflow-hidden shadow-lg border-2 border-white'>
                <Webcam
                  audio={false}
                  width={200}
                  height={150}
                  screenshotFormat='image/jpeg'
                  className='bg-black'
                />
                <div className='absolute top-0 left-0 right-0 bg-black bg-opacity-75 text-white text-xs py-1 px-2 flex justify-between items-center'>
                  <span>Proctoring Active</span>
                  <button
                    onClick={() => setWebcamCollapsed(true)}
                    className='text-white hover:text-gray-300'
                    title='Hide video'
                  >
                    <Minimize2 className='h-3 w-3' />
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
      {/* Section Confirmation Modal */}
      {showSectionModal && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
          <div className='bg-white rounded-lg p-6 max-w-md mx-4'>
            <div className='flex items-center space-x-3 mb-4'>
              <AlertTriangle className='h-6 w-6 text-yellow-600' />
              <h3 className='text-lg font-semibold text-gray-900'>
                Move to Next Section?
              </h3>
            </div>
            <p className='text-gray-600 mb-6'>
              Are you sure you want to move to the next section? You cannot
              return to this section once you proceed. Make sure you have
              completed all questions in this section.
            </p>
            <div className='flex justify-end space-x-3'>
              <button
                onClick={() => setShowSectionModal(false)}
                className='px-4 py-2 text-gray-600 hover:text-gray-800'
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowSectionModal(false)
                  handleSectionComplete()
                }}
                className='px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700'
              >
                Yes, Next Section
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Submit Test Confirmation Modal */}
      {showSubmitModal && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
          <div className='bg-white rounded-lg p-6 max-w-md mx-4'>
            <div className='flex items-center space-x-3 mb-4'>
              <CheckCircle className='h-6 w-6 text-green-600' />
              <h3 className='text-lg font-semibold text-gray-900'>
                Submit Test?
              </h3>
            </div>
            <p className='text-gray-600 mb-6'>
              Are you sure you want to submit the test? This action cannot be
              undone. Make sure you have answered all questions you want to
              attempt.
            </p>
            <div className='flex justify-end space-x-3'>
              <button
                onClick={() => setShowSubmitModal(false)}
                className='px-4 py-2 text-gray-600 hover:text-gray-800'
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowSubmitModal(false)
                  handleTestSubmit()
                }}
                className='px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700'
              >
                Yes, Submit Test
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default TestInterface
