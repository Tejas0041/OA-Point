const express = require('express');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const User = require('../models/User');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Configure nodemailer
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role, registrationNumber, phone } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create new user (not verified initially)
    const user = new User({
      name,
      email,
      password,
      role: role || 'student',
      registrationNumber,
      phone,
      isEmailVerified: false
    });

    // Generate email verification token
    const verificationToken = user.generateEmailVerificationToken();
    await user.save();

    // Send verification email
    const verificationUrl = `${process.env.CLIENT_URL}/verify-email?token=${verificationToken}`;
    
    const mailOptions = {
      from: `"OA Point Team" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'OA Point - Verify Your Email Address',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
          <div style="padding: 25px; text-align: center; background: white; border-bottom: 1px solid #e5e7eb;">
            <img src="https://drive.google.com/file/d/1FQR1s8JZvJcBbdvg3m2TNv0rpIOcqJvK/view?usp=sharing" alt="OA Point Logo" style="height: 60px; width: auto; margin-bottom: 15px;" />
            <h1 style="color: #333; margin: 0; font-size: 28px; font-weight: bold;">OA Point</h1>
            <p style="color: #666; margin: 8px 0 0 0; font-size: 16px; font-weight: 500;">Online Assessment Platform</p>
          </div>
          
          <div style="padding: 35px 30px; background-color: #f8f9fa;">
            <h2 style="color: #333; margin-bottom: 25px; font-size: 24px; font-weight: 600; text-align: center;">Email Verification</h2>
            
            <p style="font-size: 18px; color: #333; margin-bottom: 25px;">Dear <strong>${name}</strong>,</p>
            
            <p style="font-size: 16px; color: #374151; line-height: 1.6; margin-bottom: 25px;">
              Thank you for registering with <strong>OA Point</strong>! To complete your registration and start using our platform, please verify your email address by clicking the button below.
            </p>
            
            <div style="text-align: center; margin: 35px 0;">
              <a href="${verificationUrl}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                ✅ Verify Email Address
              </a>
            </div>
            
            <div style="background: white; padding: 25px; border-radius: 12px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); margin-bottom: 25px;">
              <p style="margin: 0; color: #374151; line-height: 1.6; font-size: 14px;">
                <strong>Note:</strong> This verification link will expire in 24 hours. If you didn't create an account with OA Point, please ignore this email.
              </p>
            </div>
            
            <div style="text-align: center; padding: 25px; background: white; border-radius: 12px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
              <p style="margin: 0; color: #666; line-height: 1.6; font-size: 16px;">
                Welcome to OA Point!<br><br>
                Best regards,<br>
                <strong style="color: #333; font-size: 18px;">OA Point Team</strong><br>
                <span style="font-size: 14px; color: #888; font-style: italic;">Online Assessment Platform</span>
              </p>
            </div>
          </div>
          
          <div style="background: #f3f4f6; color: #374151; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="margin: 0; font-size: 13px; font-weight: 500;">© 2025 OA Point. All rights reserved.</p>
            <p style="margin: 8px 0 0 0; color: #6b7280; font-size: 12px;">Online Assessment Platform</p>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);

    res.status(201).json({
      message: 'Registration successful! Please check your email to verify your account.',
      requiresVerification: true,
      email: email
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(400).json({ message: 'Account is deactivated' });
    }

    // Check if email is verified
    if (!user.isEmailVerified) {
      return res.status(400).json({ 
        message: 'Please verify your email address before logging in',
        requiresVerification: true,
        email: user.email
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// Get current user
router.get('/me', auth, async (req, res) => {
  try {
    res.json({
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        registrationNumber: req.user.registrationNumber,
        phone: req.user.phone
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Test token validity
router.get('/test-token', auth, (req, res) => {
  res.json({
    message: 'Token is valid',
    user: {
      id: req.user._id,
      email: req.user.email,
      role: req.user.role
    },
    tokenInfo: {
      isValid: true,
      expiresIn: '24h'
    }
  });
});

// Validate token without middleware (for debugging)
router.post('/validate-token', (req, res) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({ message: 'Token is required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    res.json({
      message: 'Token is valid',
      decoded,
      expiresAt: new Date(decoded.exp * 1000),
      isExpired: decoded.exp < (Date.now() / 1000)
    });
  } catch (error) {
    res.status(401).json({ 
      message: 'Token is invalid',
      error: error.message,
      type: error.name
    });
  }
});

// Test JWT_SECRET
router.get('/test-jwt-secret', (req, res) => {
  res.json({
    jwtSecretExists: !!process.env.JWT_SECRET,
    jwtSecretLength: process.env.JWT_SECRET ? process.env.JWT_SECRET.length : 0,
    jwtSecretPreview: process.env.JWT_SECRET ? process.env.JWT_SECRET.substring(0, 10) + '...' : 'NOT SET'
  });
});

// Update profile
router.put('/profile', auth, async (req, res) => {
  try {
    const { name, phone } = req.body;
    
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name, phone },
      { new: true }
    ).select('-password');

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        registrationNumber: user.registrationNumber,
        phone: user.phone
      }
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ message: 'Server error during profile update' });
  }
});

// Verify email
router.post('/verify-email', async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ message: 'Verification token is required' });
    }

    // Find user with this token
    const user = await User.findOne({
      emailVerificationToken: token,
      emailVerificationExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired verification token' });
    }

    // Verify the user
    user.isEmailVerified = true;
    user.emailVerificationToken = null;
    user.emailVerificationExpires = null;
    await user.save();

    // Generate JWT token for immediate login
    const jwtToken = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Email verified successfully! You can now log in.',
      token: jwtToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({ message: 'Server error during email verification' });
  }
});

// Resend verification email
router.post('/resend-verification', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({ message: 'Email is already verified' });
    }

    // Generate new verification token
    const verificationToken = user.generateEmailVerificationToken();
    await user.save();

    // Send verification email
    const verificationUrl = `${process.env.CLIENT_URL}/verify-email?token=${verificationToken}`;
    
    const mailOptions = {
      from: `"OA Point Team" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'OA Point - Verify Your Email Address',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
          <div style="padding: 25px; text-align: center; background: white; border-bottom: 1px solid #e5e7eb;">
            <img src="https://drive.google.com/file/d/1FQR1s8JZvJcBbdvg3m2TNv0rpIOcqJvK/view?usp=sharing" alt="OA Point Logo" style="height: 60px; width: auto; margin-bottom: 15px;" />
            <h1 style="color: #333; margin: 0; font-size: 28px; font-weight: bold;">OA Point</h1>
            <p style="color: #666; margin: 8px 0 0 0; font-size: 16px; font-weight: 500;">Online Assessment Platform</p>
          </div>
          
          <div style="padding: 35px 30px; background-color: #f8f9fa;">
            <h2 style="color: #333; margin-bottom: 25px; font-size: 24px; font-weight: 600; text-align: center;">Email Verification</h2>
            
            <p style="font-size: 18px; color: #333; margin-bottom: 25px;">Dear <strong>${user.name}</strong>,</p>
            
            <p style="font-size: 16px; color: #374151; line-height: 1.6; margin-bottom: 25px;">
              Please verify your email address by clicking the button below to complete your registration with <strong>OA Point</strong>.
            </p>
            
            <div style="text-align: center; margin: 35px 0;">
              <a href="${verificationUrl}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                ✅ Verify Email Address
              </a>
            </div>
            
            <div style="background: white; padding: 25px; border-radius: 12px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); margin-bottom: 25px;">
              <p style="margin: 0; color: #374151; line-height: 1.6; font-size: 14px;">
                <strong>Note:</strong> This verification link will expire in 24 hours.
              </p>
            </div>
            
            <div style="text-align: center; padding: 25px; background: white; border-radius: 12px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
              <p style="margin: 0; color: #666; line-height: 1.6; font-size: 16px;">
                Best regards,<br>
                <strong style="color: #333; font-size: 18px;">OA Point Team</strong><br>
                <span style="font-size: 14px; color: #888; font-style: italic;">Online Assessment Platform</span>
              </p>
            </div>
          </div>
          
          <div style="background: #f3f4f6; color: #374151; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="margin: 0; font-size: 13px; font-weight: 500;">© 2025 OA Point. All rights reserved.</p>
            <p style="margin: 8px 0 0 0; color: #6b7280; font-size: 12px;">Online Assessment Platform</p>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);

    res.json({
      message: 'Verification email sent successfully! Please check your email.'
    });
  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({ message: 'Server error while sending verification email' });
  }
});

