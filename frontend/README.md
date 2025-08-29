# Online Assessment System - Frontend

This is the frontend application for the Online Assessment System built with React.js.

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn package manager

## Installation

1. **Navigate to the frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Environment Configuration (Optional):**
   Create a `.env` file in the frontend directory to customize the API URL:
   ```env
   REACT_APP_API_URL=http://localhost:5000
   ```

   If not provided, it defaults to `http://localhost:5000`.

4. **Start the development server:**
   ```bash
   npm start
   ```

The frontend application will run on `http://localhost:3000`

## Available Scripts

- `npm start` - Runs the app in development mode
- `npm run build` - Builds the app for production
- `npm test` - Launches the test runner
- `npm run eject` - Ejects from Create React App (one-way operation)

## Features

### For Administrators
- **Dashboard**: Overview of tests, students, and statistics
- **Test Creation**: Create comprehensive tests with multiple sections
- **Question Management**: Support for MCQ and coding questions
- **Image Upload**: Add images to questions
- **Student Management**: Invite students and manage access
- **Results Analytics**: View detailed results and statistics
- **Email Integration**: Send invitations and results

### For Students
- **Secure Test Environment**: Full-screen proctored testing
- **Real-time Monitoring**: Webcam integration
- **Code Editor**: Monaco editor for programming questions
- **Progress Tracking**: Real-time timers and navigation
- **Violation Detection**: Automatic monitoring of suspicious activities

### Security Features
- **Proctoring**: Real-time webcam monitoring
- **Anti-cheating**: Disable copy-paste, right-click, tab switching detection
- **Full-screen Mode**: Mandatory full-screen during tests
- **JWT Authentication**: Secure user authentication
- **Role-based Access**: Admin and student role separation

## Technology Stack

- **React 18** with functional components and hooks
- **React Router** for navigation
- **Tailwind CSS** for styling
- **Monaco Editor** for code editing
- **React Webcam** for camera integration
- **Axios** for API calls
- **React Hot Toast** for notifications
- **Lucide React** for icons
- **Socket.io Client** for real-time features

## Project Structure

```
frontend/
├── public/
│   └── index.html
├── src/
│   ├── components/
│   │   ├── Admin/
│   │   │   ├── AdminDashboard.js
│   │   │   ├── CreateTest.js
│   │   │   ├── TestDetails.js
│   │   │   └── TestResults.js
│   │   ├── Auth/
│   │   │   ├── Login.js
│   │   │   └── Register.js
│   │   └── Student/
│   │       ├── StudentDashboard.js
│   │       └── TestInterface.js
│   ├── contexts/
│   │   └── AuthContext.js
│   ├── config/
│   │   └── api.js
│   ├── App.js
│   ├── index.js
│   └── index.css
├── package.json
└── tailwind.config.js
```

## Configuration

### API Configuration

The frontend communicates with the backend API. The API base URL can be configured using the `REACT_APP_API_URL` environment variable.

Default configuration in `src/config/api.js`:
```javascript
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
```

### Tailwind CSS

The project uses Tailwind CSS for styling. Configuration is in `tailwind.config.js`.

## Development

1. Make sure the backend server is running on `http://localhost:5000`
2. Start the frontend development server:
   ```bash
   npm start
   ```
3. Open `http://localhost:3000` in your browser

## Building for Production

1. **Build the application:**
   ```bash
   npm run build
   ```

2. **Serve the built files:**
   The `build` folder contains the production-ready files that can be served by any static file server.

## Deployment

### Environment Variables for Production

```env
REACT_APP_API_URL=https://your-backend-api-url.com
```

### Deployment Options

- **Netlify**: Deploy the `build` folder
- **Vercel**: Connect your repository for automatic deployments
- **AWS S3 + CloudFront**: Host static files on AWS
- **GitHub Pages**: For simple deployments

## Browser Support

The application supports all modern browsers:
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Troubleshooting

### Common Issues

1. **API Connection Issues:**
   - Ensure backend server is running on the correct port
   - Check CORS configuration in backend
   - Verify API_BASE_URL in frontend configuration

2. **Build Issues:**
   - Clear node_modules and reinstall: `rm -rf node_modules && npm install`
   - Clear npm cache: `npm cache clean --force`

3. **Styling Issues:**
   - Ensure Tailwind CSS is properly configured
   - Check if PostCSS is processing the CSS correctly

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request