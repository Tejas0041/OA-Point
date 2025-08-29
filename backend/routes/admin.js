const express = require('express')
const multer = require('multer')
const cloudinary = require('cloudinary').v2
const nodemailer = require('nodemailer')
const Test = require('../models/Test')
const TestAttempt = require('../models/TestAttempt')
const User = require('../models/User')
const { adminAuth } = require('../middleware/auth')

const router = express.Router()

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
})

// Configure multer for image uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true)
    } else {
      cb(new Error('Only image files are allowed'), false)
    }
  }
})

// Configure nodemailer
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
})

// Add students to test
router.post('/tests/:id/add-students', adminAuth, async (req, res) => {
  try {
    const test = await Test.findById(req.params.id)
    if (!test) {
      return res.status(404).json({ message: 'Test not found' })
    }

    const { studentIds } = req.body
    const students = await User.find({
      _id: { $in: studentIds },
      role: 'student'
    })

    // Add test to each student's registeredTests
    const updatePromises = students.map(student => {
      // Only add if not already registered
      if (
        !student.registeredTests.some(
          t => t.testId && t.testId.equals && t.testId.equals(test._id)
        )
      ) {
        student.registeredTests.push({
          testId: test._id,
          status: 'to_attempt',
          registeredAt: new Date()
        })
        return student.save()
      }
      return Promise.resolve()
    })

    await Promise.all(updatePromises)

    res.json({ message: 'Students added successfully' })
  } catch (error) {
    console.error('Error adding students:', error)
    res.status(500).json({ message: 'Error adding students to test' })
  }
})

// Create new test
router.post('/tests', adminAuth, async (req, res) => {
  try {
    const {
      title,
      description,
      sections,
      startDate,
      endDate,
      duration,
      enableCamera,
      enableFullScreen,
      preventCopyPaste,
      preventRightClick
    } = req.body

    // Validate that all multiple choice questions have at least one correct answer
    for (let sectionIndex = 0; sectionIndex < sections.length; sectionIndex++) {
      const section = sections[sectionIndex]
      for (
        let questionIndex = 0;
        questionIndex < section.questions.length;
        questionIndex++
      ) {
        const question = section.questions[questionIndex]

        if (
          question.questionType === 'single-correct' ||
          question.questionType === 'multi-correct'
        ) {
          const hasCorrectAnswer =
            question.options &&
            question.options.some(option => option.isCorrect)
          if (!hasCorrectAnswer) {
            return res.status(400).json({
              message: `Question ${questionIndex + 1} in section "${
                section.name
              }" must have at least one correct answer selected.`
            })
          }
        }
      }
    }

    const test = new Test({
      title,
      description,
      createdBy: req.user._id,
      sections,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      duration,
      enableCamera,
      enableFullScreen,
      preventCopyPaste,
      preventRightClick,
      allowedStudents: [] // Initialize empty array for students
    })

    await test.save()

    res.status(201).json({
      message: 'Test created successfully',
      test
    })
  } catch (error) {
    console.error('Create test error:', error)
    res.status(500).json({ message: 'Error creating test' })
  }
})

// Get all tests created by admin
router.get('/tests', adminAuth, async (req, res) => {
  try {
    const tests = await Test.find({ createdBy: req.user._id })
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })

    res.json({ tests })
  } catch (error) {
    console.error('Get tests error:', error)
    res.status(500).json({ message: 'Error fetching tests' })
  }
})

// Get specific test
router.get('/tests/:id', adminAuth, async (req, res) => {
  try {
    const test = await Test.findOne({
      _id: req.params.id,
      createdBy: req.user._id
    }).populate('createdBy', 'name email')

    if (!test) {
      return res.status(404).json({ message: 'Test not found' })
    }

    res.json({ test })
  } catch (error) {
    console.error('Get test error:', error)
    res.status(500).json({ message: 'Error fetching test' })
  }
})

