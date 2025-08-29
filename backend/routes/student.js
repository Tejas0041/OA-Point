const express = require('express')
const Test = require('../models/Test')
const TestAttempt = require('../models/TestAttempt')
const User = require('../models/User')
const { studentAuth } = require('../middleware/auth')

const router = express.Router()

// Get available tests for student
router.get('/tests', studentAuth, async (req, res) => {
  try {
    const student = await User.findById(req.user._id)
    if (!student) {
      return res.status(404).json({ message: 'Student not found' })
    }

    let testsList = []

    // Get tests from student's registeredTests
    if (student.registeredTests && student.registeredTests.length > 0) {
      console.log('Student registered tests:', student.registeredTests)

      // Filter out malformed entries and get valid test IDs
      const validRegistrations = student.registeredTests.filter(rt => rt.testId)
      console.log('Valid registrations:', validRegistrations)

      if (validRegistrations.length > 0) {
        const testIds = validRegistrations.map(rt => rt.testId)
        console.log('Test IDs to fetch:', testIds)

        // Fetch all tests
        const tests = await Test.find({ _id: { $in: testIds } })
        console.log('Found tests:', tests.length)

        // Map tests with registration status
        testsList = tests.map(test => {
          // Find registration info
          const registration = validRegistrations.find(
            rt => rt.testId.toString() === test._id.toString()
          )

          return {
            ...test.toObject(),
            status: registration.status || 'to_attempt',
            registeredAt: registration.registeredAt || new Date(),
            completedAt: registration.completedAt,
            score: registration.score,
            hasAttempted: registration.status === 'completed',
            isCompleted: registration.status === 'completed'
          }
        })
      }
    }

    // Send response
    res.json({
      tests: testsList,
      message: `Found ${testsList.length} tests for student ${student.email}`
    })
  } catch (error) {
    console.error('Get student tests error:', error)
    res.status(500).json({ message: 'Error fetching tests: ' + error.message })
  }
})

// Get specific test details for student
router.get('/tests/:id', studentAuth, async (req, res) => {
  try {
    const student = await User.findById(req.user._id)
    if (!student) {
      return res.status(404).json({ message: 'Student not found' })
    }

    // Check if student is registered for this test
    const registration = student.registeredTests.find(
      rt => rt.testId.toString() === req.params.id.toString()
    )
    if (!registration) {
      return res
        .status(404)
        .json({ message: 'Test not found or not registered' })
    }

    // Get test details
    const test = await Test.findById(req.params.id)
    if (!test) {
      return res.status(404).json({ message: 'Test not found' })
    }

    // Get attempt if exists
    const attempt = await TestAttempt.findOne({
      testId: test._id,
      studentId: student._id
    })

    res.json({
      test: {
        ...test.toObject(),
        status: registration.status,
        registeredAt: registration.registeredAt,
        completedAt: registration.completedAt,
        score: registration.score,
        hasAttempted: registration.status === 'completed',
        isCompleted: registration.status === 'completed',
        isActive: test.isActive,
        attempt: attempt
      },
      existingAttempt: attempt
    })
  } catch (error) {
    console.error('Get test details error:', error)
    res.status(500).json({ message: 'Error fetching test details' })
  }
})

