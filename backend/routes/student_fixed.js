const express = require('express');
const Test = require('../models/Test');
const TestAttempt = require('../models/TestAttempt');
const { studentAuth } = require('../middleware/auth');

const router = express.Router();

// Test route to check if student routes are working
router.get('/test-route', studentAuth, (req, res) => {
  res.json({ 
    message: 'Student routes are working', 
    user: {
      id: req.user._id,
      email: req.user.email,
      role: req.user.role
    },
    timestamp: new Date().toISOString()
  });
});

// Get available tests for student
router.get('/tests', studentAuth, async (req, res) => {
  try {
    console.log('Student tests request received for user:', req.user._id);
    const currentTime = new Date();
    console.log('Current time:', currentTime);
    
    // First check if there are any tests at all in the database
    const allTests = await Test.find({});
    console.log('Total tests in database:', allTests.length);
    if (allTests.length === 0) {
      console.log('No tests found in the database at all');
      return res.json({
        success: true,
        message: 'No tests available in the system',
        tests: []
      });
    }
    
    // Check if any tests have this student in allowedStudents
    const testsForThisStudent = await Test.find({
      allowedStudents: req.user._id
    });
    console.log('Tests with this student in allowedStudents:', testsForThisStudent.length);
    
    // Show only tests where student is in allowedStudents array
    console.log('Querying tests with criteria:', {
      isActive: true,
      allowedStudents: req.user._id,
      startDate: { $lte: currentTime },
      endDate: { $gte: currentTime }
    });
    
    const tests = await Test.find({
      isActive: true,
      allowedStudents: req.user._id,
      startDate: { $lte: currentTime },
      endDate: { $gte: currentTime }
    }).select('title description startDate endDate duration sections');
    
    console.log(`Found ${tests.length} tests for student`);

    // Check if student has already attempted each test
    console.log('Checking test attempts...');
    const testsWithAttempts = await Promise.all(
      tests.map(async (test) => {
        const attempt = await TestAttempt.findOne({
          testId: test._id,
          studentId: req.user._id
        });

        return {
          ...test.toObject(),
          hasAttempted: !!attempt,
          isCompleted: attempt?.isCompleted || false,
          canRetake: false // Set based on your retake policy
        };
      })
    );
    
    console.log('Sending response with tests:', testsWithAttempts.length);
    // Ensure we're sending the tests array in the expected format with success flag
    // Create a sample test if no tests are found
    if (testsWithAttempts.length === 0) {
      console.log('No tests found for student, creating a sample test for debugging');
      
      // Create a sample test object for debugging
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const sampleTest = {
        _id: 'sample-test-id',
        title: 'Sample Test',
        description: 'This is a sample test for debugging purposes',
        startDate: now,
        endDate: tomorrow,
        duration: 60,
        sections: [{ name: 'Sample Section', questions: [{ questionText: 'Sample Question' }] }],
        hasAttempted: false,
        isCompleted: false
      };
      
      testsWithAttempts.push(sampleTest);
    }
    
    res.json({
      success: true,
      message: 'Tests retrieved successfully',
      tests: testsWithAttempts
    });
    console.log('Response sent with tests:', testsWithAttempts.length);
  } catch (error) {
    console.error('Get student tests error:', error);
    console.error('Error stack:', error.stack);
    
    // Send more detailed error message
    let errorMessage = 'Error fetching tests';
    let statusCode = 500;
    if (error.name === 'CastError') {
      errorMessage = 'Invalid ID format';
      statusCode = 400;
    } else if (error.name === 'ValidationError') {
      errorMessage = 'Validation error: ' + Object.values(error.errors).map(err => err.message).join(', ');
      statusCode = 400;
    } else if (error.code === 11000) {
      errorMessage = 'Duplicate key error';
      statusCode = 409;
    }
    
    res.status(statusCode).json({ 
      success: false,
      message: errorMessage,
      tests: [],
      ...(process.env.NODE_ENV === 'development' && { 
        stack: error.stack,
        error: error.message 
      })
    });
  }
});

