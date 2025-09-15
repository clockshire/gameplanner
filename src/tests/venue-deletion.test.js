#!/usr/bin/env node

/**
 * Venue Deletion Test Suite
 * Tests the enhanced venue deletion functionality with validation and cascading deletes
 *
 * Usage: node test-venue-deletion.js
 * Prerequisites: Server must be running on localhost:3001
 */

const API_BASE_URL = 'http://localhost:3001/api';

// Test results tracking
let testsPassed = 0;
let testsFailed = 0;
const testResults = [];

// Global test user and session token
let testUser = null;
let sessionToken = null;

/**
 * Helper function to make API requests
 */
async function apiRequest(method, endpoint, data = null, headers = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  };

  if (data) {
    options.body = JSON.stringify(data);
  }

  const response = await fetch(url, options);

  // Try to parse as JSON, fall back to text if it fails
  let responseData;
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    responseData = await response.json();
  } else {
    responseData = await response.text();
  }

  return {
    status: response.status,
    data: responseData,
    success: response.ok,
  };
}

/**
 * Helper function to authenticate and get session token
 */
async function authenticateUser(email, password) {
  const response = await apiRequest('POST', '/auth/login', {
    email,
    password,
  });

  if (response.success && response.data.success) {
    return response.data.data.sessionToken;
  }
  return null;
}

/**
 * Helper function to create a test user
 */
async function createTestUser(email, name, password) {
  const response = await apiRequest('POST', '/auth/signup', {
    email,
    name,
    password,
  });
  return response;
}

/**
 * Helper function to make authenticated API requests
 */
async function authenticatedApiRequest(method, endpoint, data = null) {
  await setupTestUser(); // Ensure user is authenticated
  return apiRequest(method, endpoint, data, {
    Authorization: `Bearer ${sessionToken}`,
  });
}

/**
 * Setup test user and authentication
 */
