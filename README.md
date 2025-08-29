# Online Assessment System

A comprehensive online assessment platform built with the MERN stack, featuring real-time proctoring, coding assessments, and advanced admin controls.

## Project Structure

The project is now organized into separate frontend and backend directories:

```
online-assessment-system/
├── backend/          # Node.js/Express backend server
│   ├── models/       # MongoDB models
│   ├── routes/       # API routes
│   ├── middleware/   # Authentication middleware
│   ├── server.js     # Main server file
│   ├── package.json  # Backend dependencies
│   └── .env          # Backend environment variables
├── frontend/         # React.js frontend application
│   ├── src/          # React source code
│   ├── public/       # Static files
│   ├── package.json  # Frontend dependencies
│   └── .env          # Frontend environment variables (optional)
└── README.md         # This file
```

## Features

### For Administrators
- **Test Creation**: Create tests with multiple sections (Aptitude, Technical, Coding, etc.)
- **Question Types**: Single correct, multiple correct, and coding problems
- **Image Support**: Upload images for questions via Cloudinary
- **Coding Problems**: Full support for C++ coding questions with test cases
- **Scheduling**: Set start/end dates and time windows for tests
- **Student Management**: Invite specific students via email
- **Proctoring Controls**: Enable/disable camera, full-screen, copy-paste prevention
- **Results Management**: View detailed results and send them to students
- **Analytics**: Comprehensive statistics and score distributions

### For Students
- **Secure Test Environment**: Full-screen mode with proctoring features
- **Real-time Monitoring**: Webcam integration with collapsible view
- **Coding Interface**: Integrated Monaco editor for C++ programming
- **Code Execution**: Run example test cases and submit solutions
- **Violation Detection**: Automatic detection of suspicious activities
- **Progress Tracking**: Real-time timer and question navigation
- **Responsive Design**: Works on desktop and laptop devices

### Security Features
- **Proctoring**: Real-time webcam monitoring
- **Anti-cheating**: Disable copy-paste, right-click, and tab switching detection
- **Full-screen Mode**: Mandatory full-screen during tests
- **Violation Logging**: Track and report suspicious activities
- **JWT Authentication**: Secure user authentication
- **Rate Limiting**: API protection against abuse

## Technology Stack

### Backend
- **Node.js** with Express.js
- **MongoDB** with Mongoose ODM
- **JWT** for authentication
- **Cloudinary** for image storage
- **Nodemailer** for email notifications
- **Socket.io** for real-time features
- **Helmet** for security headers
- **Rate limiting** for API protection

### Frontend
- **React 18** with functional components and hooks
- **React Router** for navigation
- **Tailwind CSS** for styling
- **Monaco Editor** for code editing
- **React Webcam** for camera integration
- **Axios** for API calls
- **React Hot Toast** for notifications
- **Lucide React** for icons

## Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or cloud)
- npm or yarn package manager

### Quick Start

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd online-assessment-system
   ```

### Backend Setup

1. **Navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Install backend dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   Create a `.env` file in the `backend` directory:
   ```env
   MONGODB_URI=mongodb://localhost:27017/online-assessment
   JWT_SECRET=your_super_secret_jwt_key_here
   CLIENT_URL=http://localhost:3000

   # Cloudinary Configuration (for image uploads)
   CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
   CLOUDINARY_API_KEY=your_cloudinary_api_key
   CLOUDINARY_API_SECRET=your_cloudinary_api_secret

   # Email Configuration (Gmail recommended)
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASS=your_gmail_app_password

   # Optional: External Compiler API
   COMPILER_API_URL=https://api.jdoodle.com/v1/execute
   COMPILER_CLIENT_ID=your_jdoodle_client_id
   COMPILER_CLIENT_SECRET=your_jdoodle_client_secret
   ```

4. **Start MongoDB**
   ```bash
   # If using local MongoDB
   mongod
   
   # Or use MongoDB Atlas cloud service
   ```

5. **Start the backend server**
   ```bash
   npm start
   ```

   The backend server will run on `http://localhost:5000`

### Frontend Setup

1. **Open a new terminal and navigate to frontend directory**
   ```bash
   cd frontend
   ```

2. **Install frontend dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration (Optional)**
   Create a `.env` file in the `frontend` directory to customize API URL:
   ```env
   REACT_APP_API_URL=http://localhost:5000
   ```

4. **Start the React development server**
   ```bash
   npm start
   ```

   The frontend application will run on `http://localhost:3000`

## Running the Application

### Method 1: Separate Terminals (Recommended)

**Terminal 1 - Backend:**
```bash
cd backend
npm start
```

**Terminal 2 - Frontend:**
```bash
cd frontend  
npm start
```

### Method 2: Using Process Managers

You can also use process managers like `concurrently` or `pm2` to run both servers:

```bash
# Install concurrently globally
npm install -g concurrently

# From the root directory
concurrently "cd backend && npm start" "cd frontend && npm start"
```

## Access Points

- **Frontend Application**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **API Documentation**: http://localhost:5000/api (if implemented)

## Configuration

### Email Setup (Gmail)
1. Enable 2-factor authentication on your Gmail account
2. Generate an App Password:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate password for "Mail"
   - Use this password in `EMAIL_PASS`

