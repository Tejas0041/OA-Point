import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { useAuth } from './contexts/AuthContext';

// Components
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import EmailVerification from './components/Auth/EmailVerification';
import ForgotPassword from './components/Auth/ForgotPassword';
import ResetPassword from './components/Auth/ResetPassword';
import AdminDashboard from './components/Admin/AdminDashboard';
import StudentDashboard from './components/Student/StudentDashboard';
import TestInterface from './components/Student/TestInterface';
import StudentTestResults from './components/Student/TestResults';
import CreateTest from './components/Admin/CreateTest';
import EditTest from './components/Admin/EditTest';
import TestResults from './components/Admin/TestResults';
import TestDetails from './components/Admin/TestDetails';
import StudentManagement from './components/Admin/StudentManagement';
import StudentProfile from './components/Student/StudentProfile';
import StudentHelp from './components/Student/StudentHelp';
import NotFound from './components/Common/NotFound';

// Protected Route Component
const ProtectedRoute = ({ children, requiredRole }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to={user.role === 'admin' ? '/admin/dashboard' : '/student/dashboard'} replace />;
  }
  
  return children;
};

// App Routes Component
const AppRoutes = () => {
  const { user } = useAuth();
  
  return (
    <Routes>
      {/* Public Routes */}
      <Route 
        path="/login" 
        element={user ? <Navigate to={user.role === 'admin' ? '/admin/dashboard' : '/student/dashboard'} replace /> : <Login />} 
      />
      <Route 
        path="/register" 
        element={user ? <Navigate to={user.role === 'admin' ? '/admin/dashboard' : '/student/dashboard'} replace /> : <Register />} 
      />
      <Route 
        path="/verify-email" 
        element={user ? <Navigate to={user.role === 'admin' ? '/admin/dashboard' : '/student/dashboard'} replace /> : <EmailVerification />} 
      />
      <Route 
        path="/forgot-password" 
        element={user ? <Navigate to={user.role === 'admin' ? '/admin/dashboard' : '/student/dashboard'} replace /> : <ForgotPassword />} 
      />
      <Route 
        path="/reset-password" 
        element={user ? <Navigate to={user.role === 'admin' ? '/admin/dashboard' : '/student/dashboard'} replace /> : <ResetPassword />} 
      />
      
      {/* Admin Routes */}
      <Route 
        path="/admin" 
        element={<Navigate to="/admin/dashboard" replace />}
      />
      <Route 
        path="/admin/dashboard" 
        element={
          <ProtectedRoute requiredRole="admin">
            <AdminDashboard />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin/create-test" 
        element={
          <ProtectedRoute requiredRole="admin">
            <CreateTest />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin/edit-test/:id" 
        element={
          <ProtectedRoute requiredRole="admin">
            <EditTest />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin/test/:id" 
        element={
          <ProtectedRoute requiredRole="admin">
            <TestDetails />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin/test/:id/results" 
        element={
          <ProtectedRoute requiredRole="admin">
            <TestResults />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin/students" 
        element={
          <ProtectedRoute requiredRole="admin">
            <StudentManagement />
          </ProtectedRoute>
        } 
      />
      
      {/* Student Routes */}
      <Route 
        path="/student" 
        element={<Navigate to="/student/dashboard" replace />}
      />
      <Route 
        path="/student/dashboard" 
        element={
          <ProtectedRoute requiredRole="student">
            <StudentDashboard />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/student/test/:id" 
        element={
          <ProtectedRoute requiredRole="student">
            <TestInterface />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/student/test/:id/results" 
        element={
          <ProtectedRoute requiredRole="student">
            <StudentTestResults />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/student/profile" 
        element={
          <ProtectedRoute requiredRole="student">
            <StudentProfile />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/student/help" 
        element={
          <ProtectedRoute requiredRole="student">
            <StudentHelp />
          </ProtectedRoute>
        } 
      />
      
      {/* Default Route */}
      <Route 
        path="/" 
        element={
          user ? (
            <Navigate to={user.role === 'admin' ? '/admin/dashboard' : '/student/dashboard'} replace />
          ) : (
            <Navigate to="/login" replace />
          )
        } 
      />
      
      {/* 404 Route - Must be last */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <AppRoutes />
          <Toaster 
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
            }}
          />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;