// Update test
router.put('/tests/:id', adminAuth, async (req, res) => {
  try {
    const { sections } = req.body

    // Validate that all multiple choice questions have at least one correct answer
    if (sections) {
      for (
        let sectionIndex = 0;
        sectionIndex < sections.length;
        sectionIndex++
      ) {
        const section = sections[sectionIndex]
        for (
          let questionIndex = 0;
          questionIndex < section.questions.length;
          questionIndex++
        ) {
          const question = section.questions[questionIndex]

          if (
            question.questionType === 'single-correct' ||
            question.questionType === 'multi-correct'
          ) {
            const hasCorrectAnswer =
              question.options &&
              question.options.some(option => option.isCorrect)
            if (!hasCorrectAnswer) {
              return res.status(400).json({
                message: `Question ${questionIndex + 1} in section "${
                  section.name
                }" must have at least one correct answer selected.`
              })
            }
          }
        }
      }
    }

    const test = await Test.findOneAndUpdate(
      { _id: req.params.id, createdBy: req.user._id },
      req.body,
      { new: true }
    )

    if (!test) {
      return res.status(404).json({ message: 'Test not found' })
    }

    res.json({
      message: 'Test updated successfully',
      test
    })
  } catch (error) {
    console.error('Update test error:', error)
    res.status(500).json({ message: 'Error updating test' })
  }
})

// Delete test
router.delete('/tests/:id', adminAuth, async (req, res) => {
  try {
    // First, find the test to get all image URLs before deletion
    const test = await Test.findOne({
      _id: req.params.id,
      createdBy: req.user._id
    })

    if (!test) {
      return res.status(404).json({ message: 'Test not found' })
    }

    console.log('Deleting test:', test.title)

    // Collect all image URLs from questions
    const imageUrls = []
    test.sections.forEach(section => {
      section.questions.forEach(question => {
        if (question.questionImage) {
          imageUrls.push(question.questionImage)
          console.log('Found question image:', question.questionImage)
        }
        // Also check options for images
        if (question.options) {
          question.options.forEach(option => {
            if (option.optionImage) {
              imageUrls.push(option.optionImage)
              console.log('Found option image:', option.optionImage)
            }
          })
        }
      })
    })

    console.log('Total images to delete:', imageUrls.length)

    // Delete images from Cloudinary
    const deleteImagePromises = imageUrls.map(async imageUrl => {
      try {
        console.log('Processing image URL:', imageUrl)

        // Extract public_id from Cloudinary URL
        let publicId
        if (imageUrl.includes('cloudinary.com')) {
          // Extract from full Cloudinary URL
          // Example: https://res.cloudinary.com/dfgrknsfy/image/upload/v1756062621/online-assessment/questions/bxh3femwf302mzapv4jv.png
          const urlParts = imageUrl.split('/')
          console.log('URL parts:', urlParts)

          const uploadIndex = urlParts.findIndex(part => part === 'upload')
          console.log('Upload index:', uploadIndex)

          if (uploadIndex !== -1) {
            // Get everything after 'upload', skip version if present
            let pathParts = urlParts.slice(uploadIndex + 1)
            console.log('Path parts after upload:', pathParts)

            // Skip version number (starts with 'v' followed by digits)
            if (pathParts[0] && /^v\d+$/.test(pathParts[0])) {
              pathParts = pathParts.slice(1)
              console.log('Path parts after removing version:', pathParts)
            }
            // Join the remaining parts and remove file extension
            publicId = pathParts.join('/').replace(/\.[^/.]+$/, '')
            console.log('Extracted public_id:', publicId)
          } else {
            // Fallback: just get the filename without extension
            publicId = imageUrl.split('/').pop().split('.')[0]
            console.log('Fallback public_id:', publicId)
          }
        } else {
          // If it's just a filename or simple path
          publicId = imageUrl.split('/').pop().split('.')[0]
          console.log('Simple path public_id:', publicId)
        }

        console.log('Final public_id to delete:', publicId)

        // Test Cloudinary connection first
        console.log('Cloudinary config check:', {
          cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
          api_key: process.env.CLOUDINARY_API_KEY ? 'SET' : 'NOT SET',
          api_secret: process.env.CLOUDINARY_API_SECRET ? 'SET' : 'NOT SET'
        })

        const result = await cloudinary.uploader.destroy(publicId)
        console.log(
          'Cloudinary delete result for',
          publicId,
          ':',
          JSON.stringify(result, null, 2)
        )
        return {
          publicId,
          result,
          success: result.result === 'ok' || result.result === 'not found'
        }
      } catch (error) {
        console.error(
          'Error deleting image from Cloudinary:',
          imageUrl,
          'Error:',
          error
        )
        return { publicId: imageUrl, error: error.message, success: false }
      }
    })

    // Wait for all image deletions to complete
    const imageDeleteResults = await Promise.allSettled(deleteImagePromises)
    const successfulDeletes = imageDeleteResults.filter(
      r => r.status === 'fulfilled' && r.value.success
    ).length
    console.log(
      `Successfully deleted ${successfulDeletes} out of ${imageUrls.length} images`
    )

    // Remove test from all students' registeredTests
    console.log('Removing test from students registeredTests...')
    const updateResult = await User.updateMany(
      { 'registeredTests.testId': req.params.id },
      { $pull: { registeredTests: { testId: req.params.id } } }
    )
    console.log('Updated students:', updateResult.modifiedCount)

    // Delete all test attempts
    const attemptDeleteResult = await TestAttempt.deleteMany({
      testId: req.params.id
    })
    console.log('Deleted test attempts:', attemptDeleteResult.deletedCount)

    // Finally, delete the test
    await Test.findByIdAndDelete(req.params.id)
    console.log('Test deleted successfully')

    res.json({
      message: 'Test deleted successfully',
      details: {
        imagesFound: imageUrls.length,
        imagesDeleted: successfulDeletes,
        studentsUpdated: updateResult.modifiedCount,
        attemptsDeleted: attemptDeleteResult.deletedCount
      }
    })
  } catch (error) {
    console.error('Delete test error:', error)
    res
      .status(500)
      .json({ message: 'Error deleting test', error: error.message })
  }
})

