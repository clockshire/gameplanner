#!/usr/bin/env node

/**
 * Creation Tests
 * Tests the creation functionality for venues, rooms, and events
 *
 * This file tests the core CRUD operations for the main entities
 */

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
  const API_BASE_URL = 'http://localhost:3001/api';
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
 * Helper function to make authenticated API requests
 */
async function authenticatedApiRequest(method, endpoint, data = null) {
  await setupTestUser(); // Ensure user is authenticated
  return apiRequest(method, endpoint, data, {
    Authorization: `Bearer ${sessionToken}`,
  });
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
 * Setup test user and authentication
 */
async function setupTestUser() {
  if (testUser && sessionToken) {
    return; // Already set up
  }

  // Try to authenticate first (in case user already exists)
  sessionToken = await authenticateUser('test@creation.com', 'password123');

  if (sessionToken) {
    // User exists and we're authenticated
    testUser = { email: 'test@creation.com', name: 'Test User' };
    return;
  }

  // User doesn't exist, create them
  const userResponse = await createTestUser(
    'test@creation.com',
    'Test User',
    'password123'
  );
  if (!userResponse.success) {
    throw new Error('Failed to create test user');
  }

  testUser = userResponse.data.data.user;

  // Authenticate user
  sessionToken = await authenticateUser('test@creation.com', 'password123');
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
      await setupTestUser(); // Ensure user is authenticated
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
 * Test data cleanup
 */
let createdEntities = {
  venues: [],
  rooms: [],
  events: [],
};

async function cleanupCreatedEntities() {
  console.log('🧹 Cleaning up created entities...');

  let cleanupErrors = [];

  // Delete events first (they reference venues)
  for (const eventId of createdEntities.events) {
    try {
      await authenticatedApiRequest('DELETE', `/events/${eventId}`);
    } catch (error) {
      cleanupErrors.push(`Failed to delete event ${eventId}: ${error.message}`);
    }
  }

  // Delete rooms (they reference venues)
  for (const roomId of createdEntities.rooms) {
    try {
      await authenticatedApiRequest('DELETE', `/rooms/${roomId}`);
    } catch (error) {
      cleanupErrors.push(`Failed to delete room ${roomId}: ${error.message}`);
    }
  }

  // Delete venues last
  for (const venueId of createdEntities.venues) {
    try {
      await authenticatedApiRequest('DELETE', `/venues/${venueId}`);
    } catch (error) {
      cleanupErrors.push(`Failed to delete venue ${venueId}: ${error.message}`);
    }
  }

  // Report any cleanup errors
  if (cleanupErrors.length > 0) {
    console.log('⚠️  Cleanup errors:');
    cleanupErrors.forEach((error) => console.log(`   - ${error}`));
  }

  // Reset tracking
  createdEntities = { venues: [], rooms: [], events: [] };
}

/**
 * Venue Creation Tests
 */
const testCreateVenueWithValidData =
  test('Create venue with valid data should succeed', async () => {
    const venueData = {
      name: 'Test Venue Creation',
      description: 'A test venue for creation testing',
      address: '123 Creation Street',
      capacity: 50,
      contactEmail: 'test@example.com',
      contactPhone: '+44 1234 567890',
      websiteURL: 'https://testvenue.com',
      mapLink: 'https://maps.google.com/testvenue',
    };

    const response = await authenticatedApiRequest(
      'POST',
      '/venues',
      venueData
    );

    assert(response.success, 'Venue creation should succeed');
    assert(response.status === 201, 'Should return 201 Created status');
    assert(response.data.success === true, 'Response should indicate success');
    assert(
      response.data.data.venueName === venueData.name,
      'Venue name should match'
    );
    assert(
      response.data.data.description === venueData.description,
      'Description should match'
    );
    assert(
      response.data.data.address === venueData.address,
      'Address should match'
    );
    assert(
      response.data.data.capacity === venueData.capacity,
      'Capacity should match'
    );
    assert(
      response.data.data.contactEmail === venueData.contactEmail,
      'Contact email should match'
    );
    assert(
      response.data.data.contactPhone === venueData.contactPhone,
      'Contact phone should match'
    );
    assert(
      response.data.data.websiteURL === venueData.websiteURL,
      'Website URL should match'
    );
    assert(
      response.data.data.mapLink === venueData.mapLink,
      'Map link should match'
    );
    assert(response.data.data.venueId, 'Should have a venue ID');
    assert(response.data.data.createdAt, 'Should have creation timestamp');
    assert(response.data.data.updatedAt, 'Should have update timestamp');

    // Track for cleanup
    createdEntities.venues.push(response.data.data.venueId);
  });

const testCreateVenueWithMinimalData =
  test('Create venue with minimal required data should succeed', async () => {
    const venueData = {
      name: 'Minimal Venue',
      address: '456 Minimal Street',
      capacity: 25,
    };

    const response = await authenticatedApiRequest(
      'POST',
      '/venues',
      venueData
    );

    assert(response.success, 'Minimal venue creation should succeed');
    assert(response.status === 201, 'Should return 201 Created status');
    assert(response.data.success === true, 'Response should indicate success');
    assert(
      response.data.data.venueName === venueData.name,
      'Venue name should match'
    );
    assert(
      response.data.data.address === venueData.address,
      'Address should match'
    );
    assert(
      response.data.data.capacity === venueData.capacity,
      'Capacity should match'
    );
    assert(
      response.data.data.description === '',
      'Description should be empty string'
    );
    assert(
      response.data.data.contactEmail === null,
      'Contact email should be null'
    );
    assert(
      response.data.data.contactPhone === null,
      'Contact phone should be null'
    );
    assert(
      response.data.data.websiteURL === null,
      'Website URL should be null'
    );
    assert(response.data.data.mapLink === null, 'Map link should be null');

    // Track for cleanup
    createdEntities.venues.push(response.data.data.venueId);
  });

const testCreateVenueWithMissingName =
  test('Create venue without name should fail', async () => {
    const venueData = {
      address: '789 No Name Street',
      capacity: 30,
    };

    const response = await authenticatedApiRequest(
      'POST',
      '/venues',
      venueData
    );

    assert(!response.success, 'Venue creation without name should fail');
    assert(response.status === 400, 'Should return 400 Bad Request status');
    assert(response.data.success === false, 'Response should indicate failure');
    assert(
      response.data.error === 'Venue name is required',
      'Should have correct error message'
    );
  });

const testCreateVenueWithMissingAddress =
  test('Create venue without address should fail', async () => {
    const venueData = {
      name: 'No Address Venue',
      capacity: 30,
    };

    const response = await authenticatedApiRequest(
      'POST',
      '/venues',
      venueData
    );

    assert(!response.success, 'Venue creation without address should fail');
    assert(response.status === 400, 'Should return 400 Bad Request status');
    assert(response.data.success === false, 'Response should indicate failure');
    assert(
      response.data.error === 'Venue address is required',
      'Should have correct error message'
    );
  });

/**
 * Room Creation Tests
 */
const testCreateRoomWithValidData =
  test('Create room with valid data should succeed', async () => {
    // First create a venue to associate the room with
    const venueData = {
      name: 'Room Test Venue',
      address: '789 Room Street',
      capacity: 100,
    };

    const venueResponse = await authenticatedApiRequest(
      'POST',
      '/venues',
      venueData
    );
    assert(
      venueResponse.success,
      'Venue creation should succeed for room test'
    );
    const venueId = venueResponse.data.data.venueId;
    createdEntities.venues.push(venueId);

    const roomData = {
      name: 'Test Room Creation',
      description: 'A test room for creation testing',
      venueId: venueId,
      capacity: 20,
      roomType: 'Conference Room',
      amenities: ['Projector', 'Whiteboard', 'WiFi', 'Air Conditioning'],
    };

    const response = await authenticatedApiRequest('POST', '/rooms', roomData);

    assert(response.success, 'Room creation should succeed');
    assert(response.status === 201, 'Should return 201 Created status');
    assert(response.data.success === true, 'Response should indicate success');
    assert(
      response.data.data.roomName === roomData.name,
      'Room name should match'
    );
    assert(
      response.data.data.description === roomData.description,
      'Description should match'
    );
    assert(
      response.data.data.venueId === roomData.venueId,
      'Venue ID should match'
    );
    assert(
      response.data.data.capacity === roomData.capacity,
      'Capacity should match'
    );
    assert(
      response.data.data.roomType === roomData.roomType,
      'Room type should match'
    );
    assert(
      JSON.stringify(response.data.data.amenities) ===
        JSON.stringify(roomData.amenities),
      'Amenities should match'
    );
    assert(response.data.data.roomId, 'Should have a room ID');
    assert(response.data.data.createdAt, 'Should have creation timestamp');
    assert(response.data.data.updatedAt, 'Should have update timestamp');

    // Track for cleanup
    createdEntities.rooms.push(response.data.data.roomId);
  });

const testCreateRoomWithMinimalData =
  test('Create room with minimal required data should succeed', async () => {
    // Use existing venue or create one
    let venueId = createdEntities.venues[0];
    if (!venueId) {
      const venueData = {
        name: 'Minimal Room Venue',
        address: '456 Minimal Room Street',
        capacity: 50,
      };
      const venueResponse = await authenticatedApiRequest(
        'POST',
        '/venues',
        venueData
      );
      venueId = venueResponse.data.data.venueId;
      createdEntities.venues.push(venueId);
    }

    const roomData = {
      name: 'Minimal Room',
      venueId: venueId,
      capacity: 10,
    };

    const response = await authenticatedApiRequest('POST', '/rooms', roomData);

    assert(response.success, 'Minimal room creation should succeed');
    assert(response.status === 201, 'Should return 201 Created status');
    assert(response.data.success === true, 'Response should indicate success');
    assert(
      response.data.data.roomName === roomData.name,
      'Room name should match'
    );
    assert(
      response.data.data.venueId === roomData.venueId,
      'Venue ID should match'
    );
    assert(
      response.data.data.capacity === roomData.capacity,
      'Capacity should match'
    );
    assert(
      response.data.data.description === '',
      'Description should be empty string'
    );
    assert(
      response.data.data.roomType === 'general',
      'Room type should default to general'
    );
    assert(
      JSON.stringify(response.data.data.amenities) === '{}',
      'Amenities should be empty object'
    );

    // Track for cleanup
    createdEntities.rooms.push(response.data.data.roomId);
  });

const testCreateRoomWithMissingName =
  test('Create room without name should fail', async () => {
    // Use existing venue or create one
    let venueId = createdEntities.venues[0];
    if (!venueId) {
      const venueData = {
        name: 'Error Test Venue',
        address: '789 Error Street',
        capacity: 50,
      };
      const venueResponse = await authenticatedApiRequest(
        'POST',
        '/venues',
        venueData
      );
      venueId = venueResponse.data.data.venueId;
      createdEntities.venues.push(venueId);
    }

    const roomData = {
      venueId: venueId,
      capacity: 15,
    };

    const response = await authenticatedApiRequest('POST', '/rooms', roomData);

    assert(!response.success, 'Room creation without name should fail');
    assert(response.status === 400, 'Should return 400 Bad Request status');
    assert(response.data.success === false, 'Response should indicate failure');
    assert(
      response.data.error === 'Room name is required',
      'Should have correct error message'
    );
  });

const testCreateRoomWithMissingVenueId =
  test('Create room without venue ID should fail', async () => {
    const roomData = {
      name: 'No Venue Room',
      capacity: 15,
    };

    const response = await authenticatedApiRequest('POST', '/rooms', roomData);

    assert(!response.success, 'Room creation without venue ID should fail');
    assert(response.status === 400, 'Should return 400 Bad Request status');
    assert(response.data.success === false, 'Response should indicate failure');
    assert(
      response.data.error === 'Venue ID is required',
      'Should have correct error message'
    );
  });

/**
 * Event Creation Tests
 */
const testCreateEventWithValidData =
  test('Create event with valid data should succeed', async () => {
    // First create a venue to associate the event with
    let venueId = createdEntities.venues[0];
    if (!venueId) {
      const venueData = {
        name: 'Event Test Venue',
        address: '123 Event Street',
        capacity: 100,
      };
      const venueResponse = await authenticatedApiRequest(
        'POST',
        '/venues',
        venueData
      );
      venueId = venueResponse.data.data.venueId;
      createdEntities.venues.push(venueId);
    }

    const eventData = {
      name: 'Test Event Creation',
      description: 'A test event for creation testing',
      eventDate: '2026-07-15',
      endDate: '2026-07-15',
      startTime: '10:00',
      endTime: '18:00',
      venueId: venueId,
      maxParticipants: 50,
      createdBy: 'a6f3aec2-7d19-48d5-85a4-7602da37e79f', // Chisel's user ID
    };

    const response = await authenticatedApiRequest(
      'POST',
      '/events',
      eventData
    );

    assert(response.success, 'Event creation should succeed');
    assert(response.status === 201, 'Should return 201 Created status');
    assert(response.data.success === true, 'Response should indicate success');
    assert(
      response.data.data.eventName === eventData.name,
      'Event name should match'
    );
    assert(
      response.data.data.description === eventData.description,
      'Description should match'
    );
    assert(
      response.data.data.eventDate === eventData.eventDate,
      'Event date should match'
    );
    assert(
      response.data.data.endDate === eventData.endDate,
      'End date should match'
    );
    assert(
      response.data.data.startTime === eventData.startTime,
      'Start time should match'
    );
    assert(
      response.data.data.endTime === eventData.endTime,
      'End time should match'
    );
    assert(
      response.data.data.venueId === eventData.venueId,
      'Venue ID should match'
    );
    assert(
      response.data.data.maxParticipants === eventData.maxParticipants,
      'Max participants should match'
    );
    assert(
      response.data.data.createdBy === eventData.createdBy,
      'Created by should match'
    );
    assert(response.data.data.eventId, 'Should have an event ID');
    assert(response.data.data.status === 'active', 'Should have active status');
    assert(
      response.data.data.currentParticipants === 0,
      'Should start with 0 participants'
    );
    assert(response.data.data.createdAt, 'Should have creation timestamp');
    assert(response.data.data.updatedAt, 'Should have update timestamp');

    // Track for cleanup
    createdEntities.events.push(response.data.data.eventId);
  });

const testCreateEventWithMinimalData =
  test('Create event with minimal required data should succeed', async () => {
    // Use existing venue or create one
    let venueId = createdEntities.venues[0];
    if (!venueId) {
      const venueData = {
        name: 'Minimal Event Venue',
        address: '456 Minimal Event Street',
        capacity: 50,
      };
      const venueResponse = await authenticatedApiRequest(
        'POST',
        '/venues',
        venueData
      );
      venueId = venueResponse.data.data.venueId;
      createdEntities.venues.push(venueId);
    }

    const eventData = {
      name: 'Minimal Event',
      eventDate: '2026-08-01',
      endDate: '2026-08-01',
      startTime: '14:00',
      endTime: '16:00',
      venueId: venueId,
      maxParticipants: 25,
      createdBy: 'a6f3aec2-7d19-48d5-85a4-7602da37e79f',
    };

    const response = await authenticatedApiRequest(
      'POST',
      '/events',
      eventData
    );

    assert(response.success, 'Minimal event creation should succeed');
    assert(response.status === 201, 'Should return 201 Created status');
    assert(response.data.success === true, 'Response should indicate success');
    assert(
      response.data.data.eventName === eventData.name,
      'Event name should match'
    );
    assert(
      response.data.data.eventDate === eventData.eventDate,
      'Event date should match'
    );
    assert(
      response.data.data.venueId === eventData.venueId,
      'Venue ID should match'
    );
    assert(
      response.data.data.maxParticipants === eventData.maxParticipants,
      'Max participants should match'
    );
    assert(
      response.data.data.description === '',
      'Description should be empty string'
    );

    // Track for cleanup
    createdEntities.events.push(response.data.data.eventId);
  });

const testCreateEventWithMissingName =
  test('Create event without name should fail', async () => {
    // Use existing venue or create one
    let venueId = createdEntities.venues[0];
    if (!venueId) {
      const venueData = {
        name: 'Error Event Venue',
        address: '789 Error Event Street',
        capacity: 50,
      };
      const venueResponse = await authenticatedApiRequest(
        'POST',
        '/venues',
        venueData
      );
      venueId = venueResponse.data.data.venueId;
      createdEntities.venues.push(venueId);
    }

    const eventData = {
      eventDate: '2026-09-01',
      endDate: '2026-09-01',
      startTime: '10:00',
      endTime: '12:00',
      venueId: venueId,
      maxParticipants: 30,
      createdBy: 'a6f3aec2-7d19-48d5-85a4-7602da37e79f',
    };

    const response = await authenticatedApiRequest(
      'POST',
      '/events',
      eventData
    );

    assert(!response.success, 'Event creation without name should fail');
    assert(response.status === 400, 'Should return 400 Bad Request status');
    assert(response.data.success === false, 'Response should indicate failure');
    assert(
      response.data.error === 'Event name is required',
      'Should have correct error message'
    );
  });

const testCreateEventWithMissingVenueId =
  test('Create event without venue ID should fail', async () => {
    const eventData = {
      name: 'No Venue Event',
      eventDate: '2026-10-01',
      endDate: '2026-10-01',
      startTime: '10:00',
      endTime: '12:00',
      maxParticipants: 30,
      createdBy: 'a6f3aec2-7d19-48d5-85a4-7602da37e79f',
    };

    const response = await authenticatedApiRequest(
      'POST',
      '/events',
      eventData
    );

    assert(!response.success, 'Event creation without venue ID should fail');
    assert(response.status === 400, 'Should return 400 Bad Request status');
    assert(response.data.success === false, 'Response should indicate failure');
    assert(
      response.data.error === 'Venue ID is required',
      'Should have correct error message'
    );
  });

/**
 * Integration Tests
 */
const testCreateVenueRoomAndEvent =
  test('Create venue, room, and event in sequence should work', async () => {
    // Create venue
    const venueData = {
      name: 'Integration Test Venue',
      description: 'A venue for integration testing',
      address: '123 Integration Street',
      capacity: 100,
    };

    const venueResponse = await authenticatedApiRequest(
      'POST',
      '/venues',
      venueData
    );
    assert(venueResponse.success, 'Venue creation should succeed');
    const venueId = venueResponse.data.data.venueId;
    createdEntities.venues.push(venueId);

    // Create room in the venue
    const roomData = {
      name: 'Integration Test Room',
      description: 'A room for integration testing',
      venueId: venueId,
      capacity: 30,
      roomType: 'Gaming Room',
      amenities: ['Gaming Tables', 'Storage', 'WiFi'],
    };

    const roomResponse = await authenticatedApiRequest(
      'POST',
      '/rooms',
      roomData
    );
    assert(roomResponse.success, 'Room creation should succeed');
    const roomId = roomResponse.data.data.roomId;
    createdEntities.rooms.push(roomId);

    // Create event at the venue
    const eventData = {
      name: 'Integration Test Event',
      description: 'An event for integration testing',
      eventDate: '2026-11-15',
      endDate: '2026-11-15',
      startTime: '09:00',
      endTime: '17:00',
      venueId: venueId,
      maxParticipants: 25,
      createdBy: 'a6f3aec2-7d19-48d5-85a4-7602da37e79f',
    };

    const eventResponse = await authenticatedApiRequest(
      'POST',
      '/events',
      eventData
    );
    assert(eventResponse.success, 'Event creation should succeed');
    const eventId = eventResponse.data.data.eventId;
    createdEntities.events.push(eventId);

    // Verify all entities were created and are linked correctly
    assert(venueId, 'Venue should have been created');
    assert(roomId, 'Room should have been created');
    assert(eventId, 'Event should have been created');
    assert(
      roomResponse.data.data.venueId === venueId,
      'Room should be linked to venue'
    );
    assert(
      eventResponse.data.data.venueId === venueId,
      'Event should be linked to venue'
    );
  });

/**
 * Run all tests
 */
async function runTests() {
  console.log('🧪 Creation Tests');
  console.log('=================\n');

  // Run all tests
  const tests = [
    // Venue creation tests
    testCreateVenueWithValidData,
    testCreateVenueWithMinimalData,
    testCreateVenueWithMissingName,
    testCreateVenueWithMissingAddress,

    // Room creation tests
    testCreateRoomWithValidData,
    testCreateRoomWithMinimalData,
    testCreateRoomWithMissingName,
    testCreateRoomWithMissingVenueId,

    // Event creation tests
    testCreateEventWithValidData,
    testCreateEventWithMinimalData,
    testCreateEventWithMissingName,
    testCreateEventWithMissingVenueId,

    // Integration tests
    testCreateVenueRoomAndEvent,
  ];

  for (const testFn of tests) {
    await testFn();
    console.log(''); // Empty line between tests
  }

  // Cleanup created entities
  await cleanupCreatedEntities();

  // Print summary for this test file
  console.log('=================');
  console.log('📊 Creation Test Results');
  console.log('=================');
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

  console.log('\n✅ Creation tests completed!');
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
