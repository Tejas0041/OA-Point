const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

async function updateStudentEnrollment() {
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
    console.log('Current enrollment number:', student.enrollmentNumber);
    console.log('Current registration number:', student.registrationNumber);

    // Update enrollment number if not set
    if (!student.enrollmentNumber && !student.registrationNumber) {
      student.enrollmentNumber = 'STU2025001';
      student.registrationNumber = 'REG2025001';
      await student.save();
      console.log('Updated student with enrollment and registration numbers');
    } else {
      console.log('Student already has enrollment/registration numbers');
    }

    mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error);
    mongoose.connection.close();
  }
}

updateStudentEnrollment();