// Send custom email to selected students
router.post('/send-custom-email', adminAuth, async (req, res) => {
  try {
    const { studentIds, subject, content } = req.body

    if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
      return res.status(400).json({ message: 'Student IDs are required' })
    }

    if (!subject || !content) {
      return res
        .status(400)
        .json({ message: 'Subject and content are required' })
    }

    // Get students
    const students = await User.find({
      _id: { $in: studentIds },
      role: 'student'
    })

    if (students.length === 0) {
      return res.status(404).json({ message: 'No students found' })
    }

    console.log(`Sending custom email to ${students.length} students`)

    // Create transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    })

    // Send emails
    const emailPromises = students.map(async student => {
      try {
        const mailOptions = {
          from: `"OA Point Team" <${process.env.EMAIL_USER}>`,
          to: student.email,
          subject: subject,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
              <div style="padding: 25px; text-align: center; background: white;">
                <img src="https://drive.google.com/file/d/1FQR1s8JZvJcBbdvg3m2TNv0rpIOcqJvK/view?usp=sharing" alt="OA Point Logo" style="height: 60px; width: auto; border-radius: 5px; margin-bottom: 15px;" />
                <h1 style="color: #333; margin: 0; font-size: 28px; font-weight: bold;">OA Point</h1>
                <p style="color: #666; margin: 8px 0 0 0; font-size: 16px; font-weight: 500;">Online Assessment Platform</p>
              </div>
              
              <div style="padding: 35px 30px; background-color: #f8f9fa;">
                <h2 style="color: #333; margin-bottom: 25px; font-size: 22px; font-weight: 600;">Hello ${
                  student.name
                },</h2>
                
                <div style="background: white; padding: 30px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); line-height: 1.7; border-left: 4px solid #667eea;">
                  <div style="font-size: 16px; color: #374151;">
                    ${content.replace(/\n/g, '<br>')}
                  </div>
                </div>
                
                <div style="margin-top: 35px; padding: 25px; background: white; border-radius: 12px; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                  <div style="width: 50px; height: 3px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); margin: 0 auto 20px; border-radius: 2px;"></div>
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
        }

        await transporter.sendMail(mailOptions)
        console.log(`Email sent to ${student.email}`)
        return { email: student.email, success: true }
      } catch (error) {
        console.error(`Failed to send email to ${student.email}:`, error)
        return { email: student.email, success: false, error: error.message }
      }
    })

    const results = await Promise.allSettled(emailPromises)
    const successful = results.filter(
      r => r.status === 'fulfilled' && r.value.success
    ).length
    const failed = results.length - successful

    res.json({
      message: `Email sent successfully to ${successful} students`,
      details: {
        total: students.length,
        successful,
        failed,
        results: results.map(r =>
          r.status === 'fulfilled'
            ? r.value
            : { success: false, error: 'Promise rejected' }
        )
      }
    })
  } catch (error) {
    console.error('Send custom email error:', error)
    res
      .status(500)
      .json({ message: 'Error sending emails', error: error.message })
  }
})

