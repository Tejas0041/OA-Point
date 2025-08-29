// API Configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000'

export const API_ENDPOINTS = {
  // Auth endpoints
  LOGIN: `${API_BASE_URL}/api/auth/login`,
  REGISTER: `${API_BASE_URL}/api/auth/register`,
  ME: `${API_BASE_URL}/api/auth/me`,
  PROFILE: `${API_BASE_URL}/api/auth/profile`,
  VERIFY_EMAIL: `${API_BASE_URL}/api/auth/verify-email`,
  RESEND_VERIFICATION: `${API_BASE_URL}/api/auth/resend-verification`,
  FORGOT_PASSWORD: `${API_BASE_URL}/api/auth/forgot-password`,
  RESET_PASSWORD: `${API_BASE_URL}/api/auth/reset-password`,

  // Admin endpoints
  ADMIN_TESTS: `${API_BASE_URL}/api/admin/tests`,
  ADMIN_STUDENTS: `${API_BASE_URL}/api/admin/students`,
  ADMIN_UPLOAD_IMAGE: `${API_BASE_URL}/api/admin/upload-image`,
  ADMIN_TEST_BY_ID: id => `${API_BASE_URL}/api/admin/tests/${id}`,
  ADMIN_TEST_TOGGLE_STATUS: id =>
    `${API_BASE_URL}/api/admin/tests/${id}/toggle-status`,
  ADMIN_TEST_DELETE: id => `${API_BASE_URL}/api/admin/tests/${id}`,
  ADMIN_ADD_STUDENTS: id =>
    `${API_BASE_URL}/api/admin/tests/${id}/add-students`,
  ADMIN_TEST_SEND_INVITATIONS: id =>
    `${API_BASE_URL}/api/admin/tests/${id}/send-invitations`,
  ADMIN_TEST_RESULTS: id => `${API_BASE_URL}/api/admin/tests/${id}/results`,
  ADMIN_TEST_SEND_RESULTS: id =>
    `${API_BASE_URL}/api/admin/tests/${id}/send-results`,
  ADMIN_SEND_CUSTOM_EMAIL: `${API_BASE_URL}/api/admin/send-custom-email`,

  // Student endpoints
  STUDENT_TESTS: `${API_BASE_URL}/api/student/tests`, // Make sure this matches the backend route
  STUDENT_TEST_BY_ID: id => `${API_BASE_URL}/api/student/tests/${id}`,
  STUDENT_TEST_START: id => `${API_BASE_URL}/api/student/tests/${id}/start`,
  STUDENT_TEST_SUBMIT_ANSWER: id =>
    `${API_BASE_URL}/api/student/tests/${id}/submit-answer`,
  STUDENT_TEST_COMPLETE_SECTION: id =>
    `${API_BASE_URL}/api/student/tests/${id}/complete-section`,
  STUDENT_TEST_SUBMIT: id => `${API_BASE_URL}/api/student/tests/${id}/submit`,
  STUDENT_TEST_ATTEMPT: id => `${API_BASE_URL}/api/student/tests/${id}/attempt`,
  STUDENT_TEST_HISTORY: `${API_BASE_URL}/api/student/test-history`,
  STUDENT_TEST_REPORT_VIOLATION: id =>
    `${API_BASE_URL}/api/student/tests/${id}/report-violation`,
  STUDENT_TEST_RESULTS: id => `${API_BASE_URL}/api/student/tests/${id}/results`,
  STUDENT_STATISTICS: `${API_BASE_URL}/api/student/statistics`,

  // Test endpoints
  TEST_INFO: id => `${API_BASE_URL}/api/test/${id}/info`,
  TEST_VALIDATE_ACCESS: id => `${API_BASE_URL}/api/test/${id}/validate-access`,
  TEST_STATISTICS: id => `${API_BASE_URL}/api/test/${id}/statistics`,

  // Compiler endpoints
  COMPILER_RUN: `${API_BASE_URL}/api/compiler/run`,
  COMPILER_SUBMIT: `${API_BASE_URL}/api/compiler/submit`,
  COMPILER_LANGUAGES: `${API_BASE_URL}/api/compiler/languages`
}

export default API_BASE_URL
