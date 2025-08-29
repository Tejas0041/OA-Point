/**
 * Mock Test Creation Script
 *
 * This script creates a comprehensive mock test with:
 * - Aptitude Section: 15 questions (Mathematical, Logical, Reasoning) - 20 minutes
 * - Technical Section: 20 questions (OS, CN, DBMS, OOPs) - 30 minutes
 * - Total Duration: 50 minutes
 * - Real-life coding exam style questions
 *
 * Usage: node create-mock-test.js
 */

const mongoose = require('mongoose');
const Test = require('./models/Test'); // Use your existing Test model
const { ObjectId } = require('mongodb'); // Correct way to import ObjectId
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const mockTestData = {
  title: "Mock Test 1 - Comprehensive Assessment",
  description: "A comprehensive assessment covering Aptitude and Technical skills for placement preparation",
  createdBy: new ObjectId('68b1fd53c9398ee156249284'), // Fixed ObjectId creation
  startDate: new Date(),
  endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
  isActive: true,
  enableCamera: true,
  enableFullScreen: true,
  preventCopyPaste: true,
  preventRightClick: true,
  resultsPublished: false,
  sections: [
    {
      name: "Aptitude",
      timeLimit: 20,
      numberOfQuestions: 15, // This value is now dynamically checked by the script
      order: 1,
      instructions: "This section tests your mathematical, logical, and reasoning abilities. Each question carries 2 points. No negative marking.",
      questions: [
        // Mathematical Questions
        {
          questionText: "A company's profit increased from Rs. 2,40,000 to Rs. 3,60,000. What is the percentage increase in profit?",
          questionType: "single-correct",
          options: [
            { text: "40%", isCorrect: false },
            { text: "50%", isCorrect: true },
            { text: "60%", isCorrect: false },
            { text: "75%", isCorrect: false }
          ],
          points: 2
        },
        {
          questionText: "If the ratio of boys to girls in a class is 3:2 and there are 45 students in total, how many boys are there?",
          questionType: "single-correct",
          options: [
            { text: "25", isCorrect: false },
            { text: "27", isCorrect: true },
            { text: "30", isCorrect: false },
            { text: "18", isCorrect: false }
          ],
          points: 2
        },
        {
          questionText: "A train 150m long crosses a platform 250m long in 20 seconds. What is the speed of the train?",
          questionType: "single-correct",
          options: [
            { text: "72 km/h", isCorrect: true },
            { text: "60 km/h", isCorrect: false },
            { text: "80 km/h", isCorrect: false },
            { text: "90 km/h", isCorrect: false }
          ],
          points: 2
        },
        {
          questionText: "If log₂(x) = 5, what is the value of x?",
          questionType: "single-correct",
          options: [
            { text: "10", isCorrect: false },
            { text: "25", isCorrect: false },
            { text: "32", isCorrect: true },
            { text: "64", isCorrect: false }
          ],
          points: 2 // Corrected 'marks' and 'poiegory' to 'points'
        },
        {
          questionText: "A shopkeeper sells an article at 20% profit. If he had bought it at 10% less and sold it for Rs. 2 more, his profit would have been 40%. Find the cost price.",
          questionType: "single-correct",
          options: [
            { text: "Rs. 100", isCorrect: true },
            { text: "Rs. 120", isCorrect: false },
            { text: "Rs. 80", isCorrect: false },
            { text: "Rs. 150", isCorrect: false }
          ],
          points: 2
        },

        // Logical Questions
        {
          questionText: "In a certain code language, 'ALGORITHM' is written as 'LOGARITHM'. How is 'DATABASE' written in that code?",
          questionType: "single-correct",
          options: [
            { text: "ATABADSE", isCorrect: true }, // Corrected option
            { text: "ESABATAD", isCorrect: false },
            { text: "BASEDAAT", isCorrect: false },
            { text: "DATAESAB", isCorrect: false }
          ],
          points: 2
        },
        {
          questionText: "A clock shows 3:15. What is the angle between hour and minute hands?",
          questionType: "single-correct",
          options: [
            { text: "0°", isCorrect: false },
            { text: "7.5°", isCorrect: true },
            { text: "15°", isCorrect: false },
            { text: "22.5°", isCorrect: false }
          ],
          points: 2
        },
        {
          questionText: "Complete the pattern: 1, 4, 9, 16, 25, 36, ?",
          questionType: "single-correct",
          options: [
            { text: "42", isCorrect: false },
            { text: "49", isCorrect: true },
            { text: "48", isCorrect: false },
            { text: "64", isCorrect: false }
          ],
          points: 2
        },
        {
          questionText: "If FRIEND is coded as HUMJTF, then MOTHER will be coded as:",
          questionType: "single-correct",
          options: [
            { text: "OQVJGT", isCorrect: true },
            { text: "NP: 1,", isCorrect: false },
            { text: "LQSGDQ", isCorrect: false },
            { text: "NQVJGT", isCorrect: false }
          ],
          points: 2
        },
        {
          questionText: "Find the missing number in the series: 2, 6, 12, 20, 30, ?",
          questionType: "single-correct",
          options: [
            { text: "40", isCorrect: false },
            { text: "42", isCorrect: true },
            { text: "44", isCorrect: false },
            { text: "38", isCorrect: false }
          ],
          points: 2, // Removed extra comma
        },
        {
          questionText: "In a family of 6 members A, B, C, D, E and F, there are two married couples. B is grandmother of A and mother of E. C is wife of E and mother of A. F is the father of A. How is D related to A?",
          questionType: "single-correct",
          options: [
            { text: "Uncle", isCorrect: true },
            { text: "Father", isCorrect: false },
            { text: "Grandfather", isCorrect: false },
            { text: "Brother", isCorrect: false }
          ],
          points: 2
        },

        // Reasoning Questions
        {
          questionText: "Statements: All programmers are logical. Some logical people are creative. Conclusions: I. Some programmers are creative. II. All creative people are programmers.",
          questionType: "single-correct",
          options: [
            { text: "Only conclusion I follows", isCorrect: false },
            { text: "Only conclusion II follows", isCorrect: false },
            { text: "Both conclusions follow", isCorrect: false },
            { text: "Neither conclusion follows", isCorrect: true }
          ],
          points: 2
        },
        {
          questionText: "A cube is painted red on all faces and then cut into 64 smaller cubes of equal size. How many small cubes will have exactly two faces painted?",
          questionType: "single-correct",
          options: [
            { text: "8", isCorrect: false },
            { text: "12", isCorrect: false },
            { text: "24", isCorrect: true },
            { text: "32", isCorrect: false }
          ],
          points: 2
        },
        {
          questionText: "If in a certain language, MADRAS is coded as NBESBT, how is BOMBAY coded in that language?",
          questionType: "single-correct",
          options: [
            { text: "CPNCBZ", isCorrect: true },
            { text: "CPOCBZ", isCorrect: false },
            { text: "CQNCBZ", isCorrect: false },
            { text: "CPNDBZ", isCorrect: false }
          ],
          points: 2
        },
        {
          questionText: "A person starts from point A and walks 10 km North, then 6 km East, then 10 km South, then 6 km West. Where is he now with respect to point A?",
          questionType: "single-correct",
          options: [
            { text: "At point A", isCorrect: true },
            { text: "6 km East of A", isCorrect: false },
            { text: "6 km West of A", isCorrect: false },
            { text: "10 km North of A", isCorrect: false }
          ],
          points: 2
        },
        {
          questionText: "In a row of trees, a tree is 7th from left end and 14th from right end. How many trees are there in the row?",
          questionType: "single-correct",
          options: [
            { text: "19", isCorrect: false },
            { text: "20", isCorrect: true },
            { text: "21", isCorrect: false },
            { text: "22", isCorrect: false }
          ],
          points: 2
        }
      ]
    },
    {
      name: "Technical",
      timeLimit: 30,
      numberOfQuestions: 20, // This value is now dynamically checked by the script
      order: 2,
      instructions: "This section covers Operating Systems, Computer Networks, Database Management Systems, and Object-Oriented Programming concepts. Each question carries 2 points.",
      questions: [
        // Operating Systems
        {
          questionText: "In a multi-programming environment, what happens when a process makes an I/O request?",
          questionType: "single-correct",
          options: [
            { text: "The process continues execution", isCorrect: false },
            { text: "The process is blocked and CPU is allocated to another process", isCorrect: true },
            { text: "The system crashes", isCorrect: false },
            { text: "All processes are suspended", isCorrect: false }
          ],
          points: 2
        },
        {
          questionText: "Which of the following is NOT a condition for deadlock?",
          questionType: "single-correct",
          options: [
            { text: "Mutual Exclusion", isCorrect: false },
            { text: "Hold and Wait", isCorrect: false },
            { text: "Preemption", isCorrect: true },
            { text: "Circular Wait", isCorrect: false }
          ],
          points: 2
        },
        {
          questionText: "In paging, if page size is 4KB and logical address is 32 bits, how many bits are used for page offset?",
          questionType: "single-correct",
          options: [
            { text: "10 bits", isCorrect: false },
            { text: "12 bits", isCorrect: true },
            { text: "16 bits", isCorrect: false },
            { text: "20 bits", isCorrect: false }
          ],
          points: 2
        },
        {
          questionText: "Which scheduling algorithm provides the minimum average waiting time?",
          questionType: "single-correct",
          options: [
            { text: "FCFS", isCorrect: false },
            { text: "SJF", isCorrect: true },
            { text: "Round Robin", isCorrect: false },
            { text: "Priority Scheduling", isCorrect: false }
          ],
          points: 2
        },
        {
          questionText: "What is the main advantage of using threads over processes?",
          questionType: "single-correct",
          options: [
            { text: "Better security", isCorrect: false },
            { text: "Lower overhead for creation and context switching", isCorrect: true },
            { text: "More memory usage", isCorrect: false },
            { text: "Independent memory space", isCorrect: false }
          ],
          points: 2
        },

        // Computer Networks
        {
          questionText: "In TCP/IP, which protocol is responsible for error detection and correction at the transport layer?",
          questionType: "single-correct",
          options: [
            { text: "IP", isCorrect: false },
            { text: "TCP", isCorrect: true },
            { text: "UDP", isCorrect: false },
            { text: "ICMP", isCorrect: false }
          ],
          points: 2
        },
        {
          questionText: "What is the maximum number of hosts possible in a Class C network?",
          questionType: "single-correct",
          options: [
            { text: "254", isCorrect: true },
            { text: "256", isCorrect: false },
            { text: "65534", isCorrect: false },
            { text: "16777214", isCorrect: false }
          ],
          points: 2
        },
        {
          questionText: "Which algorithm is used by Ethernet for collision detection?",
          questionType: "single-correct",
          options: [
            { text: "CSMA/CD", isCorrect: true },
            { text: "CSMA/CA", isCorrect: false },
            { text: "Token Ring", isCorrect: false },
            { text: "FDMA", isCorrect: false }
          ],
          points: 2
        },
        {
          questionText: "In the sliding window protocol, what happens when the sender's window size is 1?",
          questionType: "single-correct",
          options: [
            { text: "It becomes Go-Back-N", isCorrect: false },
            { text: "It becomes Stop-and-Wait", isCorrect: true },
            { text: "It becomes Selective Repeat", isCorrect: false },
            { text: "Protocol fails", isCorrect: false }
          ],
          points: 2
        },
        {
          questionText: "Which routing algorithm is used by OSPF?",
          questionType: "single-correct",
          options: [
            { text: "Distance Vector", isCorrect: false },
            { text: "Link State", isCorrect: true },
            { text: "Path Vector", isCorrect: false },
            { text: "Flooding", isCorrect: false }
          ],
          points: 2
        },

        // Database Management Systems
        {
          questionText: "In a relational database, what does referential integrity ensure?",
          questionType: "single-correct",
          options: [
            { text: "No duplicate records", isCorrect: false },
            { text: "Foreign key values match primary key values in referenced table", isCorrect: true },
            { text: "All attributes have values", isCorrect: false },
            { text: "Data is normalized", isCorrect: false }
          ],
          points: 2
        },
        {
          questionText: "Which of the following is NOT a property of ACID transactions?",
          questionType: "single-correct",
          options: [
            { text: "Atomicity", isCorrect: false },
            { text: "Consistency", isCorrect: false },
            { text: "Availability", isCorrect: true },
            { text: "Durability", isCorrect: false }
          ],
          points: 2
        },
        {
          questionText: "In SQL, which clause is used to eliminate duplicate rows from the result set?",
          questionType: "single-correct",
          options: [
            { text: "UNIQUE", isCorrect: false },
            { text: "DISTINCT", isCorrect: true },
            { text: "DIFFERENT", isCorrect: false },
            { text: "SINGLE", isCorrect: false }
          ],
          points: 2
        },
        {
          questionText: "What is the main purpose of database normalization?",
          questionType: "single-correct",
          options: [
            { text: "Increase data redundancy", isCorrect: false },
            { text: "Reduce data redundancy and improve data integrity", isCorrect: true },
            { text: "Improve query performance", isCorrect: false },
            { text: "Increase storage space", isCorrect: false }
          ],
          points: 2
        },
        {
          questionText: "In a B+ tree index, where are the actual data pointers stored?",
          questionType: "single-correct",
          options: [
            { text: "Internal nodes only", isCorrect: false },
            { text: "Leaf nodes only", isCorrect: true },
            { text: "Both internal and leaf nodes", isCorrect: false },
            { text: "Root node only", isCorrect: false }
          ],
          points: 2
        },

        // Object-Oriented Programming
        {
          questionText: "In Java, what happens if a class doesn't explicitly extend any class?",
          questionType: "single-correct",
          options: [
            { text: "Compilation error", isCorrect: false },
            { text: "It automatically extends Object class", isCorrect: true },
            { text: "It becomes abstract", isCorrect: false },
            { text: "It cannot be instantiated", isCorrect: false }
          ],
          points: 2
        },
        {
          questionText: "Which of the following best describes encapsulation in OOP?",
          questionType: "single-correct",
          options: [
            { text: "Creating multiple classes", isCorrect: false },
            { text: "Hiding internal implementation details", isCorrect: true },
            { text: "Using inheritance", isCorrect: false },
            { text: "Method overloading", isCorrect: false }
          ],
          points: 2
        },
        {
          questionText: "In C++, what is the difference between public and private inheritance?",
          questionType: "single-correct",
          options: [
            { text: "No difference", isCorrect: false },
            { text: "Public inheritance maintains 'is-a' relationship, private doesn't", isCorrect: true },
            { text: "Private inheritance is faster", isCorrect: false },
            { text: "Public inheritance uses more memory", isCorrect: false }
          ],
          points: 2
        },
        {
          questionText: "What is the main advantage of using interfaces in Java?",
          questionType: "single-correct",
          options: [
            { text: "Faster execution", isCorrect: false },
            { text: "Multiple inheritance of type", isCorrect: true },
            { text: "Less memory usage", isCorrect: false },
            { text: "Better security", isCorrect: false }
          ],
          points: 2
        },
        {
          questionText: "In object-oriented design, what does the 'Open/Closed Principle' state?",
          questionType: "single-correct",
          options: [
            { text: "Classes should be open for modification", isCorrect: false },
            { text: "Classes should be open for extension but closed for modification", isCorrect: true },
            { text: "Classes should be closed for both extension and modification", isCorrect: false },
            { text: "Classes should always be abstract", isCorrect: false }
          ],
          points: 2
        }
      ]
    }
  ]
};