// Submit test
router.post('/tests/:id/submit', studentAuth, async (req, res) => {
  try {
    const testId = req.params.id

    // Get student and validate registration
    const student = await User.findById(req.user._id)
    if (!student) {
      return res.status(404).json({ message: 'Student not found' })
    }

    // Find the test registration
    const testIndex = student.registeredTests.findIndex(
      rt => rt.testId.toString() === testId.toString()
    )
    if (testIndex === -1) {
      return res
        .status(404)
        .json({ message: 'Test not found or not registered' })
    }

    // Find existing attempt
    let attempt = await TestAttempt.findOne({
      testId,
      studentId: student._id
    })

    if (!attempt) {
      return res.status(404).json({ message: 'Test attempt not found' })
    }

    // Calculate score based on answers
    const test = await Test.findById(testId)
    let totalScore = 0
    let maxScore = 0

    console.log('=== SCORE CALCULATION DEBUG ===')
    console.log('Test ID:', testId)
    console.log('Student ID:', req.user._id)
    console.log('Attempt ID:', attempt._id)
    console.log('Section attempts count:', attempt.sectionAttempts.length)

    for (const section of test.sections) {
      console.log('\n--- Processing Section:', section.name, '---')
      for (const question of section.questions) {
        const questionPoints = question.points || 1
        maxScore += questionPoints
        
        console.log('\nQuestion:', question.questionText)
        console.log('Question ID:', question._id)
        console.log('Question type:', question.questionType)
        console.log('Points:', questionPoints)
        
        // Find user's answer for this question
        let userAnswer = null
        for (const sectionAttempt of attempt.sectionAttempts) {
          console.log('Checking section attempt:', sectionAttempt.sectionName, 'with', sectionAttempt.answers.length, 'answers')
          const answer = sectionAttempt.answers.find(a => {
            console.log('Comparing:', a.questionId.toString(), 'vs', question._id.toString())
            return a.questionId.toString() === question._id.toString()
          })
          if (answer) {
            userAnswer = answer
            console.log('Found user answer!')
            break
          }
        }

        console.log('User answer found:', !!userAnswer)
        if (userAnswer) {
          console.log('User answer details:', {
            questionType: userAnswer.questionType,
            selectedOptions: userAnswer.selectedOptions,
            code: userAnswer.code ? 'present' : 'none'
          })
          console.log('Question options:', question.options.map((opt, idx) => ({ index: idx, text: opt.text, isCorrect: opt.isCorrect })))
          
          let isCorrect = false
          
          // Check if answer is correct and award points
          if (question.questionType === 'single-correct') {
            // Find the correct option index
            const correctOptionIndex = question.options.findIndex(option => option.isCorrect)
            console.log('Correct option index:', correctOptionIndex)
            console.log('User selected:', userAnswer.selectedOptions)
            
            if (userAnswer.selectedOptions && 
                userAnswer.selectedOptions.length === 1 && 
                userAnswer.selectedOptions[0] === correctOptionIndex) {
              isCorrect = true
              totalScore += questionPoints
              console.log('✅ CORRECT! Added', questionPoints, 'points')
            } else {
              console.log('❌ INCORRECT')
            }
          } else if (question.questionType === 'multi-correct') {
            // Find all correct option indices
            const correctOptionIndices = question.options
              .map((option, index) => option.isCorrect ? index : -1)
              .filter(index => index !== -1)
            console.log('Correct option indices:', correctOptionIndices)
            
            if (userAnswer.selectedOptions && correctOptionIndices.length > 0) {
              const userSet = new Set(userAnswer.selectedOptions)
              const correctSet = new Set(correctOptionIndices)
              if (userSet.size === correctSet.size && 
                  [...userSet].every(x => correctSet.has(x))) {
                isCorrect = true
                totalScore += questionPoints
                console.log('✅ CORRECT! Added', questionPoints, 'points')
              } else {
                console.log('❌ INCORRECT')
              }
            }
          } else if (question.questionType === 'coding') {
            if (userAnswer.testCaseResults && userAnswer.testCaseResults.length > 0) {
              const passedCount = userAnswer.testCaseResults.filter(result => result.passed).length
              const totalTestCases = userAnswer.testCaseResults.length
              // Award partial marks based on passed test cases
              const partialScore = (passedCount / totalTestCases) * questionPoints
              totalScore += partialScore
              isCorrect = passedCount === totalTestCases
              console.log('Coding result - passed:', passedCount, 'total:', totalTestCases, 'score:', partialScore)
            }
          }
        } else {
          console.log('❌ No user answer found for this question')
        }
      }
    }

    console.log('\n=== FINAL CALCULATION ===')
    console.log('Total Score:', totalScore)
    console.log('Max Score:', maxScore)
    console.log('Percentage:', maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0)
    console.log('=== END DEBUG ===\n')

    // Update attempt
    attempt.endTime = new Date()
    attempt.isCompleted = true
    attempt.isSubmitted = true
    attempt.totalScore = totalScore
    attempt.maxScore = maxScore
    attempt.percentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0
    await attempt.save()

    // Update student registration status
    student.registeredTests[testIndex].status = 'completed'
    student.registeredTests[testIndex].completedAt = new Date()
    student.registeredTests[testIndex].score = totalScore
    student.registeredTests[testIndex].percentage = attempt.percentage
    
    // Update test statistics
    console.log('Before updating statistics:', student.testStatistics)
    const updatedStats = student.updateTestStatistics()
    console.log('After updating statistics:', updatedStats)
    await student.save()

    res.json({ 
      message: 'Test submitted successfully',
      score: totalScore,
      maxScore: maxScore,
      percentage: attempt.percentage
    })
  } catch (error) {
    console.error('Submit test error:', error)
    res.status(500).json({ message: 'Error submitting test' })
  }
})

