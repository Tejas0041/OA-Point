const mongoose = require('mongoose');

const testCaseSchema = new mongoose.Schema({
  input: { type: String, required: true },
  output: { type: String, required: true },
  isHidden: { type: Boolean, default: false }
});

const exampleSchema = new mongoose.Schema({
  input: { type: String, required: true },
  output: { type: String, required: true },
  explanation: { type: String }
});

const questionSchema = new mongoose.Schema({
  questionText: { type: String, required: true },
  questionImage: { type: String }, // Cloudinary URL
  questionType: {
    type: String,
    enum: ['single-correct', 'multi-correct', 'coding'],
    required: true
  },
  // For MCQ questions
  options: [{
    text: { type: String },
    isCorrect: { type: Boolean, default: false }
  }],
  // For coding questions
  codingDetails: {
    problemStatement: { type: String },
    inputFormat: { type: String },
    outputFormat: { type: String },
    examples: [exampleSchema],
    constraints: { type: String },
    testCases: [testCaseSchema],
    timeLimit: { type: Number, default: 1000 }, // in ms
    memoryLimit: { type: Number, default: 256 } // in MB
  },
  points: { type: Number, default: 1 }
});

const sectionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    enum: ['Aptitude', 'Technical', 'Coding', 'Logical Reasoning', 'English', 'Domain Specific']
  },
  timeLimit: { type: Number, required: true }, // in minutes
  numberOfQuestions: { type: Number, required: true },
  questions: [questionSchema],
  instructions: { type: String },
  order: { type: Number, required: true }
});

const testSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sections: [sectionSchema],
  
  // Test scheduling
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  duration: { type: Number }, // calculated from sections, not required input
  
  // Test settings
  isActive: { type: Boolean, default: false },
  allowedStudents: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  
  // Proctoring settings
  enableCamera: { type: Boolean, default: true },
  enableFullScreen: { type: Boolean, default: true },
  preventCopyPaste: { type: Boolean, default: true },
  preventRightClick: { type: Boolean, default: true },
  
  // Results
  resultsPublished: { type: Boolean, default: false },
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Calculate total duration from sections
testSchema.virtual('totalDuration').get(function() {
  return this.sections.reduce((total, section) => total + section.timeLimit, 0);
});

testSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  // Auto-calculate duration from sections
  this.duration = this.sections.reduce((total, section) => total + section.timeLimit, 0);
  next();
});

module.exports = mongoose.model('Test', testSchema);