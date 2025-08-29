const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    console.log('Auth Middleware: Request received');
    console.log('Auth Middleware: Headers:', req.headers);
    
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      console.log('Auth Middleware: No token provided');
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    console.log('Auth Middleware: Token received, length:', token.length);
    console.log('Auth Middleware: JWT_SECRET exists:', !!process.env.JWT_SECRET);
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Auth Middleware: Token decoded successfully:', decoded);
    
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      console.log('Auth Middleware: No user found with ID:', decoded.userId);
      return res.status(401).json({ message: 'Token is not valid' });
    }

    console.log('Auth Middleware: User found:', user._id, user.email, user.role);
    req.user = user;
    console.log('Auth Middleware: Authentication successful');
    next();
  } catch (error) {
    console.error('Auth Middleware: Error:', error.message);
    console.error('Auth Middleware: Error stack:', error.stack);
    
    let message = 'Token is not valid';
    let statusCode = 401;
    
    if (error.name === 'TokenExpiredError') {
      message = 'Token has expired. Please login again.';
    } else if (error.name === 'JsonWebTokenError') {
      message = 'Invalid token format.';
    } else if (error.name === 'NotBeforeError') {
      message = 'Token not active yet.';
    } else if (error.name === 'MongoServerSelectionError' || error.message.includes('connection')) {
      message = 'Database connection error. Please try again.';
      statusCode = 503; // Service Unavailable
      console.error('Auth Middleware: MongoDB connection issue detected');
    } else if (error.name === 'MongoTimeoutError') {
      message = 'Database timeout. Please try again.';
      statusCode = 503;
    }
    
    res.status(statusCode).json({ 
      message, 
      error: error.message,
      type: error.name 
    });
  }
};

const adminAuth = async (req, res, next) => {
  try {
    // First authenticate the user
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(401).json({ message: 'Token is not valid' });
    }

    if (user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Authorization failed' });
  }
};

const studentAuth = async (req, res, next) => {
  try {
    console.log('Student Auth Middleware - Request Headers:', req.headers);
    // First authenticate the user
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      console.log('Student Auth Middleware - No token provided');
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    console.log('Student Auth Middleware - Token received, verifying...');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Student Auth Middleware - Token decoded:', decoded);
    
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      console.log('Student Auth Middleware - No user found with ID:', decoded.userId);
      return res.status(401).json({ message: 'Token is not valid' });
    }

    console.log('Student Auth Middleware - User found:', user._id, 'Role:', user.role);
    
    if (user.role !== 'student') {
      console.log('Student Auth Middleware - Access denied, user is not a student');
      return res.status(403).json({ message: 'Access denied. Students only.' });
    }

    req.user = user;
    console.log('Student Auth Middleware - Authentication successful');
    next();
  } catch (error) {
    console.error('Student Auth Middleware - Error:', error.message);
    
    let message = 'Authorization failed';
    let statusCode = 401;
    
    if (error.name === 'TokenExpiredError') {
      message = 'Your session has expired. Please login again.';
    } else if (error.name === 'JsonWebTokenError') {
      message = 'Invalid authentication token.';
    } else if (error.name === 'MongoServerSelectionError' || error.message.includes('connection')) {
      message = 'Database connection error. Please try again.';
      statusCode = 503; // Service Unavailable
      console.error('Student Auth Middleware: MongoDB connection issue detected');
    } else if (error.name === 'MongoTimeoutError') {
      message = 'Database timeout. Please try again.';
      statusCode = 503;
    }
    
    res.status(statusCode).json({ 
      message, 
      error: error.message,
      type: error.name 
    });
  }
};

module.exports = { auth, adminAuth, studentAuth };