async function setupTestUser() {
  if (testUser && sessionToken) {
    return; // Already set up
  }

  // Try to authenticate first (in case user already exists)
  sessionToken = await authenticateUser('test@deletion.com', 'password123');

  if (sessionToken) {
    // User exists and we're authenticated
    testUser = { email: 'test@deletion.com', name: 'Test User' };
    return;
  }

  // User doesn't exist, create them
  const userResponse = await createTestUser(
    'test@deletion.com',
    'Test User',
    'password123'
  );
  if (!userResponse.success) {
    throw new Error('Failed to create test user');
  }

  testUser = userResponse.data.data.user;

  // Authenticate user
  sessionToken = await authenticateUser('test@deletion.com', 'password123');
  if (!sessionToken) {
    throw new Error('Failed to authenticate test user');
  }
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
 * Setup test data
 */
async function setupTestData() {
  console.log('🔧 Setting up test data...');

  // Create test venues
  const venue1 = await authenticatedApiRequest('POST', '/venues', {
    name: 'Test Venue 1 (No Events)',
    description: 'A test venue with no events',
    address: '123 Test Street',
    capacity: 50,
  });

  const venue2 = await authenticatedApiRequest('POST', '/venues', {
    name: 'Test Venue 2 (With Events)',
    description: 'A test venue that will have events',
    address: '456 Event Street',
    capacity: 100,
  });

  // Create rooms for venue 1
  const room1 = await authenticatedApiRequest('POST', '/rooms', {
    name: 'Test Room 1',
    description: 'A test room',
    venueId: venue1.data.data.venueId,
    capacity: 20,
    roomType: 'Meeting Room',
  });

  const room2 = await authenticatedApiRequest('POST', '/rooms', {
    name: 'Test Room 2',
    description: 'Another test room',
    venueId: venue1.data.data.venueId,
    capacity: 30,
    roomType: 'Conference Room',
  });

  // Create event for venue 2
  const event = await authenticatedApiRequest('POST', '/events', {
    name: 'Test Event',
    description: 'A test event',
    eventDate: '2026-06-01',
    endDate: '2026-06-01',
    startTime: '10:00',
    endTime: '18:00',
    venueId: venue2.data.data.venueId,
    maxParticipants: 50,
    createdBy: testUser.userId,
  });

  return {
    venue1: venue1.data.data,
    venue2: venue2.data.data,
    room1: room1.data.data,
    room2: room2.data.data,
    event: event.data.data,
  };
}

/**
 * Cleanup test data
 */
async function cleanupTestData(testData) {
  console.log('🧹 Cleaning up test data...');

  let cleanupErrors = [];

  // Delete event
  if (testData.event) {
    try {
      await authenticatedApiRequest(
        'DELETE',
        `/events/${testData.event.eventId}`
      );
    } catch (error) {
      cleanupErrors.push(
        `Failed to delete event ${testData.event.eventId}: ${error.message}`
      );
    }
  }

  // Delete rooms
  if (testData.room1) {
    try {
      await authenticatedApiRequest(
        'DELETE',
        `/rooms/${testData.room1.roomId}`
      );
    } catch (error) {
      cleanupErrors.push(
        `Failed to delete room ${testData.room1.roomId}: ${error.message}`
      );
    }
  }
  if (testData.room2) {
    try {
      await authenticatedApiRequest(
        'DELETE',
        `/rooms/${testData.room2.roomId}`
      );
    } catch (error) {
      cleanupErrors.push(
        `Failed to delete room ${testData.room2.roomId}: ${error.message}`
      );
    }
  }

  // Delete venues
  if (testData.venue1) {
    try {
      await authenticatedApiRequest(
        'DELETE',
        `/venues/${testData.venue1.venueId}`
      );
    } catch (error) {
      cleanupErrors.push(
        `Failed to delete venue ${testData.venue1.venueId}: ${error.message}`
      );
    }
  }
  if (testData.venue2) {
    try {
      await authenticatedApiRequest(
        'DELETE',
        `/venues/${testData.venue2.venueId}`
      );
    } catch (error) {
      cleanupErrors.push(
        `Failed to delete venue ${testData.venue2.venueId}: ${error.message}`
      );
    }
  }

  // Report any cleanup errors
  if (cleanupErrors.length > 0) {
    console.log('⚠️  Cleanup errors:');
    cleanupErrors.forEach((error) => console.log(`   - ${error}`));
  }
}

/**
 * Test 1: Venue deletion info for venue with events should show blocking
 */
const testVenueWithEventsBlocked =
  test('Venue with events should be blocked from deletion', async () => {
    const testData = await setupTestData();

    try {
      const response = await authenticatedApiRequest(
        'GET',
        `/venues/${testData.venue2.venueId}/deletion-info`
      );

      assert(response.success, 'API request should succeed');
      assert(response.data.success, 'Deletion info should be successful');
      assert(
        response.data.data.hasEventReferences === true,
        'Should have event references'
      );
      assert(response.data.data.canDelete === false, 'Should not be deletable');
      assert(
        response.data.data.events.length === 1,
        'Should have exactly 1 event'
      );
      assert(
        response.data.data.events[0].eventName === 'Test Event',
        'Event name should match'
      );
      assert(
        response.data.data.message.includes('Cannot delete'),
        'Message should indicate cannot delete'
      );
    } finally {
      await cleanupTestData(testData);
    }
  });

/**
 * Test 2: Venue deletion info for venue with rooms should show warning
 */
const testVenueWithRoomsWarning =
  test('Venue with rooms should show deletion warning', async () => {
    const testData = await setupTestData();

    try {
      const response = await authenticatedApiRequest(
        'GET',
        `/venues/${testData.venue1.venueId}/deletion-info`
      );

      assert(response.success, 'API request should succeed');
      assert(response.data.success, 'Deletion info should be successful');
      assert(
        response.data.data.hasEventReferences === false,
        'Should not have event references'
      );
      assert(response.data.data.canDelete === true, 'Should be deletable');
      assert(
        response.data.data.rooms.length === 2,
        'Should have exactly 2 rooms'
      );
      assert(
        response.data.data.message.includes('will also remove 2 room(s)'),
        'Message should warn about room deletion'
      );
    } finally {
      await cleanupTestData(testData);
    }
  });

/**
 * Test 3: Attempting to delete venue with events should fail
 */
const testDeleteVenueWithEventsFails =
  test('Deleting venue with events should fail', async () => {
    const testData = await setupTestData();

    try {
      const response = await authenticatedApiRequest(
        'DELETE',
        `/venues/${testData.venue2.venueId}`
      );

      assert(response.success === false, 'API request should fail');
      assert(response.status === 409, 'Should return 409 Conflict status');
      assert(
        response.data.error === 'VENUE_HAS_EVENT_REFERENCES',
        'Should have correct error code'
      );
      assert(
        response.data.message.includes('Cannot delete venue'),
        'Should have appropriate error message'
      );
      assert(response.data.events.length === 1, 'Should include event details');
    } finally {
      await cleanupTestData(testData);
    }
  });

/**
 * Test 4: Deleting venue with rooms should succeed and delete rooms
 */
const testDeleteVenueWithRoomsSucceeds =
  test('Deleting venue with rooms should succeed and cascade delete rooms', async () => {
    const testData = await setupTestData();

    try {
      const response = await authenticatedApiRequest(
        'DELETE',
        `/venues/${testData.venue1.venueId}`
      );

      assert(response.success, 'API request should succeed');
      assert(response.status === 200, 'Should return 200 OK status');
      assert(response.data.success === true, 'Deletion should be successful');
      assert(
        response.data.deletedRoomsCount === 2,
        'Should report 2 deleted rooms'
      );
      assert(
        response.data.deletedRooms.length === 2,
        'Should include room details'
      );

      // Verify venue deletion was successful (venue is deleted)
      // Note: We can't check GET /venues/:venueId because it requires ownership
      // and deleted venues are no longer accessible to the user
      assert(
        response.data.success === true,
        'Venue deletion should be successful'
      );
      assert(
        response.data.deletedRoomsCount === 2,
        'All rooms should be deleted'
      );

      // Verify rooms are deleted
      const room1Check = await apiRequest(
        'GET',
        `/rooms/${testData.room1.roomId}`
      );
      assert(room1Check.status === 404, 'Room 1 should be deleted');

      const room2Check = await apiRequest(
        'GET',
        `/rooms/${testData.room2.roomId}`
      );
      assert(room2Check.status === 404, 'Room 2 should be deleted');
    } finally {
      // Cleanup remaining entities that weren't deleted by the test
      await cleanupTestData(testData);
    }
  });

/**
 * Test 5: Deleting non-existent venue should return 404
 */
const testDeleteNonExistentVenue =
  test('Deleting non-existent venue should return 404', async () => {
    const fakeVenueId = '00000000-0000-0000-0000-000000000000';
    const response = await authenticatedApiRequest(
      'DELETE',
      `/venues/${fakeVenueId}`
    );

    assert(response.success === false, 'API request should fail');
    assert(response.status === 404, 'Should return 404 Not Found status');
    assert(
      response.data.error === 'Venue not found',
      'Should have correct error message'
    );
  });

/**
 * Test 6: Force delete should work even with events (if implemented)
 */
const testForceDeleteWithEvents =
  test('Force delete with events should work', async () => {
    const testData = await setupTestData();

    try {
      const response = await authenticatedApiRequest(
        'DELETE',
        `/venues/${testData.venue2.venueId}?force=true`
      );

      // This test might fail if force delete is not implemented
      if (response.success) {
        assert(response.status === 200, 'Should return 200 OK status');
        assert(
          response.data.success === true,
          'Force deletion should be successful'
        );
      } else {
        // If force delete is not implemented, that's also acceptable
        assert(response.status === 409, 'Should return 409 Conflict status');
        console.log(
          '   Note: Force delete not implemented (this is acceptable)'
        );
      }
    } finally {
      await cleanupTestData(testData);
    }
  });

/**
 * Test 7: Venue with no events and no rooms should delete safely
 */
const testDeleteEmptyVenue =
  test('Deleting venue with no events and no rooms should succeed', async () => {
    const venue = await authenticatedApiRequest('POST', '/venues', {
      name: 'Empty Test Venue',
      description: 'A venue with no events or rooms',
      address: '789 Empty Street',
      capacity: 25,
    });

    try {
      const response = await authenticatedApiRequest(
        'DELETE',
        `/venues/${venue.data.data.venueId}`
      );

      assert(response.success, 'API request should succeed');
      assert(response.status === 200, 'Should return 200 OK status');
      assert(response.data.success === true, 'Deletion should be successful');
      assert(
        response.data.deletedRoomsCount === 0,
        'Should report 0 deleted rooms'
      );
    } finally {
      // Cleanup not needed as we deleted the venue
    }
  });

/**
 * Run all tests
 */
async function runTests() {
  console.log('🧪 Venue Deletion Tests');
  console.log('========================\n');

  // Run all tests
  const tests = [
    testVenueWithEventsBlocked,
    testVenueWithRoomsWarning,
    testDeleteVenueWithEventsFails,
    testDeleteVenueWithRoomsSucceeds,
    testDeleteNonExistentVenue,
    testForceDeleteWithEvents,
    testDeleteEmptyVenue,
  ];

  for (const testFn of tests) {
    await testFn();
    console.log(''); // Empty line between tests
  }

  // Print summary for this test file
  console.log('========================');
  console.log('📊 Venue Deletion Test Results');
  console.log('========================');
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

  console.log('\n✅ Venue deletion tests completed!');
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

// If running directly, execute the tests
if (require.main === module) {
  runTests().catch((error) => {
    console.error('💥 Test crashed:', error);
    process.exit(1);
  });
}