// Test Cloudinary connection and deletion
router.post('/test-cloudinary-delete', adminAuth, async (req, res) => {
  try {
    const { imageUrl } = req.body

    if (!imageUrl) {
      return res.status(400).json({ message: 'Image URL is required' })
    }

    console.log('Testing Cloudinary deletion for URL:', imageUrl)

    // Extract public_id from Cloudinary URL
    let publicId
    if (imageUrl.includes('cloudinary.com')) {
      const urlParts = imageUrl.split('/')
      console.log('URL parts:', urlParts)

      const uploadIndex = urlParts.findIndex(part => part === 'upload')
      console.log('Upload index:', uploadIndex)

      if (uploadIndex !== -1) {
        let pathParts = urlParts.slice(uploadIndex + 1)
        console.log('Path parts after upload:', pathParts)

        if (pathParts[0] && /^v\d+$/.test(pathParts[0])) {
          pathParts = pathParts.slice(1)
          console.log('Path parts after removing version:', pathParts)
        }
        publicId = pathParts.join('/').replace(/\.[^/.]+$/, '')
        console.log('Extracted public_id:', publicId)
      } else {
        publicId = imageUrl.split('/').pop().split('.')[0]
        console.log('Fallback public_id:', publicId)
      }
    } else {
      publicId = imageUrl.split('/').pop().split('.')[0]
      console.log('Simple path public_id:', publicId)
    }

    console.log('Final public_id to delete:', publicId)

    // Test Cloudinary connection
    console.log('Cloudinary config:', {
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY ? 'SET' : 'NOT SET',
      api_secret: process.env.CLOUDINARY_API_SECRET ? 'SET' : 'NOT SET'
    })

    const result = await cloudinary.uploader.destroy(publicId)
    console.log('Cloudinary delete result:', JSON.stringify(result, null, 2))

    res.json({
      message: 'Test completed',
      imageUrl,
      publicId,
      result,
      success: result.result === 'ok' || result.result === 'not found'
    })
  } catch (error) {
    console.error('Test Cloudinary delete error:', error)
    res.status(500).json({
      message: 'Error testing Cloudinary deletion',
      error: error.message
    })
  }
})

// Upload image for question
router.post(
  '/upload-image',
  adminAuth,
  upload.single('image'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No image file provided' })
      }

      // Upload to Cloudinary
      const result = await new Promise((resolve, reject) => {
        cloudinary.uploader
          .upload_stream(
            {
              resource_type: 'image',
              folder: 'online-assessment/questions'
            },
            (error, result) => {
              if (error) reject(error)
              else resolve(result)
            }
          )
          .end(req.file.buffer)
      })

      res.json({
        message: 'Image uploaded successfully',
        imageUrl: result.secure_url
      })
    } catch (error) {
      console.error('Image upload error:', error)
      res.status(500).json({ message: 'Error uploading image' })
    }
  }
)

// Get all students
router.get('/students', adminAuth, async (req, res) => {
  try {
    const students = await User.find({ role: 'student' })
      .select('-password')
      .sort({ createdAt: -1 })

    res.json({ students })
  } catch (error) {
    console.error('Get students error:', error)
    res.status(500).json({ message: 'Error fetching students' })
  }
})