async function createMockTest() {
  try {
    console.log('Creating Mock Test 1...');

    // Check if test already exists
    const existingTest = await Test.findOne({ title: mockTestData.title });
    if (existingTest) {
      console.log('Mock Test 1 already exists. Updating...');
      await Test.findByIdAndUpdate(existingTest._id, mockTestData);
      console.log('Mock Test 1 updated successfully!');
    } else {
      const newTest = new Test(mockTestData);
      await newTest.save();
      console.log('Mock Test 1 created successfully!');
    }

    console.log('\nTest Details:');
    console.log(`Title: ${mockTestData.title}`);
    console.log(`Total Questions: ${mockTestData.sections.reduce((total, section) => total + section.questions.length, 0)}`);
    console.log(`Total Time: ${mockTestData.sections.reduce((total, section) => total + section.timeLimit, 0)} minutes`);
    console.log(`Total Points: ${mockTestData.sections.reduce((total, section) => total + section.questions.reduce((sectionTotal, q) => sectionTotal + q.points, 0), 0)}`);
    console.log('\nSections:');
    mockTestData.sections.forEach(section => {
      console.log(`- ${section.name}: ${section.questions.length} questions, ${section.timeLimit} minutes`);
      console.log(`   Instructions: ${section.instructions}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Error creating mock test:', error);
    process.exit(1);
  }
}

// Run the script
createMockTest();