// Get specific test details
router.get('/tests/:id', studentAuth, async (req, res) => {
  try {
    const test = await Test.findOne({
      _id: req.params.id,
      isActive: true
    });

    if (!test) {
      return res.status(404).json({ message: 'Test not found' });
    }

    // Check if student is allowed to access this test
    if (!test.allowedStudents.includes(req.user._id)) {
      return res.status(403).json({ message: 'You are not authorized to access this test' });
    }

    // Check if test is within time window
    const currentTime = new Date();
    if (currentTime < test.startDate || currentTime > test.endDate) {
      return res.status(400).json({ message: 'Test is not available at this time' });
    }

    // Check if student has already attempted
    const existingAttempt = await TestAttempt.findOne({
      testId: req.params.id,
      studentId: req.user._id
    });

    if (existingAttempt && existingAttempt.isCompleted) {
      return res.status(400).json({ message: 'You have already completed this test' });
    }

    // Return test without answers for security
    const testData = {
      _id: test._id,
      title: test.title,
      description: test.description,
      sections: test.sections.map(section => ({
        _id: section._id,
        name: section.name,
        timeLimit: section.timeLimit,
        numberOfQuestions: section.numberOfQuestions,
        instructions: section.instructions,
        order: section.order,
        questions: section.questions.map(question => ({
          _id: question._id,
          questionText: question.questionText,
          questionImage: question.questionImage,
          questionType: question.questionType,
          options: question.questionType !== 'coding' ? 
            question.options.map(opt => ({ text: opt.text })) : undefined,
          codingDetails: question.questionType === 'coding' ? {
            problemStatement: question.codingDetails.problemStatement,
            inputFormat: question.codingDetails.inputFormat,
            outputFormat: question.codingDetails.outputFormat,
            examples: question.codingDetails.examples,
            constraints: question.codingDetails.constraints,
            timeLimit: question.codingDetails.timeLimit,
            memoryLimit: question.codingDetails.memoryLimit
          } : undefined,
          points: question.points,
          difficulty: question.difficulty
        }))
      })),
      duration: test.duration,
      enableCamera: test.enableCamera,
      enableFullScreen: test.enableFullScreen,
      preventCopyPaste: test.preventCopyPaste,
      preventRightClick: test.preventRightClick
    };

    res.json({ test: testData, existingAttempt });
  } catch (error) {
    console.error('Get test details error:', error);
    res.status(500).json({ message: 'Error fetching test details' });
  }
});

// Start test attempt
router.post('/tests/:id/start', studentAuth, async (req, res) => {
  try {
    const { browserInfo } = req.body;
    
    const test = await Test.findOne({
      _id: req.params.id,
      isActive: true
    });

    if (!test) {
      return res.status(404).json({ message: 'Test not found' });
    }

    // Check if student is allowed to access this test
    if (!test.allowedStudents.includes(req.user._id)) {
      return res.status(403).json({ message: 'You are not authorized to access this test' });
    }

    // Check if test is within time window
    const currentTime = new Date();
    if (currentTime < test.startDate || currentTime > test.endDate) {
      return res.status(400).json({ message: 'Test is not available at this time' });
    }

    // Check if student has already attempted
    let attempt = await TestAttempt.findOne({
      testId: req.params.id,
      studentId: req.user._id
    });

    if (attempt && attempt.isCompleted) {
      return res.status(400).json({ message: 'You have already completed this test' });
    }

    // Create new attempt if doesn't exist
    if (!attempt) {
      // Calculate max score
      const maxScore = test.sections.reduce((total, section) => {
        return total + section.questions.reduce((sectionTotal, question) => {
          return sectionTotal + question.points;
        }, 0);
      }, 0);

      attempt = new TestAttempt({
        testId: req.params.id,
        studentId: req.user._id,
        startTime: currentTime,
        maxScore,
        browserInfo,
        sectionAttempts: test.sections.map(section => ({
          sectionId: section._id,
          sectionName: section.name,
          answers: []
        }))
      });

      await attempt.save();
    }

    res.json({
      message: 'Test started successfully',
      attemptId: attempt._id,
      startTime: attempt.startTime
    });
  } catch (error) {
    console.error('Start test error:', error);
    res.status(500).json({ message: 'Error starting test' });
  }
});

// Submit answer
router.post('/tests/:testId/submit-answer', studentAuth, async (req, res) => {
  try {
    const { questionId, sectionId, answer, timeSpent } = req.body;
    
    const attempt = await TestAttempt.findOne({
      testId: req.params.testId,
      studentId: req.user._id,
      isCompleted: false
    });

    if (!attempt) {
      return res.status(404).json({ message: 'Test attempt not found' });
    }

    // Find the section attempt
    const sectionAttempt = attempt.sectionAttempts.find(
      sa => sa.sectionId.toString() === sectionId
    );

    if (!sectionAttempt) {
      return res.status(404).json({ message: 'Section not found' });
    }

    // Find or create answer
    let answerIndex = sectionAttempt.answers.findIndex(
      a => a.questionId.toString() === questionId
    );

    const answerData = {
      questionId,
      questionType: answer.questionType,
      selectedOptions: answer.selectedOptions,
      code: answer.code,
      language: answer.language,
      timeSpent,
      submittedAt: new Date()
    };

    if (answerIndex >= 0) {
      // Update existing answer
      sectionAttempt.answers[answerIndex] = answerData;
    } else {
      // Add new answer
      sectionAttempt.answers.push(answerData);
    }

    await attempt.save();

    res.json({ message: 'Answer submitted successfully' });
  } catch (error) {
    console.error('Submit answer error:', error);
    res.status(500).json({ message: 'Error submitting answer' });
  }
});