// Send test invitation emails
router.post('/tests/:id/send-invitations', adminAuth, async (req, res) => {
  try {
    const { studentIds, customMessage } = req.body

    const test = await Test.findOne({
      _id: req.params.id,
      createdBy: req.user._id
    })

    if (!test) {
      return res.status(404).json({ message: 'Test not found' })
    }

    const students = await User.find({
      _id: { $in: studentIds },
      role: 'student'
    })

    const testLink = `${process.env.CLIENT_URL}/student/test/${test._id}`

    const emailPromises = students.map(student => {
      const mailOptions = {
        from: `"OA Point Team" <${process.env.EMAIL_USER}>`,
        to: student.email,
        subject: `OA Point - Assessment Invitation: ${test.title}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
            <div style="padding: 25px; text-align: center; background: white; border-bottom: 1px solid #e5e7eb;">
              <img src="https://drive.google.com/file/d/1FQR1s8JZvJcBbdvg3m2TNv0rpIOcqJvK/view?usp=sharing" alt="OA Point Logo" style="height: 60px; width: auto; margin-bottom: 15px;" />
              <h1 style="color: #333; margin: 0; font-size: 28px; font-weight: bold;">OA Point</h1>
              <p style="color: #666; margin: 8px 0 0 0; font-size: 16px; font-weight: 500;">Online Assessment Platform</p>
            </div>
            
            <div style="padding: 35px 30px; background-color: #f8f9fa;">
              <h2 style="color: #333; margin-bottom: 25px; font-size: 24px; font-weight: 600; text-align: center;">Assessment Invitation</h2>
              
              <p style="font-size: 18px; color: #333; margin-bottom: 25px;">Dear <strong>${
                student.name
              }</strong>,</p>
              
              <p style="font-size: 16px; color: #374151; line-height: 1.6; margin-bottom: 25px;">
                You have been invited to take an online assessment on <strong>OA Point</strong>. Please find the details below:
              </p>
              
              <div style="background: white; padding: 25px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); border-left: 4px solid #667eea; margin-bottom: 25px;">
                <h3 style="color: #333; margin-bottom: 20px; font-size: 20px;">Assessment Details</h3>
                <div style="space-y: 12px;">
                  <p style="margin: 8px 0; color: #374151;"><strong style="color: #1f2937;">Title:</strong> ${
                    test.title
                  }</p>
                  <p style="margin: 8px 0; color: #374151;"><strong style="color: #1f2937;">Description:</strong> ${
                    test.description || 'N/A'
                  }</p>
                  <p style="margin: 8px 0; color: #374151;"><strong style="color: #1f2937;">Start Date:</strong> ${new Date(
                    test.startDate
                  ).toLocaleString('en-GB')}</p>
                  <p style="margin: 8px 0; color: #374151;"><strong style="color: #1f2937;">End Date:</strong> ${new Date(
                    test.endDate
                  ).toLocaleString('en-GB')}</p>
                  <p style="margin: 8px 0; color: #374151;"><strong style="color: #1f2937;">Duration:</strong> ${
                    test.duration
                  } minutes</p>
                  <p style="margin: 8px 0; color: #374151;"><strong style="color: #1f2937;">Sections:</strong> ${
                    test.sections.length
                  }</p>
                </div>
              </div>
              
              ${
                customMessage
                  ? `
                <div style="background: #fef3c7; padding: 20px; border-radius: 8px; border-left: 4px solid #f59e0b; margin-bottom: 25px;">
                  <p style="margin: 0; color: #92400e;"><strong>Additional Message:</strong></p>
                  <p style="margin: 10px 0 0 0; color: #92400e;">${customMessage}</p>
                </div>
              `
                  : ''
              }
              
              <div style="text-align: center; margin: 35px 0;">
                <a href="${testLink}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                  🚀 Take Assessment Now
                </a>
              </div>
              
              <div style="background: white; padding: 25px; border-radius: 12px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); margin-bottom: 25px;">
                <h3 style="color: #333; margin-bottom: 15px; font-size: 18px;">📋 Important Instructions</h3>
                <ul style="margin: 0; padding-left: 20px; color: #374151; line-height: 1.6;">
                  <li style="margin-bottom: 8px;">Ensure you have a stable internet connection</li>
                  <li style="margin-bottom: 8px;">Use a desktop or laptop computer with a working webcam</li>
                  <li style="margin-bottom: 8px;">Close all unnecessary applications and browser tabs</li>
                  <li style="margin-bottom: 8px;">The assessment will be in full-screen mode</li>
                  <li style="margin-bottom: 8px;">Copy-paste functionality and right-click will be disabled</li>
                  <li style="margin-bottom: 8px;">Submit your answers before the time limit expires</li>
                </ul>
              </div>
              
              <div style="text-align: center; padding: 25px; background: white; border-radius: 12px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                <p style="margin: 0; color: #666; line-height: 1.6; font-size: 16px;">
                  Good luck with your assessment!<br><br>
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
      }

      return transporter.sendMail(mailOptions)
    })

    try {
      await Promise.all(emailPromises)

      // Update test with allowed students
      test.allowedStudents = [
        ...new Set([...test.allowedStudents, ...studentIds])
      ]
      await test.save()

      // Add test to each student's registeredTests array
      const updatePromises = students.map(async student => {
        // Check if test is already registered
        const existingRegistration = student.registeredTests.find(
          rt => rt.testId.toString() === test._id.toString()
        )

        if (!existingRegistration) {
          student.registeredTests.push({
            testId: test._id,
            status: 'to_attempt',
            score: null,
            registeredAt: new Date(),
            completedAt: null
          })
          await student.save()
        }
      })

      await Promise.all(updatePromises)

      res.json({
        message: `Invitations sent successfully to ${students.length} students and tests registered`
      })
    } catch (emailError) {
      console.error(
        'Email sending failed, but students were added to test:',
        emailError
      )

      // Still add students to test even if email fails
      test.allowedStudents = [
        ...new Set([...test.allowedStudents, ...studentIds])
      ]
      await test.save()

      res.json({
        message: `Students added to test successfully. Email sending failed due to configuration issues.`,
        warning: 'Please check your email configuration in .env file'
      })
    }
  } catch (error) {
    console.error('Send invitations error:', error)
    res.status(500).json({ message: 'Error sending invitations' })
  }
})

// Get test results
router.get('/tests/:id/results', adminAuth, async (req, res) => {
  try {
    const test = await Test.findOne({
      _id: req.params.id,
      createdBy: req.user._id
    })

    if (!test) {
      return res.status(404).json({ message: 'Test not found' })
    }

    const results = await TestAttempt.find({ testId: req.params.id })
      .populate('studentId', 'name email registrationNumber')
      .sort({ totalScore: -1 })

    res.json({ results })
  } catch (error) {
    console.error('Get results error:', error)
    res.status(500).json({ message: 'Error fetching results' })
  }
})

// Send overall test results (leaderboard) to all students
router.post('/tests/:id/send-results', adminAuth, async (req, res) => {
  try {
    const test = await Test.findOne({
      _id: req.params.id,
      createdBy: req.user._id
    })

    if (!test) {
      return res.status(404).json({ message: 'Test not found' })
    }

    // Get all results sorted by score (high to low)
    const allResults = await TestAttempt.find({ testId: req.params.id })
      .populate('studentId', 'name email registrationNumber')
      .sort({ totalScore: -1, percentage: -1 })

    if (allResults.length === 0) {
      return res.status(400).json({ message: 'No results found for this test' })
    }

    // Get all students who were invited to this test
    const allowedStudents = await User.find({
      _id: { $in: test.allowedStudents },
      role: 'student'
    })

    // Create leaderboard HTML
    const createLeaderboardHTML = () => {
      let leaderboardRows = ''
      
      allResults.forEach((result, index) => {
        const rank = index + 1
        const medalIcon = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `${rank}.`
        const rowColor = rank <= 3 ? '#fef3c7' : index % 2 === 0 ? '#f9fafb' : '#ffffff'
        
        leaderboardRows += `
          <tr style="background-color: ${rowColor};">
            <td style="padding: 12px; text-align: center; font-weight: 600; color: #1f2937;">${medalIcon}</td>
            <td style="padding: 12px; color: #1f2937; font-weight: 500;">${result.studentId.name}</td>
            <td style="padding: 12px; text-align: center; color: #1f2937; font-weight: 600;">${result.totalScore}/${result.maxScore}</td>
            <td style="padding: 12px; text-align: center; color: ${
              result.percentage >= 70 ? '#10b981' : result.percentage >= 50 ? '#f59e0b' : '#ef4444'
            }; font-weight: 700;">${result.percentage.toFixed(1)}%</td>
          </tr>
        `
      })
      
      return leaderboardRows
    }

    // Calculate statistics
    const totalParticipants = allResults.length
    const averageScore = allResults.reduce((sum, result) => sum + result.percentage, 0) / totalParticipants
    const highestScore = allResults[0]?.percentage || 0
    const lowestScore = allResults[allResults.length - 1]?.percentage || 0

    // Send email to all allowed students
    const emailPromises = allowedStudents.map(student => {
      // Find student's result if they participated
      const studentResult = allResults.find(result => 
        result.studentId._id.toString() === student._id.toString()
      )
      
      const studentRank = studentResult ? 
        allResults.findIndex(result => result.studentId._id.toString() === student._id.toString()) + 1 : 
        null

      const mailOptions = {
        from: `"OA Point Team" <${process.env.EMAIL_USER}>`,
        to: student.email,
        subject: `OA Point - Test Results & Leaderboard: ${test.title}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 700px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
            <div style="padding: 25px; text-align: center; background: white; border-bottom: 1px solid #e5e7eb;">
              <img src="https://drive.google.com/file/d/1FQR1s8JZvJcBbdvg3m2TNv0rpIOcqJvK/view?usp=sharing" alt="OA Point Logo" style="height: 60px; width: auto; margin-bottom: 15px;" />
              <h1 style="color: #333; margin: 0; font-size: 28px; font-weight: bold;">OA Point</h1>
              <p style="color: #666; margin: 8px 0 0 0; font-size: 16px; font-weight: 500;">Online Assessment Platform</p>
            </div>
            
            <div style="padding: 35px 30px; background-color: #f8f9fa;">
              <h2 style="color: #333; margin-bottom: 25px; font-size: 24px; font-weight: 600; text-align: center;">🏆 Test Results & Leaderboard</h2>
              
              <p style="font-size: 18px; color: #333; margin-bottom: 25px;">Dear <strong>${student.name}</strong>,</p>
              
              <p style="font-size: 16px; color: #374151; line-height: 1.6; margin-bottom: 25px;">
                The results for "<strong>${test.title}</strong>" are now available. Here's the complete leaderboard showing all participants' performance.
              </p>

              ${studentResult ? `
                <div style="background: white; padding: 25px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); border-left: 4px solid ${
                  studentResult.percentage >= 70 ? '#10b981' : studentResult.percentage >= 50 ? '#f59e0b' : '#ef4444'
                }; margin-bottom: 25px;">
                  <h3 style="color: #333; margin-bottom: 20px; font-size: 20px;">🎯 Your Performance</h3>
                  <div style="display: grid; gap: 12px;">
                    <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f3f4f6;">
                      <span style="color: #374151; font-weight: 500;">Your Rank:</span>
                      <span style="color: #1f2937; font-weight: 700; font-size: 18px;">${studentRank}${studentRank === 1 ? ' 🥇' : studentRank === 2 ? ' 🥈' : studentRank === 3 ? ' 🥉' : ''} out of ${totalParticipants}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f3f4f6;">
                      <span style="color: #374151; font-weight: 500;">Your Score:</span>
                      <span style="color: #1f2937; font-weight: 600;">${studentResult.totalScore}/${studentResult.maxScore}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; padding: 8px 0;">
                      <span style="color: #374151; font-weight: 500;">Your Percentage:</span>
                      <span style="color: ${
                        studentResult.percentage >= 70 ? '#10b981' : studentResult.percentage >= 50 ? '#f59e0b' : '#ef4444'
                      }; font-weight: 700; font-size: 18px;">${studentResult.percentage.toFixed(1)}%</span>
                    </div>
                  </div>
                </div>
              ` : `
                <div style="background: #fef3c7; padding: 20px; border-radius: 8px; border-left: 4px solid #f59e0b; margin-bottom: 25px;">
                  <p style="margin: 0; color: #92400e; font-weight: 500;">
                    📝 You did not participate in this assessment, but you can still view the overall results below.
                  </p>
                </div>
              `}

              <div style="background: white; padding: 25px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); margin-bottom: 25px;">
                <h3 style="color: #333; margin-bottom: 20px; font-size: 20px;">📊 Test Statistics</h3>
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px;">
                  <div style="text-align: center; padding: 15px; background: #f8f9fa; border-radius: 8px;">
                    <div style="font-size: 24px; font-weight: bold; color: #1f2937;">${totalParticipants}</div>
                    <div style="font-size: 14px; color: #6b7280;">Total Participants</div>
                  </div>
                  <div style="text-align: center; padding: 15px; background: #f8f9fa; border-radius: 8px;">
                    <div style="font-size: 24px; font-weight: bold; color: #1f2937;">${averageScore.toFixed(1)}%</div>
                    <div style="font-size: 14px; color: #6b7280;">Average Score</div>
                  </div>
                  <div style="text-align: center; padding: 15px; background: #f8f9fa; border-radius: 8px;">
                    <div style="font-size: 24px; font-weight: bold; color: #10b981;">${highestScore.toFixed(1)}%</div>
                    <div style="font-size: 14px; color: #6b7280;">Highest Score</div>
                  </div>
                  <div style="text-align: center; padding: 15px; background: #f8f9fa; border-radius: 8px;">
                    <div style="font-size: 24px; font-weight: bold; color: #ef4444;">${lowestScore.toFixed(1)}%</div>
                    <div style="font-size: 14px; color: #6b7280;">Lowest Score</div>
                  </div>
                </div>
              </div>

              <div style="background: white; padding: 25px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); margin-bottom: 25px;">
                <h3 style="color: #333; margin-bottom: 20px; font-size: 20px;">🏆 Leaderboard</h3>
                <div style="overflow-x: auto;">
                  <table style="width: 100%; border-collapse: collapse; border-radius: 8px; overflow: hidden;">
                    <thead></thead>
                    <tr style="background-color: #374151; color: white;">
                        <th style="padding: 15px; text-align: center; font-weight: 600;">Rank</th>
                        <th style="padding: 15px; text-align: left; font-weight: 600;">Student Name</th>
                        <th style="padding: 15px; text-align: center; font-weight: 600;">Score</th>
                        <th style="padding: 15px; text-align: center; font-weight: 600;">Percentage</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${createLeaderboardHTML()}
                    </tbody>
                  </table>
                </div>
              </div>
              
              <div style="text-align: center; padding: 25px; background: white; border-radius: 12px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                <p style="margin: 0; color: #666; line-height: 1.6; font-size: 16px;">
                  ${studentResult ? 
                    (studentResult.percentage >= 70 ? 
                      '🎉 Congratulations on your excellent performance!' : 
                      studentResult.percentage >= 50 ? 
                      '👍 Well done on completing the assessment!' : 
                      '📚 Keep practicing and you\'ll improve next time!'
                    ) : 
                    '📝 We hope to see you participate in future assessments!'
                  }<br><br>
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
      }

      return transporter.sendMail(mailOptions)
    })

    await Promise.all(emailPromises)

    // Mark results as published
    test.resultsPublished = true
    await test.save()

    res.json({
      message: `Overall test results and leaderboard sent successfully to ${allowedStudents.length} students`,
      details: {
        totalParticipants: totalParticipants,
        emailsSent: allowedStudents.length,
        averageScore: averageScore.toFixed(1) + '%'
      }
    })
  } catch (error) {
    console.error('Send results error:', error)
    res.status(500).json({ message: 'Error sending results' })
  }
})

