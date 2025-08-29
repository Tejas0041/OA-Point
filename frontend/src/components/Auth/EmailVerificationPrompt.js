import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Mail, RefreshCw, CheckCircle } from 'lucide-react';
import Footer from '../Common/Footer';

const EmailVerificationPrompt = ({ email }) => {
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const { resendVerification } = useAuth();

  const handleResendVerification = async () => {
    setLoading(true);
    const result = await resendVerification(email);
    setLoading(false);
    
    if (result.success) {
      setEmailSent(true);
      setTimeout(() => setEmailSent(false), 3000);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <div className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="mx-auto h-20 w-20 flex items-center justify-center">
              <img 
                src="/images/logo_oa_point.webp" 
                alt="OA Point Logo" 
                className="h-20 w-20 object-contain"
                style={{ mixBlendMode: 'multiply' }}
              />
            </div>
            <h1 className="mt-6 text-3xl font-extrabold text-gray-900">OA Point</h1>
            <p className="mt-2 text-sm text-gray-600">Online Assessment Platform</p>
          </div>
          
          <div className="bg-white py-8 px-6 shadow rounded-lg text-center">
            <Mail className="h-16 w-16 text-primary-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Check Your Email</h2>
            <p className="text-gray-600 mb-6">
              We've sent a verification email to <strong>{email}</strong>. 
              Please check your inbox and click the verification link to complete your registration.
            </p>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-yellow-800">
                <strong>Important:</strong> You must verify your email address before you can log in to your account.
              </p>
            </div>
            
            <div className="space-y-4">
              <p className="text-sm text-gray-500">
                Didn't receive the email? Check your spam folder or click below to resend.
              </p>
              
              <button
                onClick={handleResendVerification}
                disabled={loading || emailSent}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Sending...
                  </>
                ) : emailSent ? (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Email Sent!
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Resend Verification Email
                  </>
                )}
              </button>
              
              <div className="pt-4 border-t border-gray-200">
                <Link
                  to="/login"
                  className="text-primary-600 hover:text-primary-500 font-medium"
                >
                  Back to Login
                </Link>
              </div>
            </div>
          </div>
          
          <div className="text-center">
            <p className="text-xs text-gray-500">
              Need help? Contact us at{' '}
              <a href="mailto:onlineassessment.point@gmail.com" className="text-primary-600 hover:text-primary-800">
                onlineassessment.point@gmail.com
              </a>
            </p>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default EmailVerificationPrompt;