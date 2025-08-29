const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')
const helmet = require('helmet')
require('dotenv').config()

const authRoutes = require('./routes/auth')
const adminRoutes = require('./routes/admin')
const studentRoutes = require('./routes/student')
const testRoutes = require('./routes/test')
const compilerRoutes = require('./routes/compiler')

const app = express()

// Security middleware
app.use(helmet())
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true
  })
)

// Rate limiting removed to prevent 429 errors during development

// Body parsing middleware
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Serve static assets
app.use('/assets', express.static('assets'))

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/student', studentRoutes)
app.use('/api/test', testRoutes)
app.use('/api/compiler', compilerRoutes)

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  })
})

// MongoDB connection with improved configuration
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(
      process.env.MONGODB_URI || 'mongodb://localhost:27017/online-assessment',
      {
        serverSelectionTimeoutMS: 30000, // 30 seconds
        socketTimeoutMS: 45000, // 45 seconds
        maxPoolSize: 10,
        minPoolSize: 5,
        maxIdleTimeMS: 30000,
        retryWrites: true,
        retryReads: true
      }
    )
    console.log(`MongoDB connected: ${conn.connection.host}`)
  } catch (error) {
    console.error('MongoDB connection error:', error.message)
    // Don't exit process, let it retry
    setTimeout(connectDB, 5000) // Retry after 5 seconds
  }
}

// Disable mongoose buffering to fail fast on connection issues
mongoose.set('bufferCommands', false)
// mongoose.set('bufferMaxEntries', 0)

connectDB()

// Check environment variables
console.log('Environment check:')
console.log('- JWT_SECRET exists:', !!process.env.JWT_SECRET)
console.log(
  '- JWT_SECRET length:',
  process.env.JWT_SECRET ? process.env.JWT_SECRET.length : 0
)
console.log(
  '- JWT_SECRET preview:',
  process.env.JWT_SECRET
    ? process.env.JWT_SECRET.substring(0, 10) + '...'
    : 'NOT SET'
)
console.log('- MONGODB_URI exists:', !!process.env.MONGODB_URI)
console.log('- NODE_ENV:', process.env.NODE_ENV)

// Check if .env file is loaded
if (!process.env.JWT_SECRET) {
  console.error('ERROR: JWT_SECRET is not set! Please check your .env file.')
  console.error('Make sure you have a .env file in the backend directory with:')
  console.error('JWT_SECRET=your_super_secret_jwt_key_here')
}

// MongoDB connection event listeners
mongoose.connection.on('connected', () => {
  console.log('Mongoose connected to MongoDB')
})

mongoose.connection.on('error', err => {
  console.error('Mongoose connection error:', err)
})

mongoose.connection.on('disconnected', () => {
  console.log('Mongoose disconnected from MongoDB')
})

// Graceful shutdown
process.on('SIGINT', async () => {
  try {
    await mongoose.connection.close()
    console.log('MongoDB connection closed through app termination')
    process.exit(0)
  } catch (err) {
    console.error('Error during shutdown:', err)
    process.exit(1)
  }
})

// Socket.io for real-time features
const server = require('http').createServer(app)
const io = require('socket.io')(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
})

// Socket connection handling
io.on('connection', socket => {
  console.log('User connected:', socket.id)

  socket.on('join-test', testId => {
    socket.join(testId)
  })

  socket.on('test-activity', data => {
    socket.to(data.testId).emit('activity-update', data)
  })

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id)
  })
})

const PORT = process.env.PORT || 5000
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
