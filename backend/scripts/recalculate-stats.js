const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

async function recalculateAllStats() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const students = await User.find({ role: 'student' });
    console.log(`Found ${students.length} students`);

    for (const student of students) {
      console.log(`\nProcessing student: ${student.name} (${student.email})`);
      console.log(`Registered tests: ${student.registeredTests?.length || 0}`);
      
      if (student.registeredTests && student.registeredTests.length > 0) {
        console.log('Test statuses:', student.registeredTests.map(t => t.status));
        const stats = student.updateTestStatistics();
        await student.save();
        console.log('Updated stats:', stats);
      } else {
        console.log('No registered tests found');
      }
    }

    console.log('\nStats recalculation completed');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

recalculateAllStats();