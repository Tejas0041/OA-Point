import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  HelpCircle, 
  BookOpen, 
  Monitor, 
  Camera, 
  Clock, 
  AlertTriangle,
  Mail,
  Phone,
  MessageCircle
} from 'lucide-react';

const StudentHelp = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header with Back Button */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/student/dashboard')}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>Back to Dashboard</span>
            </button>
          </div>
          <div className="flex items-center space-x-3">
            <img 
              src="/images/logo_oa_point.webp" 
              alt="OA Point Logo" 
              className="h-8 w-8 object-contain"
              style={{ mixBlendMode: 'multiply' }}
            />
            <h1 className="text-2xl font-bold text-gray-900">
              <span className="text-primary-600">OA Point</span> Help & Support
            </h1>
          </div>
        </div>

        {/* Quick Help Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6 text-center">
            <BookOpen className="h-12 w-12 text-blue-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Taking Tests</h3>
            <p className="text-gray-600 text-sm">Learn how to navigate and complete your assessments</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6 text-center">
            <Monitor className="h-12 w-12 text-green-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Technical Setup</h3>
            <p className="text-gray-600 text-sm">System requirements and troubleshooting</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6 text-center">
            <HelpCircle className="h-12 w-12 text-purple-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">FAQ</h3>
            <p className="text-gray-600 text-sm">Common questions and answers</p>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
            <HelpCircle className="h-6 w-6 mr-2" />
            Frequently Asked Questions
          </h2>

          <div className="space-y-6">
            <div className="border-b border-gray-200 pb-4">
              <h3 className="text-lg font-medium text-gray-900 mb-2">How do I start a test?</h3>
              <p className="text-gray-600">
                1. Log in to your student dashboard<br/>
                2. Find your assigned test in the "Available Assessments" section<br/>
                3. Click "Start Test" when you're ready<br/>
                4. Follow the on-screen instructions and enable camera/full-screen if required
              </p>
            </div>

            <div className="border-b border-gray-200 pb-4">
              <h3 className="text-lg font-medium text-gray-900 mb-2">What if I don't see any tests?</h3>
              <p className="text-gray-600">
                • Check your email for test invitations<br/>
                • Ensure you're using the correct login credentials<br/>
                • Contact your administrator if you expect to see tests<br/>
                • Try refreshing the page or logging out and back in
              </p>
            </div>

            <div className="border-b border-gray-200 pb-4">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Can I pause a test once started?</h3>
              <p className="text-gray-600">
                No, tests cannot be paused once started. The timer continues running until the test is submitted or time expires. Make sure you have enough uninterrupted time before starting.
              </p>
            </div>

            <div className="border-b border-gray-200 pb-4">
              <h3 className="text-lg font-medium text-gray-900 mb-2">What happens if my internet disconnects?</h3>
              <p className="text-gray-600">
                Your progress is automatically saved. When you reconnect, you can continue from where you left off. However, the timer continues running, so reconnect as quickly as possible.
              </p>
            </div>

            <div className="border-b border-gray-200 pb-4">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Why is my camera required?</h3>
              <p className="text-gray-600">
                Camera monitoring is used for proctoring to ensure test integrity. The camera feed helps prevent cheating and maintains fairness for all students.
              </p>
            </div>
          </div>
        </div>

        {/* System Requirements */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
            <Monitor className="h-6 w-6 mr-2" />
            System Requirements
          </h2>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">Recommended Setup</h3>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                  Desktop or laptop computer
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                  Stable internet connection (minimum 1 Mbps)
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                  Working webcam and microphone
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                  Updated web browser (Chrome, Firefox, Safari, Edge)
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                  Quiet, well-lit environment
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">Before Starting</h3>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-center">
                  <Clock className="w-4 h-4 mr-3 text-blue-500" />
                  Close all unnecessary applications
                </li>
                <li className="flex items-center">
                  <Camera className="w-4 h-4 mr-3 text-blue-500" />
                  Test your camera and microphone
                </li>
                <li className="flex items-center">
                  <AlertTriangle className="w-4 h-4 mr-3 text-blue-500" />
                  Disable browser extensions
                </li>
                <li className="flex items-center">
                  <Monitor className="w-4 h-4 mr-3 text-blue-500" />
                  Ensure full-screen mode works
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Test Taking Guidelines */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Test Taking Guidelines</h2>

          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <div className="w-2 h-2 bg-green-600 rounded-full"></div>
              </div>
              <div>
                <h4 className="font-medium text-gray-900">During the Test</h4>
                <p className="text-gray-600 text-sm">Stay in full-screen mode, keep your camera on, and avoid switching tabs or applications.</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <div className="w-2 h-2 bg-yellow-600 rounded-full"></div>
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Prohibited Actions</h4>
                <p className="text-gray-600 text-sm">No copy-paste, right-clicking, opening new tabs, or using external resources unless explicitly allowed.</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <div className="w-2 h-2 bg-red-600 rounded-full"></div>
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Violations</h4>
                <p className="text-gray-600 text-sm">Suspicious activities are automatically detected and logged. Multiple violations may result in test termination.</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Submission</h4>
                <p className="text-gray-600 text-sm">Submit your test before time expires. Auto-submission occurs when time runs out.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Support */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Need More Help?</h2>
          
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Mail className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="font-medium text-gray-900 mb-2">Email Support</h3>
              <p className="text-gray-600 text-sm mb-3">Get help via email - we respond within 24 hours</p>
              <a href="mailto:onlineassessment.point@gmail.com" className="text-blue-600 hover:text-blue-800 text-sm">
                onlineassessment.point@gmail.com
              </a>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <HelpCircle className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="font-medium text-gray-900 mb-2">Technical Issues</h3>
              <p className="text-gray-600 text-sm mb-3">Having trouble with tests or login?</p>
              <a href="mailto:onlineassessment.point@gmail.com?subject=Technical Support" className="text-green-600 hover:text-green-800 text-sm">
                Contact Technical Support
              </a>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <BookOpen className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="font-medium text-gray-900 mb-2">Account Questions</h3>
              <p className="text-gray-600 text-sm mb-3">Questions about your account or tests?</p>
              <a href="mailto:onlineassessment.point@gmail.com?subject=Account Support" className="text-purple-600 hover:text-purple-800 text-sm">
                Contact Account Support
              </a>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 text-center">
          <Link
            to="/student/dashboard"
            className="inline-flex items-center space-x-2 bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Back to Dashboard</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default StudentHelp;