// Add students to test
router.post('/tests/:id/add-students', adminAuth, async (req, res) => {
  try {
    const { studentIds } = req.body

    if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
      return res
        .status(400)
        .json({ message: 'Please provide an array of student IDs' })
    }

    const test = await Test.findOne({
      _id: req.params.id,
      createdBy: req.user._id
    })

    if (!test) {
      return res.status(404).json({ message: 'Test not found' })
    }

    // Add students to allowedStudents array (avoid duplicates)
    const uniqueStudentIds = [
      ...new Set([...test.allowedStudents, ...studentIds])
    ]
    test.allowedStudents = uniqueStudentIds
    await test.save()

    // Get the students and add test to their registeredTests
    const students = await User.find({
      _id: { $in: studentIds },
      role: 'student'
    })

    // Add test to each student's registeredTests array
    const updatePromises = students.map(async student => {
      // Check if test is already registered
      const existingRegistration = student.registeredTests.find(
        rt => rt.testId.toString() === test._id.toString()
      )

      if (!existingRegistration) {
        student.registeredTests.push({
          testId: test._id,
          status: 'to_attempt',
          score: null,
          registeredAt: new Date(),
          completedAt: null
        })
        await student.save()
      }
    })

    await Promise.all(updatePromises)

    res.json({
      message: `Added ${studentIds.length} students to test successfully and registered tests`,
      test
    })
  } catch (error) {
    console.error('Add students error:', error)
    res.status(500).json({ message: 'Error adding students to test' })
  }
})