// Forgot password
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.isEmailVerified) {
      return res.status(400).json({ message: 'Please verify your email address first' });
    }

    // Generate password reset token
    const resetToken = user.generatePasswordResetToken();
    await user.save();

    // Send password reset email
    const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`;
    
    const mailOptions = {
      from: `"OA Point Team" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'OA Point - Password Reset Request',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
          <div style="padding: 25px; text-align: center; background: white; border-bottom: 1px solid #e5e7eb;">
            <img src="https://drive.google.com/file/d/1FQR1s8JZvJcBbdvg3m2TNv0rpIOcqJvK/view?usp=sharing" alt="OA Point Logo" style="height: 60px; width: auto; margin-bottom: 15px;" />
            <h1 style="color: #333; margin: 0; font-size: 28px; font-weight: bold;">OA Point</h1>
            <p style="color: #666; margin: 8px 0 0 0; font-size: 16px; font-weight: 500;">Online Assessment Platform</p>
          </div>
          
          <div style="padding: 35px 30px; background-color: #f8f9fa;">
            <h2 style="color: #333; margin-bottom: 25px; font-size: 24px; font-weight: 600; text-align: center;">Password Reset Request</h2>
            
            <p style="font-size: 18px; color: #333; margin-bottom: 25px;">Dear <strong>${user.name}</strong>,</p>
            
            <p style="font-size: 16px; color: #374151; line-height: 1.6; margin-bottom: 25px;">
              We received a request to reset your password for your <strong>OA Point</strong> account. Click the button below to create a new password.
            </p>
            
            <div style="text-align: center; margin: 35px 0;">
              <a href="${resetUrl}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                🔒 Reset Password
              </a>
            </div>
            
            <div style="background: white; padding: 25px; border-radius: 12px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); margin-bottom: 25px;">
              <p style="margin: 0; color: #374151; line-height: 1.6; font-size: 14px;">
                <strong>Important:</strong> This password reset link will expire in 1 hour. If you didn't request a password reset, please ignore this email and your password will remain unchanged.
              </p>
            </div>
            
            <div style="text-align: center; padding: 25px; background: white; border-radius: 12px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
              <p style="margin: 0; color: #666; line-height: 1.6; font-size: 16px;">
                Best regards,<br>
                <strong style="color: #333; font-size: 18px;">OA Point Team</strong><br>
                <span style="font-size: 14px; color: #888; font-style: italic;">Online Assessment Platform</span>
              </p>
            </div>
          </div>
          
          <div style="background: #f3f4f6; color: #374151; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="margin: 0; font-size: 13px; font-weight: 500;">© 2025 OA Point. All rights reserved.</p>
            <p style="margin: 8px 0 0 0; color: #6b7280; font-size: 12px;">Online Assessment Platform</p>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);

    res.json({
      message: 'Password reset email sent successfully! Please check your email.'
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Server error while sending password reset email' });
  }
});

// Reset password
router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ message: 'Token and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    // Find user with this token
    const user = await User.findOne({
      passwordResetToken: token,
      passwordResetExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired password reset token' });
    }

    // Update password
    user.password = newPassword;
    user.passwordResetToken = null;
    user.passwordResetExpires = null;
    await user.save();

    res.json({
      message: 'Password reset successfully! You can now log in with your new password.'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Server error during password reset' });
  }
});

module.exports = router;