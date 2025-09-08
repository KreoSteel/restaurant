// Simple test script to verify profile API endpoints
// Run with: node test-profile-api.js

const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

// Test data
const testProfile = {
  full_name: 'Test User',
  age: 25,
  email: 'test@example.com',
  is_featured: false,
  role_id: 1,
  location_id: 1
};

async function testProfileAPI() {
  console.log('🧪 Testing Profile API...\n');

  try {
    // Test 1: Get profile without token (should fail)
    console.log('1. Testing GET /profile without token...');
    try {
      await axios.get(`${BASE_URL}/profile`);
      console.log('❌ Should have failed without token');
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Correctly rejected request without token');
      } else {
        console.log('❌ Unexpected error:', error.response?.data);
      }
    }

    // Test 2: Update profile without token (should fail)
    console.log('\n2. Testing PATCH /profile without token...');
    try {
      await axios.patch(`${BASE_URL}/profile`, testProfile);
      console.log('❌ Should have failed without token');
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Correctly rejected request without token');
      } else {
        console.log('❌ Unexpected error:', error.response?.data);
      }
    }

    // Test 3: Test with invalid token (should fail)
    console.log('\n3. Testing with invalid token...');
    try {
      await axios.patch(`${BASE_URL}/profile`, testProfile, {
        headers: { Authorization: 'Bearer invalid-token' }
      });
      console.log('❌ Should have failed with invalid token');
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Correctly rejected invalid token');
      } else {
        console.log('❌ Unexpected error:', error.response?.data);
      }
    }

    console.log('\n✅ All tests completed!');
    console.log('\n📝 Note: To test with valid tokens, you need to:');
    console.log('   1. Start the frontend application');
    console.log('   2. Register/login a user');
    console.log('   3. Check the browser\'s localStorage for the token');
    console.log('   4. Use that token in the Authorization header');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Check if server is running
async function checkServer() {
  try {
    await axios.get(`${BASE_URL}/restaurants`);
    console.log('✅ Backend server is running');
    return true;
  } catch (error) {
    console.log('❌ Backend server is not running on port 3000');
    console.log('   Please start the backend server first: npm run dev');
    return false;
  }
}

async function main() {
  const serverRunning = await checkServer();
  if (serverRunning) {
    await testProfileAPI();
  }
}

main();
