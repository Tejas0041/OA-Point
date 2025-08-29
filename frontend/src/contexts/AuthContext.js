import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { API_ENDPOINTS } from '../config/api';
import { isTokenExpired, clearAuthData } from '../utils/tokenUtils';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Debug effect to track user state changes
  useEffect(() => {
    console.log('AuthContext: User state changed:', user);
  }, [user]);

  // Set up axios interceptor for handling token expiration
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Token expired or invalid
          console.log('Token expired, clearing auth data');
          localStorage.removeItem('token');
          delete axios.defaults.headers.common['Authorization'];
          setUser(null);
          
          // Only show toast if it's not during initial load
          if (!loading) {
            toast.error('Session expired. Please login again.');
          }
        }
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, [loading]);

  // Set up axios defaults and check token validity
  useEffect(() => {
    const token = localStorage.getItem('token');
    console.log('AuthContext: Initial setup - token exists:', !!token);
    
    if (token) {
      // Check if token is expired before using it
      if (isTokenExpired(token)) {
        console.log('Token is expired, clearing auth data');
        clearAuthData();
        setUser(null);
        setLoading(false);
        toast.error('Your session has expired. Please login again.');
      } else {
        console.log('Token is valid, setting up axios and fetching user');
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        fetchUser();
      }
    } else {
      console.log('No token found, setting loading to false');
      setLoading(false);
    }
  }, []);

  const fetchUser = async () => {
    try {
      console.log('AuthContext: Fetching user...');
      console.log('AuthContext: Token exists:', !!localStorage.getItem('token'));
      console.log('AuthContext: Axios auth header:', axios.defaults.headers.common['Authorization']);
      
      const response = await axios.get(API_ENDPOINTS.ME);
      console.log('AuthContext: User response:', response.data);
      
      if (response.data && response.data.user) {
        console.log('AuthContext: Setting user:', response.data.user);
        setUser(response.data.user);
        console.log('AuthContext: User set successfully');
      } else {
        console.error('AuthContext: Invalid response format:', response.data);
        setUser(null);
      }
    } catch (error) {
      console.error('AuthContext: Fetch user error:', error);
      console.error('AuthContext: Error response:', error.response?.data);
      console.error('AuthContext: Error status:', error.response?.status);
      
      // Don't handle 401 here as the interceptor will handle it
      if (error.response?.status !== 401) {
        localStorage.removeItem('token');
        delete axios.defaults.headers.common['Authorization'];
        setUser(null);
      }
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await axios.post(API_ENDPOINTS.LOGIN, { email, password });
      
      // Check if login requires email verification
      if (response.data.requiresVerification) {
        toast.error(response.data.message);
        return { success: false, requiresVerification: true, email: response.data.email };
      }
      
      const { token, user } = response.data;
      
      localStorage.setItem('token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser(user);
      
      toast.success('Login successful!');
      return { success: true };
    } catch (error) {
      let message = 'Login failed';
      
      if (error.response?.status === 429) {
        message = 'Too many login attempts. Please wait a moment and try again.';
      } else if (error.response?.data?.message) {
        message = error.response.data.message;
      }
      
      toast.error(message);
      return { success: false, message };
    }
  };

  const register = async (userData) => {
    try {
      const response = await axios.post(API_ENDPOINTS.REGISTER, userData);
      
      // Check if registration requires email verification
      if (response.data.requiresVerification) {
        toast.success(response.data.message);
        return { success: true, requiresVerification: true, email: response.data.email };
      }
      
      // Old flow for backward compatibility
      const { token, user } = response.data;
      localStorage.setItem('token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser(user);
      
      toast.success('Registration successful!');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Registration failed';
      toast.error(message);
      return { success: false, message };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
    toast.success('Logged out successfully');
  };

  const updateProfile = async (profileData) => {
    try {
      const response = await axios.put(API_ENDPOINTS.PROFILE, profileData);
      setUser(response.data.user);
      toast.success('Profile updated successfully!');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Profile update failed';
      toast.error(message);
      return { success: false, message };
    }
  };

  const verifyEmail = async (token) => {
    try {
      const response = await axios.post(API_ENDPOINTS.VERIFY_EMAIL, { token });
      
      // Auto-login after verification
      const { token: jwtToken, user } = response.data;
      localStorage.setItem('token', jwtToken);
      axios.defaults.headers.common['Authorization'] = `Bearer ${jwtToken}`;
      setUser(user);
      
      toast.success(response.data.message);
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Email verification failed';
      toast.error(message);
      return { success: false, message };
    }
  };

  const resendVerification = async (email) => {
    try {
      const response = await axios.post(API_ENDPOINTS.RESEND_VERIFICATION, { email });
      toast.success(response.data.message);
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to resend verification email';
      toast.error(message);
      return { success: false, message };
    }
  };

  const forgotPassword = async (email) => {
    try {
      const response = await axios.post(API_ENDPOINTS.FORGOT_PASSWORD, { email });
      toast.success(response.data.message);
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to send password reset email';
      toast.error(message);
      return { success: false, message };
    }
  };

  const resetPassword = async (token, newPassword) => {
    try {
      const response = await axios.post(API_ENDPOINTS.RESET_PASSWORD, { token, newPassword });
      toast.success(response.data.message);
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Password reset failed';
      toast.error(message);
      return { success: false, message };
    }
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    updateProfile,
    verifyEmail,
    resendVerification,
    forgotPassword,
    resetPassword
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};