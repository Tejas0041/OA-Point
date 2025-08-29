const mongoose = require('mongoose');
const User = require('./models/User');
const Test = require('./models/Test');
require('dotenv').config();

async function createTestAndAssignStudent() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/online-assessment', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    // Find the student
    const student = await User.findOne({ role: 'student' });
    if (!student) {
      console.log('No student found');
      return;
    }

    console.log('Found student:', student.email);

    // Find admin user for test creation
    const admin = await User.findOne({ role: 'admin' });
    if (!admin) {
      console.log('No admin found');
      return;
    }

    // Create a new test
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const newTest = new Test({
      title: 'Sample Test ' + now.toISOString().split('T')[0],
      description: 'This is a sample test created for debugging purposes',
      createdBy: admin._id,
      sections: [{
        name: 'Aptitude',
        timeLimit: 30,
        numberOfQuestions: 1,
        questions: [{
          questionText: 'What is 2+2?',
          questionType: 'single-correct',
          options: [
            { text: '3', isCorrect: false },
            { text: '4', isCorrect: true },
            { text: '5', isCorrect: false },
            { text: '6', isCorrect: false }
          ],
          points: 1,
          difficulty: 'easy'
        }],
        instructions: 'Answer all questions',
        order: 1
      }],
      startDate: now,
      endDate: tomorrow,
      duration: 60,
      isActive: true,
      allowedStudents: [student._id],
      enableCamera: false,
      enableFullScreen: false,
      preventCopyPaste: false,
      preventRightClick: false,
      resultsPublished: false
    });

    await newTest.save();
    console.log('New test created:', newTest.title);

    // Add test to student's registeredTests
    if (!student.registeredTests.some(rt => rt.testId && rt.testId.equals && rt.testId.equals(newTest._id))) {
      student.registeredTests.push({
        testId: newTest._id,
        status: 'to_attempt',
        registeredAt: new Date(),
        completedAt: null,
        score: null
      });

      await student.save();
      console.log('Test added to student\'s registeredTests');
    }

    console.log('Operation completed successfully');
    mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error);
    mongoose.connection.close();
  }
}

createTestAndAssignStudent();