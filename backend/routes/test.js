const express = require('express');
const Test = require('../models/Test');
const TestAttempt = require('../models/TestAttempt');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Get public test info (for test link validation)
router.get('/:id/info', async (req, res) => {
  try {
    const test = await Test.findById(req.params.id)
      .select('title description startDate endDate duration isActive')
      .populate('createdBy', 'name');

    if (!test) {
      return res.status(404).json({ message: 'Test not found' });
    }

    if (!test.isActive) {
      return res.status(400).json({ message: 'Test is not active' });
    }

    const currentTime = new Date();
    const isAvailable = currentTime >= test.startDate && currentTime <= test.endDate;

    res.json({
      test: {
        title: test.title,
        description: test.description,
        startDate: test.startDate,
        endDate: test.endDate,
        duration: test.duration,
        createdBy: test.createdBy.name,
        isAvailable
      }
    });
  } catch (error) {
    console.error('Get test info error:', error);
    res.status(500).json({ message: 'Error fetching test information' });
  }
});

// Validate test access for student
router.post('/:id/validate-access', auth, async (req, res) => {
  try {
    const test = await Test.findById(req.params.id);

    if (!test) {
      return res.status(404).json({ message: 'Test not found' });
    }

    if (!test.isActive) {
      return res.status(400).json({ message: 'Test is not active' });
    }

    // Check if student is allowed
    if (!test.allowedStudents.includes(req.user._id)) {
      return res.status(403).json({ message: 'You are not authorized to take this test' });
    }

    // Check time window
    const currentTime = new Date();
    if (currentTime < test.startDate) {
      return res.status(400).json({ 
        message: 'Test has not started yet',
        startTime: test.startDate
      });
    }

    if (currentTime > test.endDate) {
      return res.status(400).json({ message: 'Test has ended' });
    }

    // Check if already completed
    const existingAttempt = await TestAttempt.findOne({
      testId: req.params.id,
      studentId: req.user._id
    });

    if (existingAttempt && existingAttempt.isCompleted) {
      return res.status(400).json({ message: 'You have already completed this test' });
    }

    res.json({
      message: 'Access granted',
      canStart: true,
      hasExistingAttempt: !!existingAttempt
    });
  } catch (error) {
    console.error('Validate access error:', error);
    res.status(500).json({ message: 'Error validating test access' });
  }
});

// Get test statistics (for admin dashboard)
router.get('/:id/statistics', auth, async (req, res) => {
  try {
    const test = await Test.findById(req.params.id);

    if (!test) {
      return res.status(404).json({ message: 'Test not found' });
    }

    // Check if user is admin and owns the test
    if (req.user.role !== 'admin' || test.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const totalInvited = test.allowedStudents.length;
    const attempts = await TestAttempt.find({ testId: req.params.id });
    
    const totalAttempted = attempts.length;
    const totalCompleted = attempts.filter(attempt => attempt.isCompleted).length;
    const totalInProgress = attempts.filter(attempt => !attempt.isCompleted).length;

    // Calculate average score
    const completedAttempts = attempts.filter(attempt => attempt.isCompleted);
    const averageScore = completedAttempts.length > 0 
      ? completedAttempts.reduce((sum, attempt) => sum + attempt.percentage, 0) / completedAttempts.length
      : 0;

    // Get score distribution
    const scoreRanges = {
      '90-100': 0,
      '80-89': 0,
      '70-79': 0,
      '60-69': 0,
      '50-59': 0,
      'Below 50': 0
    };

    completedAttempts.forEach(attempt => {
      const percentage = attempt.percentage;
      if (percentage >= 90) scoreRanges['90-100']++;
      else if (percentage >= 80) scoreRanges['80-89']++;
      else if (percentage >= 70) scoreRanges['70-79']++;
      else if (percentage >= 60) scoreRanges['60-69']++;
      else if (percentage >= 50) scoreRanges['50-59']++;
      else scoreRanges['Below 50']++;
    });

    res.json({
      statistics: {
        totalInvited,
        totalAttempted,
        totalCompleted,
        totalInProgress,
        averageScore: Math.round(averageScore * 100) / 100,
        scoreDistribution: scoreRanges,
        completionRate: totalInvited > 0 ? Math.round((totalCompleted / totalInvited) * 100) : 0
      }
    });
  } catch (error) {
    console.error('Get statistics error:', error);
    res.status(500).json({ message: 'Error fetching test statistics' });
  }
});

module.exports = router;