// Start test
router.post('/tests/:id/start', studentAuth, async (req, res) => {
  try {
    const testId = req.params.id
    const { browserInfo } = req.body

    console.log('Start test request:', { testId, userId: req.user._id, browserInfo })

    // Get student and validate registration
    const student = await User.findById(req.user._id)
    if (!student) {
      return res.status(404).json({ message: 'Student not found' })
    }

    console.log('Student found:', { id: student._id, email: student.email })

    // Check if student is registered for this test
    const registration = student.registeredTests.find(
      rt => rt.testId.toString() === testId.toString()
    )
    if (!registration) {
      console.log('Registration not found. Student tests:', student.registeredTests)
      return res.status(404).json({ message: 'Test not found or not registered' })
    }

    console.log('Registration found:', registration)

    // Get test details
    const test = await Test.findById(testId)
    if (!test) {
      return res.status(404).json({ message: 'Test not found' })
    }

    console.log('Test found:', { id: test._id, title: test.title, isActive: test.isActive })

    // Check if test is active
    if (!test.isActive) {
      return res.status(400).json({ message: 'Test is not currently active' })
    }

    // Check if already completed
    if (registration.status === 'completed') {
      return res.status(400).json({ message: 'Test already completed' })
    }

    // Check for existing attempt
    let attempt = await TestAttempt.findOne({
      testId: test._id,
      studentId: student._id
    })

    console.log('Existing attempt:', attempt ? 'found' : 'not found')

    if (!attempt) {
      console.log('Creating new attempt...')
      // Create new attempt
      attempt = new TestAttempt({
        testId: test._id,
        studentId: student._id,
        startTime: new Date(),
        browserInfo,
        currentSection: 0,
        sectionAttempts: [],
        violations: [],
        isCompleted: false
      })
      
      console.log('Attempt object created, saving...')
      await attempt.save()
      console.log('Attempt saved successfully:', attempt._id)
    }

    res.json({ 
      message: 'Test started successfully',
      attemptId: attempt._id,
      startTime: attempt.startTime
    })
  } catch (error) {
    console.error('Start test error:', error)
    console.error('Error stack:', error.stack)
    res.status(500).json({ message: 'Error starting test: ' + error.message })
  }
})

// Submit answer
router.post('/tests/:id/submit-answer', studentAuth, async (req, res) => {
  try {
    const testId = req.params.id
    const { questionId, sectionId, answer, timeSpent } = req.body

    // Find existing attempt
    let attempt = await TestAttempt.findOne({
      testId,
      studentId: req.user._id
    })

    if (!attempt) {
      return res.status(404).json({ message: 'Test attempt not found' })
    }

    // Find or create section attempt
    let sectionAttempt = attempt.sectionAttempts.find(
      sa => sa.sectionId.toString() === sectionId.toString()
    )

    if (!sectionAttempt) {
      sectionAttempt = {
        sectionId,
        sectionName: 'Section',
        answers: [],
        startTime: new Date(),
        isCompleted: false,
        score: 0
      }
      attempt.sectionAttempts.push(sectionAttempt)
    }

    // Update or add answer in section
    const existingAnswerIndex = sectionAttempt.answers.findIndex(
      a => a.questionId.toString() === questionId.toString()
    )

    const answerData = {
      questionId,
      questionType: answer.questionType,
      selectedOptions: answer.selectedOptions,
      code: answer.code,
      language: answer.language,
      testCaseResults: answer.testCaseResults,
      timeSpent: timeSpent || 0,
      submittedAt: new Date()
    }

    if (existingAnswerIndex >= 0) {
      sectionAttempt.answers[existingAnswerIndex] = answerData
    } else {
      sectionAttempt.answers.push(answerData)
    }

    await attempt.save()
    res.json({ message: 'Answer submitted successfully' })
  } catch (error) {
    console.error('Submit answer error:', error)
    res.status(500).json({ message: 'Error submitting answer' })
  }
})

