require('dotenv').config();
const mongoose = require('mongoose');
const Test = require('./models/Test');

async function checkTestImages() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const tests = await Test.find({});
    console.log(`Found ${tests.length} tests`);
    
    if (tests.length === 0) {
      console.log('No tests found in database');
      return;
    }

    tests.forEach((test, index) => {
      console.log(`\nTest ${index + 1}: ${test.title}`);
      
      test.sections.forEach((section, sIndex) => {
        console.log(`  Section ${sIndex + 1}: ${section.title}`);
        
        section.questions.forEach((question, qIndex) => {
          if (question.questionImage) {
            console.log(`    Question ${qIndex + 1} image: ${question.questionImage}`);
          }
          
          if (question.options) {
            question.options.forEach((option, oIndex) => {
              if (option.optionImage) {
                console.log(`    Option ${oIndex + 1} image: ${option.optionImage}`);
              }
            });
          }
        });
      });
    });

    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
  }
}

checkTestImages();