// Activate/Deactivate test
router.patch('/tests/:id/toggle-status', adminAuth, async (req, res) => {
  try {
    const test = await Test.findOne({
      _id: req.params.id,
      createdBy: req.user._id
    })

    if (!test) {
      return res.status(404).json({ message: 'Test not found' })
    }

    test.isActive = !test.isActive
    await test.save()

    res.json({
      message: `Test ${
        test.isActive ? 'activated' : 'deactivated'
      } successfully`,
      test
    })
  } catch (error) {
    console.error('Toggle test status error:', error)
    res.status(500).json({ message: 'Error updating test status' })
  }
})

// Sync student registrations (utility endpoint to fix existing data)
router.post('/sync-student-registrations', adminAuth, async (req, res) => {
  try {
    // Get all tests
    const tests = await Test.find({})
    let syncCount = 0

    for (const test of tests) {
      if (test.allowedStudents && test.allowedStudents.length > 0) {
        // Get students for this test
        const students = await User.find({
          _id: { $in: test.allowedStudents },
          role: 'student'
        })

        // Update each student's registeredTests
        for (const student of students) {
          const existingRegistration = student.registeredTests.find(
            rt => rt.testId.toString() === test._id.toString()
          )

          if (!existingRegistration) {
            student.registeredTests.push({
              testId: test._id,
              status: 'to_attempt',
              score: null,
              registeredAt: new Date(),
              completedAt: null
            })
            await student.save()
            syncCount++
          }
        }
      }
    }

    res.json({
      message: `Synced ${syncCount} student registrations successfully`
    })
  } catch (error) {
    console.error('Sync error:', error)
    res.status(500).json({ message: 'Error syncing student registrations' })
  }
})

module.exports = router