// Complete section
router.post('/tests/:id/complete-section', studentAuth, async (req, res) => {
  try {
    const testId = req.params.id
    const { sectionId } = req.body

    // Find existing attempt
    let attempt = await TestAttempt.findOne({
      testId,
      studentId: req.user._id
    })

    if (!attempt) {
      return res.status(404).json({ message: 'Test attempt not found' })
    }

    // Update current section
    attempt.currentSection += 1
    await attempt.save()

    res.json({ message: 'Section completed successfully' })
  } catch (error) {
    console.error('Complete section error:', error)
    res.status(500).json({ message: 'Error completing section' })
  }
})

// Report violation
router.post('/tests/:id/report-violation', studentAuth, async (req, res) => {
  try {
    const testId = req.params.id
    const { type, description } = req.body

    // Find existing attempt
    let attempt = await TestAttempt.findOne({
      testId,
      studentId: req.user._id
    })

    if (!attempt) {
      return res.status(404).json({ message: 'Test attempt not found' })
    }

    // Add violation
    attempt.violations.push({
      type,
      description,
      timestamp: new Date()
    })

    await attempt.save()
    res.json({ message: 'Violation reported successfully' })
  } catch (error) {
    console.error('Report violation error:', error)
    res.status(500).json({ message: 'Error reporting violation' })
  }
})

// Get test results
router.get('/tests/:id/results', studentAuth, async (req, res) => {
  try {
    const testId = req.params.id

    // Get student and validate registration
    const student = await User.findById(req.user._id)
    if (!student) {
      return res.status(404).json({ message: 'Student not found' })
    }

    // Check if student is registered for this test
    const registration = student.registeredTests.find(
      rt => rt.testId.toString() === testId.toString()
    )
    if (!registration) {
      return res.status(404).json({ message: 'Test not found or not registered' })
    }

    // Get test details
    const test = await Test.findById(testId)
    if (!test) {
      return res.status(404).json({ message: 'Test not found' })
    }

    // Get attempt
    const attempt = await TestAttempt.findOne({
      testId: test._id,
      studentId: student._id
    })

    if (!attempt) {
      return res.status(404).json({ message: 'Test attempt not found' })
    }

    res.json({
      test: test.toObject(),
      attempt: attempt.toObject(),
      registration
    })
  } catch (error) {
    console.error('Get test results error:', error)
    res.status(500).json({ message: 'Error fetching test results' })
  }
})

// Get test history
router.get('/test-history', studentAuth, async (req, res) => {
  try {
    const student = await User.findById(req.user._id).populate(
      'registeredTests.testId'
    )
    if (!student) {
      return res.status(404).json({ message: 'Student not found' })
    }

    res.json({ registeredTests: student.registeredTests })
  } catch (error) {
    console.error('Get test history error:', error)
    res.status(500).json({ message: 'Error fetching test history' })
  }
})

// Get test statistics
router.get('/statistics', studentAuth, async (req, res) => {
  try {
    console.log('Statistics endpoint called for user:', req.user._id)
    const student = await User.findById(req.user._id)
    if (!student) {
      console.log('Student not found:', req.user._id)
      return res.status(404).json({ message: 'Student not found' })
    }

    console.log('Student found:', student.name)
    console.log('Current testStatistics:', student.testStatistics)
    console.log('Registered tests count:', student.registeredTests?.length || 0)

    // Update statistics before returning
    const stats = student.updateTestStatistics()
    console.log('Updated stats:', stats)
    await student.save()

    res.json({ statistics: stats })
  } catch (error) {
    console.error('Get statistics error:', error)
    res.status(500).json({ message: 'Error fetching statistics' })
  }
})

// Debug endpoint to check user data
router.get('/debug-user', studentAuth, async (req, res) => {
  try {
    const student = await User.findById(req.user._id)
    if (!student) {
      return res.status(404).json({ message: 'Student not found' })
    }

    res.json({
      name: student.name,
      email: student.email,
      registeredTestsCount: student.registeredTests?.length || 0,
      registeredTests: student.registeredTests,
      currentTestStatistics: student.testStatistics
    })
  } catch (error) {
    console.error('Debug user error:', error)
    res.status(500).json({ message: 'Error fetching user debug info' })
  }
})

module.exports = router
