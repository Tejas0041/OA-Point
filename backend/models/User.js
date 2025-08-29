const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  role: {
    type: String,
    enum: ['admin', 'student'],
    default: 'student'
  },
  enrollmentNumber: {
    type: String,
    sparse: true,
    unique: true,
    match: /^[A-Za-z0-9]+$/ // Alphanumeric validation
  },
  registrationNumber: {
    type: String,
    sparse: true,
    unique: true,
    match: /^[A-Za-z0-9]+$/ // Alphanumeric validation
  },
  registeredTests: [
    {
      testId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Test'
      },
      status: {
        type: String,
        enum: ['to_attempt', 'missed', 'completed'],
        default: 'to_attempt'
      },
      score: {
        type: Number,
        default: null
      },
      percentage: {
        type: Number,
        default: null
      },
      registeredAt: {
        type: Date,
        default: Date.now
      },
      completedAt: {
        type: Date,
        default: null
      }
    }
  ],
  testStatistics: {
    totalTests: { type: Number, default: 0 },
    completedTests: { type: Number, default: 0 },
    toAttemptTests: { type: Number, default: 0 },
    missedTests: { type: Number, default: 0 },
    averageScore: { type: Number, default: 0 },
    totalScore: { type: Number, default: 0 },
    lastUpdated: { type: Date, default: Date.now }
  },
  phone: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationToken: {
    type: String,
    default: null
  },
  emailVerificationExpires: {
    type: Date,
    default: null
  },
  passwordResetToken: {
    type: String,
    default: null
  },
  passwordResetExpires: {
    type: Date,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
})

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next()

  try {
    const salt = await bcrypt.genSalt(10)
    this.password = await bcrypt.hash(this.password, salt)
    next()
  } catch (error) {
    next(error)
  }
})

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password)
}

// Generate email verification token
userSchema.methods.generateEmailVerificationToken = function () {
  const crypto = require('crypto')
  const token = crypto.randomBytes(32).toString('hex')
  this.emailVerificationToken = token
  this.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000 // 24 hours
  return token
}

// Generate password reset token
userSchema.methods.generatePasswordResetToken = function () {
  const crypto = require('crypto')
  const token = crypto.randomBytes(32).toString('hex')
  this.passwordResetToken = token
  this.passwordResetExpires = Date.now() + 60 * 60 * 1000 // 1 hour
  return token
}

// Update test statistics method
userSchema.methods.updateTestStatistics = function () {
  const stats = {
    totalTests: this.registeredTests.length,
    completedTests: this.registeredTests.filter(t => t.status === 'completed')
      .length,
    toAttemptTests: this.registeredTests.filter(t => t.status === 'to_attempt')
      .length,
    missedTests: this.registeredTests.filter(t => t.status === 'missed').length,
    totalScore: 0,
    averageScore: 0
  }

  const completedTests = this.registeredTests.filter(
    t => t.status === 'completed' && (t.percentage !== null || t.score !== null)
  )
  if (completedTests.length > 0) {
    // Use percentage if available, otherwise calculate from score
    const totalPercentage = completedTests.reduce((sum, t) => {
      return sum + (t.percentage || 0)
    }, 0)
    stats.averageScore = Math.round(totalPercentage / completedTests.length)
    stats.totalScore = completedTests.reduce(
      (sum, t) => sum + (t.score || 0),
      0
    )
  }

  this.testStatistics = {
    ...stats,
    lastUpdated: new Date()
  }

  return this.testStatistics
}

module.exports = mongoose.model('User', userSchema)
