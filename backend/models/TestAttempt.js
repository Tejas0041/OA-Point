const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema({
  questionId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  questionType: {
    type: String,
    enum: ['single-correct', 'multi-correct', 'coding'],
    required: true
  },
  // For MCQ answers
  selectedOptions: [{ type: Number }], // indices of selected options
  // For coding answers
  code: { type: String },
  language: { type: String, default: 'cpp' },
  testCaseResults: [{
    input: String,
    expectedOutput: String,
    actualOutput: String,
    passed: Boolean,
    executionTime: Number,
    memoryUsed: Number
  }],
  isCorrect: { type: Boolean },
  points: { type: Number, default: 0 },
  timeSpent: { type: Number, default: 0 }, // in seconds
  submittedAt: { type: Date }
});

const sectionAttemptSchema = new mongoose.Schema({
  sectionId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  sectionName: { type: String, required: true },
  answers: [answerSchema],
  startTime: { type: Date },
  endTime: { type: Date },
  timeSpent: { type: Number, default: 0 }, // in seconds
  isCompleted: { type: Boolean, default: false },
  score: { type: Number, default: 0 }
});

const testAttemptSchema = new mongoose.Schema({
  testId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Test',
    required: true
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Attempt details
  startTime: { type: Date, required: true },
  endTime: { type: Date },
  currentSection: { type: Number, default: 0 },
  isCompleted: { type: Boolean, default: false },
  isSubmitted: { type: Boolean, default: false },
  
  // Section attempts
  sectionAttempts: [sectionAttemptSchema],
  
  // Overall results
  totalScore: { type: Number, default: 0 },
  maxScore: { type: Number, default: 0 },
  percentage: { type: Number, default: 0 },
  
  // Proctoring data
  violations: [{
    type: {
      type: String,
      enum: ['tab-switch', 'copy-paste', 'right-click', 'fullscreen-exit', 'suspicious-activity', 'inspect', 'dev-tools']
    },
    timestamp: { type: Date, default: Date.now },
    description: String
  }],
  
  // Browser and system info
  browserInfo: {
    userAgent: String,
    screenResolution: String,
    timezone: String
  },
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Compound index for unique test attempts per student
testAttemptSchema.index({ testId: 1, studentId: 1 }, { unique: true });

testAttemptSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('TestAttempt', testAttemptSchema);