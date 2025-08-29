// Debug utility to decode JWT token
export const decodeToken = (token) => {
  try {
    if (!token) return null;
    
    const parts = token.split('.');
    if (parts.length !== 3) {
      console.error('Invalid token format');
      return null;
    }
    
    const payload = JSON.parse(atob(parts[1]));
    const header = JSON.parse(atob(parts[0]));
    
    return {
      header,
      payload,
      isExpired: payload.exp < (Date.now() / 1000),
      expiresAt: new Date(payload.exp * 1000),
      issuedAt: new Date(payload.iat * 1000)
    };
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
};

// Test the provided token
const testToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OGFiNjczNmYxYTYwOGVkYTYzYzc3MTUiLCJpYXQiOjE3NTY0NjM2MzksImV4cCI6MTc1NjU1MDAzOX0.U-j0jqIjph_9E7yCoutj6tuFRuUYadR27_T9iHWL0YA';

console.log('Token analysis:', decodeToken(testToken));