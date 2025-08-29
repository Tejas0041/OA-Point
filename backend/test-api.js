const axios = require('axios');

async function testAPI() {
  try {
    // First login to get a token
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'tejaspawar70238@gmail.com',
      password: 'password123' // Replace with actual password
    });
    
    console.log('Login successful');
    const token = loginResponse.data.token;
    
    // Test statistics endpoint
    const statsResponse = await axios.get('http://localhost:5000/api/student/statistics', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('Statistics response:', JSON.stringify(statsResponse.data, null, 2));
    
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

testAPI();