// Complete section
router.post('/tests/:testId/complete-section', studentAuth, async (req, res) => {
  try {
    const { sectionId } = req.body;
    
    const attempt = await TestAttempt.findOne({
      testId: req.params.testId,
      studentId: req.user._id,
      isCompleted: false
    });

    if (!attempt) {
      return res.status(404).json({ message: 'Test attempt not found' });
    }

    // Find the section attempt
    const sectionAttempt = attempt.sectionAttempts.find(
      sa => sa.sectionId.toString() === sectionId
    );

    if (!sectionAttempt) {
      return res.status(404).json({ message: 'Section not found' });
    }

    sectionAttempt.isCompleted = true;
    sectionAttempt.endTime = new Date();
    
    // Move to next section
    attempt.currentSection += 1;

    await attempt.save();

    res.json({ 
      message: 'Section completed successfully',
      nextSection: attempt.currentSection
    });
  } catch (error) {
    console.error('Complete section error:', error);
    res.status(500).json({ message: 'Error completing section' });
  }
});

// Submit entire test
router.post('/tests/:testId/submit', studentAuth, async (req, res) => {
  try {
    const attempt = await TestAttempt.findOne({
      testId: req.params.testId,
      studentId: req.user._id,
      isCompleted: false
    });

    if (!attempt) {
      return res.status(404).json({ message: 'Test attempt not found' });
    }

    // Get test details for scoring
    const test = await Test.findById(req.params.testId);
    
    // Calculate scores
    let totalScore = 0;
    
    for (const sectionAttempt of attempt.sectionAttempts) {
      const section = test.sections.find(s => s._id.toString() === sectionAttempt.sectionId.toString());
      let sectionScore = 0;
      
      for (const answer of sectionAttempt.answers) {
        const question = section.questions.find(q => q._id.toString() === answer.questionId.toString());
        
        if (question.questionType === 'single-correct') {
          const correctOption = question.options.findIndex(opt => opt.isCorrect);
          if (answer.selectedOptions && answer.selectedOptions[0] === correctOption) {
            answer.isCorrect = true;
            answer.points = question.points;
            sectionScore += question.points;
          }
        } else if (question.questionType === 'multi-correct') {
          const correctOptions = question.options
            .map((opt, index) => opt.isCorrect ? index : -1)
            .filter(index => index !== -1);
          
          const selectedSet = new Set(answer.selectedOptions || []);
          const correctSet = new Set(correctOptions);
          
          if (selectedSet.size === correctSet.size && 
              [...selectedSet].every(opt => correctSet.has(opt))) {
            answer.isCorrect = true;
            answer.points = question.points;
            sectionScore += question.points;
          }
        }
        // Coding questions will be evaluated separately
      }
      
      sectionAttempt.score = sectionScore;
      totalScore += sectionScore;
    }

    // Update attempt
    attempt.isCompleted = true;
    attempt.isSubmitted = true;
    attempt.endTime = new Date();
    attempt.totalScore = totalScore;
    attempt.percentage = (totalScore / attempt.maxScore) * 100;

    await attempt.save();

    res.json({
      message: 'Test submitted successfully',
      score: totalScore,
      maxScore: attempt.maxScore,
      percentage: attempt.percentage
    });
  } catch (error) {
    console.error('Submit test error:', error);
    res.status(500).json({ message: 'Error submitting test' });
  }
});

// Get test attempt status
router.get('/tests/:testId/attempt', studentAuth, async (req, res) => {
  try {
    const attempt = await TestAttempt.findOne({
      testId: req.params.testId,
      studentId: req.user._id
    });

    if (!attempt) {
      return res.status(404).json({ message: 'Test attempt not found' });
    }

    res.json({ attempt });
  } catch (error) {
    console.error('Get attempt error:', error);
    res.status(500).json({ message: 'Error fetching attempt' });
  }
});

// Report violation
router.post('/tests/:testId/report-violation', studentAuth, async (req, res) => {
  try {
    const { type, description } = req.body;
    
    const attempt = await TestAttempt.findOne({
      testId: req.params.testId,
      studentId: req.user._id,
      isCompleted: false
    });

    if (!attempt) {
      return res.status(404).json({ message: 'Test attempt not found' });
    }

    attempt.violations.push({
      type,
      description,
      timestamp: new Date()
    });

    await attempt.save();

    res.json({ message: 'Violation reported' });
  } catch (error) {
    console.error('Report violation error:', error);
    res.status(500).json({ message: 'Error reporting violation' });
  }
});

module.exports = router;

