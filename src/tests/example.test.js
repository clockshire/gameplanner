#!/usr/bin/env node

/**
 * Example Test File
 * Demonstrates the test structure and can be used as a template
 *
 * This file shows how to create tests that work with the test runner
 */

// Test results tracking
let testsPassed = 0;
let testsFailed = 0;
const testResults = [];

/**
 * Helper function to make API requests
 */
async function apiRequest(method, endpoint, data = null) {
  const API_BASE_URL = 'http://localhost:3001/api';
  const url = `${API_BASE_URL}${endpoint}`;
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  if (data) {
    options.body = JSON.stringify(data);
  }

  const response = await fetch(url, options);
  const result = await response.json();

  return {
    status: response.status,
    data: result,
    success: response.ok,
  };
}

/**
 * Test helper function
 */
function test(name, testFn) {
  return async () => {
    try {
      console.log(`🧪 Testing: ${name}`);
      await testFn();
      console.log(`✅ PASS: ${name}`);
      testsPassed++;
      testResults.push({ name, status: 'PASS' });
    } catch (error) {
      console.log(`❌ FAIL: ${name}`);
      console.log(`   Error: ${error.message}`);
      testsFailed++;
      testResults.push({ name, status: 'FAIL', error: error.message });
    }
  };
}

/**
 * Assertion helper
 */
function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

/**
 * Example tests
 */
const testServerHealth = test('Server health check should work', async () => {
  const response = await apiRequest('GET', '/health');
  assert(response.success, 'Health check should succeed');
  assert(response.status === 200, 'Should return 200 status');
  assert(
    response.data.success === true,
    'Health response should indicate success'
  );
});

const testApiEndpointsExist =
  test('API endpoints should be accessible', async () => {
    // Test venues endpoint
    const venuesResponse = await apiRequest('GET', '/venues');
    assert(venuesResponse.success, 'Venues endpoint should be accessible');
    assert(
      venuesResponse.data.success === true,
      'Venues response should indicate success'
    );

    // Test events endpoint
    const eventsResponse = await apiRequest('GET', '/events');
    assert(eventsResponse.success, 'Events endpoint should be accessible');
    assert(
      eventsResponse.data.success === true,
      'Events response should indicate success'
    );

    // Test rooms endpoint
    const roomsResponse = await apiRequest('GET', '/rooms');
    assert(roomsResponse.success, 'Rooms endpoint should be accessible');
    assert(
      roomsResponse.data.success === true,
      'Rooms response should indicate success'
    );
  });

const testInvalidEndpoint =
  test('Invalid endpoint should return 404', async () => {
    const response = await apiRequest('GET', '/invalid-endpoint');
    assert(!response.success, 'Invalid endpoint should fail');
    assert(response.status === 404, 'Should return 404 status');
  });

/**
 * Run all tests
 */
async function runTests() {
  console.log('🧪 Example Tests');
  console.log('================\n');

  // Run all tests
  const tests = [testServerHealth, testApiEndpointsExist, testInvalidEndpoint];

  for (const testFn of tests) {
    await testFn();
    console.log(''); // Empty line between tests
  }

  // Print summary for this test file
  console.log('================');
  console.log('📊 Example Test Results');
  console.log('================');
  console.log(`✅ Tests Passed: ${testsPassed}`);
  console.log(`❌ Tests Failed: ${testsFailed}`);
  console.log(
    `📈 Success Rate: ${Math.round(
      (testsPassed / (testsPassed + testsFailed)) * 100
    )}%`
  );

  if (testsFailed > 0) {
    console.log('\n❌ Failed Tests:');
    testResults
      .filter((result) => result.status === 'FAIL')
      .forEach((result) => {
        console.log(`   - ${result.name}: ${result.error}`);
      });
  }

  console.log('\n✅ Example tests completed!');
}

// Export the runTests function and test counts for the test runner
module.exports = {
  runTests,
  get testsPassed() {
    return testsPassed;
  },
  get testsFailed() {
    return testsFailed;
  },
};