### Cloudinary Setup
1. Create account at [Cloudinary](https://cloudinary.com/)
2. Get your cloud name, API key, and API secret from dashboard
3. Add these to your `.env` file

### MongoDB Setup
**Local MongoDB:**
```bash
# Install MongoDB Community Edition
# Start MongoDB service
mongod --dbpath /path/to/your/db
```

**MongoDB Atlas (Cloud):**
1. Create account at [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a cluster
3. Get connection string and add to `MONGODB_URI`

## Usage

### Admin Workflow
1. **Register/Login** as admin
2. **Create Test**:
   - Set basic information (title, description, duration)
   - Configure proctoring settings
   - Add sections with different question types
   - Upload images for questions if needed
   - Add coding problems with test cases
3. **Invite Students**:
   - Select students to invite
   - Send email invitations with test links
4. **Monitor Results**:
   - View real-time statistics
   - Check individual student results
   - Export results as CSV
   - Send results to students

### Student Workflow
1. **Register/Login** as student
2. **Access Test**:
   - Click on test link from email invitation
   - Review test instructions
   - Start test (enters full-screen mode)
3. **Take Test**:
   - Answer MCQ questions
   - Write and test code for programming questions
   - Navigate between questions within sections
   - Complete sections sequentially
4. **Submit Test**:
   - Submit individual answers
   - Complete sections to move forward
   - Final test submission

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update profile

### Admin Routes
- `GET /api/admin/tests` - Get all tests
- `POST /api/admin/tests` - Create new test
- `GET /api/admin/tests/:id` - Get specific test
- `PUT /api/admin/tests/:id` - Update test
- `DELETE /api/admin/tests/:id` - Delete test
- `POST /api/admin/upload-image` - Upload question image
- `GET /api/admin/students` - Get all students
- `POST /api/admin/tests/:id/send-invitations` - Send invitations
- `GET /api/admin/tests/:id/results` - Get test results
- `POST /api/admin/tests/:id/send-results` - Send results to students

### Student Routes
- `GET /api/student/tests` - Get available tests
- `GET /api/student/tests/:id` - Get test details
- `POST /api/student/tests/:id/start` - Start test attempt
- `POST /api/student/tests/:id/submit-answer` - Submit answer
- `POST /api/student/tests/:id/complete-section` - Complete section
- `POST /api/student/tests/:id/submit` - Submit entire test
- `POST /api/student/tests/:id/report-violation` - Report violation

### Compiler Routes
- `POST /api/compiler/run` - Run code with example test cases
- `POST /api/compiler/submit` - Submit code with all test cases
- `GET /api/compiler/languages` - Get supported languages

## Database Schema

### User Model
```javascript
{
  name: String,
  email: String (unique),
  password: String (hashed),
  role: String (admin/student),
  registrationNumber: String,
  phone: String,
  isActive: Boolean
}
```

### Test Model
```javascript
{
  title: String,
  description: String,
  createdBy: ObjectId (User),
  sections: [SectionSchema],
  startDate: Date,
  endDate: Date,
  duration: Number,
  isActive: Boolean,
  allowedStudents: [ObjectId],
  enableCamera: Boolean,
  enableFullScreen: Boolean,
  preventCopyPaste: Boolean,
  preventRightClick: Boolean
}
```

### TestAttempt Model
```javascript
{
  testId: ObjectId (Test),
  studentId: ObjectId (User),
  startTime: Date,
  endTime: Date,
  currentSection: Number,
  isCompleted: Boolean,
  sectionAttempts: [SectionAttemptSchema],
  totalScore: Number,
  percentage: Number,
  violations: [ViolationSchema],
  browserInfo: Object
}
```

## Security Considerations

1. **Authentication**: JWT tokens with expiration
2. **Authorization**: Role-based access control
3. **Input Validation**: Server-side validation for all inputs
4. **Rate Limiting**: API endpoint protection
5. **CORS**: Configured for specific origins
6. **Helmet**: Security headers
7. **Password Hashing**: bcrypt for password security
8. **Environment Variables**: Sensitive data protection

## Deployment

### Backend Deployment (Heroku/Railway/DigitalOcean)
1. Set environment variables on hosting platform
2. Ensure MongoDB connection string is correct
3. Set `NODE_ENV=production`
4. Configure CORS for production domain

### Frontend Deployment (Netlify/Vercel)
1. Build the React app: `npm run build`
2. Deploy the `build` folder
3. Configure API base URL for production
4. Set up redirects for React Router

### Environment Variables for Production
```env
NODE_ENV=production
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/dbname
JWT_SECRET=your_production_jwt_secret
CLIENT_URL=https://your-frontend-domain.com
```

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -am 'Add feature'`
4. Push to branch: `git push origin feature-name`
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions:
- Create an issue on GitHub
- Email: support@example.com

## Roadmap

- [ ] Support for more programming languages
- [ ] Advanced analytics and reporting
- [ ] Mobile app support
- [ ] Integration with LMS platforms
- [ ] AI-powered proctoring
- [ ] Plagiarism detection for code
- [ ] Voice recognition features
- [ ] Multi-language support#   O A - P o i n t  
 