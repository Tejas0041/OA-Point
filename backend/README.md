# Online Assessment System - Backend

This is the backend server for the Online Assessment System built with Node.js, Express, and MongoDB.

## Prerequisites

- Node.js (v16 or higher)
- MongoDB (local or cloud)
- npm or yarn package manager

## Installation

1. **Navigate to the backend directory:**
   ```bash
   cd backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Environment Configuration:**
   Create a `.env` file in the backend directory:
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

4. **Start MongoDB:**
   ```bash
   # If using local MongoDB
   mongod
   
   # Or use MongoDB Atlas cloud service
   ```

5. **Start the backend server:**
   ```bash
   npm start
   ```

   For development with auto-restart:
   ```bash
   npm run server
   ```

The backend server will run on `http://localhost:5000`

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

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `MONGODB_URI` | MongoDB connection string | Yes |
| `JWT_SECRET` | Secret key for JWT tokens | Yes |
| `CLIENT_URL` | Frontend URL for CORS | Yes |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name | Optional |
| `CLOUDINARY_API_KEY` | Cloudinary API key | Optional |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret | Optional |
| `EMAIL_USER` | Gmail email address | Optional |
| `EMAIL_PASS` | Gmail app password | Optional |

## Features

- JWT Authentication with role-based access control
- MongoDB integration with Mongoose ODM
- Image upload with Cloudinary
- Email notifications with Nodemailer
- Real-time features with Socket.io
- Security middleware (Helmet, CORS, Rate limiting)
- C++ code compilation and execution
- Comprehensive test management
- Proctoring and violation tracking

## Development

For development with auto-restart:
```bash
npm run server
```

## Production

Set environment variables and start the server:
```bash
NODE_ENV=production npm start
```