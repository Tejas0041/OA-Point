const mongoose = require('mongoose');
const Test = require('./models/Test');
const TestAttempt = require('./models/TestAttempt');
const User = require('./models/User');
require('dotenv').config();

async function debugTest() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/online-assessment', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    // Find the latest test
    const test = await Test.findOne().sort({ createdAt: -1 });
    if (!test) {
      console.log('No test found');
      return;
    }

    console.log('=== TEST STRUCTURE ===');
    console.log('Test title:', test.title);
    console.log('Sections:', test.sections.length);
    
    test.sections.forEach((section, sIndex) => {
      console.log(`\nSection ${sIndex + 1}: ${section.name}`);
      console.log('Questions:', section.questions.length);
      
      section.questions.forEach((question, qIndex) => {
        console.log(`\n  Question ${qIndex + 1}: ${question.questionText}`);
        console.log('  Type:', question.questionType);
        console.log('  Points:', question.points);
        console.log('  Options:');
        question.options.forEach((option, oIndex) => {
          console.log(`    ${oIndex}: ${option.text} (${option.isCorrect ? 'CORRECT' : 'wrong'})`);
        });
      });
    });

    // Find student
    const student = await User.findOne({ role: 'student' });
    if (student) {
      console.log('\n=== STUDENT INFO ===');
      console.log('Email:', student.email);
      console.log('Enrollment Number:', student.enrollmentNumber);
      console.log('Registration Number:', student.registrationNumber);
      
      // Find latest attempt
      const attempt = await TestAttempt.findOne({ 
        testId: test._id, 
        studentId: student._id 
      }).sort({ createdAt: -1 });
      
      if (attempt) {
        console.log('\n=== LATEST ATTEMPT ===');
        console.log('Total Score:', attempt.totalScore);
        console.log('Max Score:', attempt.maxScore);
        console.log('Percentage:', attempt.percentage);
        console.log('Section Attempts:', attempt.sectionAttempts.length);
        
        attempt.sectionAttempts.forEach((sectionAttempt, sIndex) => {
          console.log(`\nSection ${sIndex + 1}: ${sectionAttempt.sectionName}`);
          console.log('Answers:', sectionAttempt.answers.length);
          
          sectionAttempt.answers.forEach((answer, aIndex) => {
            console.log(`  Answer ${aIndex + 1}:`);
            console.log('    Question ID:', answer.questionId);
            console.log('    Type:', answer.questionType);
            console.log('    Selected Options:', answer.selectedOptions);
            console.log('    Is Correct:', answer.isCorrect);
            console.log('    Points:', answer.points);
          });
        });
      } else {
        console.log('No attempt found');
      }
    }

    mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error);
    mongoose.connection.close();
  }
}

debugTest();