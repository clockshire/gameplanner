#!/usr/bin/env node

/**
 * Participant Tracking Tests
 * Tests the event participant tracking functionality including:
 * - Invitation creation and redemption
 * - Participant addition and removal
 * - Event access control for participants vs owners
 * - Participant listing and management
 */

// Test results tracking
let testsPassed = 0;
let testsFailed = 0;
const testResults = [];

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

  try {
    const response = await fetch(url, options);
    const responseData = await response.json();
    return {
      status: response.status,
      data: responseData,
      success: response.ok,
    };
  } catch (error) {
    return {
      status: 0,
      data: { error: error.message },
      success: false,
    };
  }
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
  // Try to authenticate first (in case user already exists)
  const existingToken = await authenticateUser(email, password);
  if (existingToken) {
    return { success: true, data: { data: { user: { email, name } } } };
  }

  // User doesn't exist, create them
  const response = await apiRequest('POST', '/auth/signup', {
    email,
    name,
    password,
  });
  return response;
}

/**
 * Helper function to create a test event
 */
async function createTestEvent(sessionToken, eventData) {
  const response = await apiRequest('POST', '/events', eventData, {
    Authorization: `Bearer ${sessionToken}`,
  });
  return response;
}

/**
 * Helper function to create a test venue
 */
async function createTestVenue(sessionToken, venueData) {
  const response = await apiRequest('POST', '/venues', venueData, {
    Authorization: `Bearer ${sessionToken}`,
  });
  return response;
}

/**
 * Test runner function
 */
async function runTest(testName, testFunction) {
  console.log(`\n🧪 Running test: ${testName}`);
  try {
    await testFunction();
    console.log(`✅ PASSED: ${testName}`);
    testsPassed++;
    testResults.push({ name: testName, status: 'PASSED' });
  } catch (error) {
    console.log(`❌ FAILED: ${testName}`);
    console.log(`   Error: ${error.message}`);
    testsFailed++;
    testResults.push({
      name: testName,
      status: 'FAILED',
      error: error.message,
    });
  }
}

/**
 * Test 1: Create invitation and redeem it
 */
async function testInvitationCreationAndRedemption() {
  // Create test users
  const ownerResponse = await createTestUser(
    'owner@test.com',
    'Event Owner',
    'password123'
  );
  if (!ownerResponse.success) {
    throw new Error('Failed to create owner user');
  }

  const participantResponse = await createTestUser(
    'participant@test.com',
    'Event Participant',
    'password123'
  );
  if (!participantResponse.success) {
    throw new Error('Failed to create participant user');
  }

  // Authenticate owner
  const ownerToken = await authenticateUser('owner@test.com', 'password123');
  if (!ownerToken) {
    throw new Error('Failed to authenticate owner');
  }

  // Create a test venue
  const venueResponse = await createTestVenue(ownerToken, {
    name: 'Test Venue for Participants',
    description: 'A test venue for participant tracking',
    address: '123 Test Street, Test City',
    capacity: 50,
  });

  if (!venueResponse.success) {
    throw new Error('Failed to create test venue');
  }

  const venueId = venueResponse.data.data.venueId;

  // Create a test event
  const eventResponse = await createTestEvent(ownerToken, {
    name: 'Test Event for Participants',
    description: 'A test event for participant tracking',
    eventDate: '2025-12-25',
    startTime: '10:00',
    endTime: '18:00',
    venueId: venueId,
    maxParticipants: 20,
  });

  if (!eventResponse.success) {
    throw new Error('Failed to create test event');
  }

  const eventId = eventResponse.data.data.eventId;

  // Create an invitation
  const invitationResponse = await apiRequest(
    'POST',
    '/invitations',
    {
      eventId: eventId,
      type: 'one-time',
      description: 'Test invitation for participant tracking',
    },
    {
      Authorization: `Bearer ${ownerToken}`,
    }
  );

  if (!invitationResponse.success) {
    throw new Error('Failed to create invitation');
  }

  const inviteCode = invitationResponse.data.data.inviteCode;

  // Authenticate participant
  const participantToken = await authenticateUser(
    'participant@test.com',
    'password123'
  );
  if (!participantToken) {
    throw new Error('Failed to authenticate participant');
  }

  // Redeem the invitation
  const redeemResponse = await apiRequest(
    'POST',
    `/invitations/${inviteCode}/redeem`,
    null,
    {
      Authorization: `Bearer ${participantToken}`,
    }
  );

  if (!redeemResponse.success) {
    throw new Error('Failed to redeem invitation');
  }

  if (!redeemResponse.data.data.participantAdded) {
    throw new Error('Participant was not added to event');
  }

  console.log(`   ✅ Invitation created and redeemed successfully`);
  console.log(`   ✅ Event ID: ${eventId}`);
  console.log(`   ✅ Invite Code: ${inviteCode}`);
}

/**
 * Test 2: Verify participant can view event but not edit it
 */
async function testParticipantEventAccess() {
  // Authenticate participant
  const participantToken = await authenticateUser(
    'participant@test.com',
    'password123'
  );
  if (!participantToken) {
    throw new Error('Failed to authenticate participant');
  }

  // Get the event ID from the previous test (we'll need to find it)
  // For now, let's create a new event and invitation for this test
  const ownerToken = await authenticateUser('owner@test.com', 'password123');
  if (!ownerToken) {
    throw new Error('Failed to authenticate owner');
  }

  // Create another test event
  const eventResponse = await createTestEvent(ownerToken, {
    name: 'Access Control Test Event',
    description: 'Testing participant access control',
    eventDate: '2025-12-26',
    startTime: '09:00',
    endTime: '17:00',
    venueId: 'test-venue-id', // We'll use a placeholder
    maxParticipants: 10,
  });

  if (!eventResponse.success) {
    throw new Error('Failed to create test event for access control');
  }

  const eventId = eventResponse.data.data.eventId;

  // Create invitation and redeem it
  const invitationResponse = await apiRequest(
    'POST',
    '/invitations',
    {
      eventId: eventId,
      type: 'generic',
      description: 'Access control test invitation',
    },
    {
      Authorization: `Bearer ${ownerToken}`,
    }
  );

  if (!invitationResponse.success) {
    throw new Error('Failed to create invitation for access control test');
  }

  const inviteCode = invitationResponse.data.data.inviteCode;

  // Redeem invitation
  const redeemResponse = await apiRequest(
    'POST',
    `/invitations/${inviteCode}/redeem`,
    null,
    {
      Authorization: `Bearer ${participantToken}`,
    }
  );

  if (!redeemResponse.success) {
    throw new Error('Failed to redeem invitation for access control test');
  }

  // Test 1: Participant can view event
  const viewResponse = await apiRequest('GET', `/events/${eventId}`, null, {
    Authorization: `Bearer ${participantToken}`,
  });

  if (!viewResponse.success) {
    throw new Error('Participant should be able to view event');
  }

  if (viewResponse.data.data.userAccess.level !== 'participant') {
    throw new Error(
      `Expected participant access level, got: ${viewResponse.data.data.userAccess.level}`
    );
  }

  if (viewResponse.data.data.userAccess.isOwner !== false) {
    throw new Error('Participant should not be marked as owner');
  }

  if (viewResponse.data.data.userAccess.isParticipant !== true) {
    throw new Error('Participant should be marked as participant');
  }

  // Test 2: Participant cannot edit event
  const editResponse = await apiRequest(
    'PUT',
    `/events/${eventId}`,
    {
      name: 'Modified Event Name',
    },
    {
      Authorization: `Bearer ${participantToken}`,
    }
  );

  if (editResponse.success) {
    throw new Error('Participant should not be able to edit event');
  }

  if (editResponse.status !== 403) {
    throw new Error(`Expected 403 Forbidden, got: ${editResponse.status}`);
  }

  // Test 3: Participant cannot delete event
  const deleteResponse = await apiRequest(
    'DELETE',
    `/events/${eventId}`,
    null,
    {
      Authorization: `Bearer ${participantToken}`,
    }
  );

  if (deleteResponse.success) {
    throw new Error('Participant should not be able to delete event');
  }

  if (deleteResponse.status !== 403) {
    throw new Error(`Expected 403 Forbidden, got: ${deleteResponse.status}`);
  }

  console.log(`   ✅ Participant can view event with correct access level`);
  console.log(`   ✅ Participant cannot edit event (403 Forbidden)`);
  console.log(`   ✅ Participant cannot delete event (403 Forbidden)`);
}

/**
 * Test 3: Verify participant listing functionality
 */
async function testParticipantListing() {
  // Authenticate owner
  const ownerToken = await authenticateUser('owner@test.com', 'password123');
  if (!ownerToken) {
    throw new Error('Failed to authenticate owner');
  }

  // Create a test event for participant listing
  const eventResponse = await createTestEvent(ownerToken, {
    name: 'Participant Listing Test Event',
    description: 'Testing participant listing functionality',
    eventDate: '2025-12-27',
    startTime: '14:00',
    endTime: '16:00',
    venueId: 'test-venue-id',
    maxParticipants: 5,
  });

  if (!eventResponse.success) {
    throw new Error('Failed to create test event for participant listing');
  }

  const eventId = eventResponse.data.data.eventId;

  // Create multiple invitations
  const invitation1Response = await apiRequest(
    'POST',
    '/invitations',
    {
      eventId: eventId,
      type: 'generic',
      description: 'Participant 1 invitation',
    },
    {
      Authorization: `Bearer ${ownerToken}`,
    }
  );

  const invitation2Response = await apiRequest(
    'POST',
    '/invitations',
    {
      eventId: eventId,
      type: 'generic',
      description: 'Participant 2 invitation',
    },
    {
      Authorization: `Bearer ${ownerToken}`,
    }
  );

  if (!invitation1Response.success || !invitation2Response.success) {
    throw new Error('Failed to create test invitations');
  }

  // Create additional test users
  const user1Response = await createTestUser(
    'participant1@test.com',
    'Participant 1',
    'password123'
  );
  const user2Response = await createTestUser(
    'participant2@test.com',
    'Participant 2',
    'password123'
  );

  if (!user1Response.success || !user2Response.success) {
    throw new Error('Failed to create test users for participant listing');
  }

  // Authenticate users
  const user1Token = await authenticateUser(
    'participant1@test.com',
    'password123'
  );
  const user2Token = await authenticateUser(
    'participant2@test.com',
    'password123'
  );

  if (!user1Token || !user2Token) {
    throw new Error('Failed to authenticate test users');
  }

  // Redeem invitations
  const redeem1Response = await apiRequest(
    'POST',
    `/invitations/${invitation1Response.data.data.inviteCode}/redeem`,
    null,
    {
      Authorization: `Bearer ${user1Token}`,
    }
  );

  const redeem2Response = await apiRequest(
    'POST',
    `/invitations/${invitation2Response.data.data.inviteCode}/redeem`,
    null,
    {
      Authorization: `Bearer ${user2Token}`,
    }
  );

  if (!redeem1Response.success || !redeem2Response.success) {
    throw new Error('Failed to redeem test invitations');
  }

  // Test participant listing
  const participantsResponse = await apiRequest(
    'GET',
    `/event-participants/event/${eventId}`,
    null,
    {
      Authorization: `Bearer ${ownerToken}`,
    }
  );

  if (!participantsResponse.success) {
    throw new Error('Failed to get event participants');
  }

  const participants = participantsResponse.data.data;
  if (participants.length < 2) {
    throw new Error(
      `Expected at least 2 participants, got: ${participants.length}`
    );
  }

  // Verify participant data structure
  const participant = participants[0];
  if (
    !participant.eventId ||
    !participant.userId ||
    !participant.userName ||
    !participant.userEmail
  ) {
    throw new Error('Participant data is missing required fields');
  }

  if (participant.eventId !== eventId) {
    throw new Error('Participant eventId does not match');
  }

  console.log(`   ✅ Found ${participants.length} participants`);
  console.log(`   ✅ Participant data structure is correct`);
}

/**
 * Test 4: Verify participant count functionality
 */
async function testParticipantCount() {
  // Authenticate owner
  const ownerToken = await authenticateUser('owner@test.com', 'password123');
  if (!ownerToken) {
    throw new Error('Failed to authenticate owner');
  }

  // Create a test event for participant count
  const eventResponse = await createTestEvent(ownerToken, {
    name: 'Participant Count Test Event',
    description: 'Testing participant count functionality',
    eventDate: '2025-12-28',
    startTime: '10:00',
    endTime: '12:00',
    venueId: 'test-venue-id',
    maxParticipants: 3,
  });

  if (!eventResponse.success) {
    throw new Error('Failed to create test event for participant count');
  }

  const eventId = eventResponse.data.data.eventId;

  // Test initial count (should be 0)
  const initialCountResponse = await apiRequest(
    'GET',
    `/event-participants/count/${eventId}`,
    null,
    {
      Authorization: `Bearer ${ownerToken}`,
    }
  );

  if (!initialCountResponse.success) {
    throw new Error('Failed to get initial participant count');
  }

  if (initialCountResponse.data.count !== 0) {
    throw new Error(
      `Expected initial count of 0, got: ${initialCountResponse.data.count}`
    );
  }

  // Add a participant
  const invitationResponse = await apiRequest(
    'POST',
    '/invitations',
    {
      eventId: eventId,
      type: 'one-time',
      description: 'Count test invitation',
    },
    {
      Authorization: `Bearer ${ownerToken}`,
    }
  );

  if (!invitationResponse.success) {
    throw new Error('Failed to create invitation for count test');
  }

  // Create and authenticate a test user
  const userResponse = await createTestUser(
    'counttest@test.com',
    'Count Test User',
    'password123'
  );
  if (!userResponse.success) {
    throw new Error('Failed to create test user for count test');
  }

  const userToken = await authenticateUser('counttest@test.com', 'password123');
  if (!userToken) {
    throw new Error('Failed to authenticate test user for count test');
  }

  // Redeem invitation
  const redeemResponse = await apiRequest(
    'POST',
    `/invitations/${invitationResponse.data.data.inviteCode}/redeem`,
    null,
    {
      Authorization: `Bearer ${userToken}`,
    }
  );

  if (!redeemResponse.success) {
    throw new Error('Failed to redeem invitation for count test');
  }

  // Test updated count (should be 1)
  const updatedCountResponse = await apiRequest(
    'GET',
    `/event-participants/count/${eventId}`,
    null,
    {
      Authorization: `Bearer ${ownerToken}`,
    }
  );

  if (!updatedCountResponse.success) {
    throw new Error('Failed to get updated participant count');
  }

  if (updatedCountResponse.data.count !== 1) {
    throw new Error(
      `Expected updated count of 1, got: ${updatedCountResponse.data.count}`
    );
  }

  console.log(`   ✅ Initial participant count: 0`);
  console.log(`   ✅ Updated participant count: 1`);
}

/**
 * Test 5: Verify participant removal functionality
 */
async function testParticipantRemoval() {
  // Authenticate owner
  const ownerToken = await authenticateUser('owner@test.com', 'password123');
  if (!ownerToken) {
    throw new Error('Failed to authenticate owner');
  }

  // Create a test event for participant removal
  const eventResponse = await createTestEvent(ownerToken, {
    name: 'Participant Removal Test Event',
    description: 'Testing participant removal functionality',
    eventDate: '2025-12-29',
    startTime: '15:00',
    endTime: '17:00',
    venueId: 'test-venue-id',
    maxParticipants: 2,
  });

  if (!eventResponse.success) {
    throw new Error('Failed to create test event for participant removal');
  }

  const eventId = eventResponse.data.data.eventId;

  // Create invitation and add participant
  const invitationResponse = await apiRequest(
    'POST',
    '/invitations',
    {
      eventId: eventId,
      type: 'one-time',
      description: 'Removal test invitation',
    },
    {
      Authorization: `Bearer ${ownerToken}`,
    }
  );

  if (!invitationResponse.success) {
    throw new Error('Failed to create invitation for removal test');
  }

  // Create and authenticate a test user
  const userResponse = await createTestUser(
    'removaltest@test.com',
    'Removal Test User',
    'password123'
  );
  if (!userResponse.success) {
    throw new Error('Failed to create test user for removal test');
  }

  const userToken = await authenticateUser(
    'removaltest@test.com',
    'password123'
  );
  if (!userToken) {
    throw new Error('Failed to authenticate test user for removal test');
  }

  const userId = userResponse.data.data.user.userId;

  // Redeem invitation
  const redeemResponse = await apiRequest(
    'POST',
    `/invitations/${invitationResponse.data.data.inviteCode}/redeem`,
    null,
    {
      Authorization: `Bearer ${userToken}`,
    }
  );

  if (!redeemResponse.success) {
    throw new Error('Failed to redeem invitation for removal test');
  }

  // Verify participant was added
  const participantsBeforeResponse = await apiRequest(
    'GET',
    `/event-participants/event/${eventId}`,
    null,
    {
      Authorization: `Bearer ${ownerToken}`,
    }
  );

  if (!participantsBeforeResponse.success) {
    throw new Error('Failed to get participants before removal');
  }

  if (participantsBeforeResponse.data.data.length !== 1) {
    throw new Error(
      `Expected 1 participant before removal, got: ${participantsBeforeResponse.data.data.length}`
    );
  }

  // Remove participant
  const removeResponse = await apiRequest(
    'DELETE',
    `/event-participants/${eventId}/${userId}`,
    null,
    {
      Authorization: `Bearer ${userToken}`,
    }
  );

  if (!removeResponse.success) {
    throw new Error('Failed to remove participant');
  }

  // Verify participant was removed
  const participantsAfterResponse = await apiRequest(
    'GET',
    `/event-participants/event/${eventId}`,
    null,
    {
      Authorization: `Bearer ${ownerToken}`,
    }
  );

  if (!participantsAfterResponse.success) {
    throw new Error('Failed to get participants after removal');
  }

  if (participantsAfterResponse.data.data.length !== 0) {
    throw new Error(
      `Expected 0 participants after removal, got: ${participantsAfterResponse.data.data.length}`
    );
  }

  console.log(`   ✅ Participant added successfully`);
  console.log(`   ✅ Participant removed successfully`);
}

/**
 * Main test runner
 */
async function runAllTests() {
  console.log('🚀 Starting Participant Tracking Tests');
  console.log('=====================================');

  try {
    await runTest(
      'Invitation Creation and Redemption',
      testInvitationCreationAndRedemption
    );
    await runTest(
      'Participant Event Access Control',
      testParticipantEventAccess
    );
    await runTest('Participant Listing Functionality', testParticipantListing);
    await runTest('Participant Count Functionality', testParticipantCount);
    await runTest('Participant Removal Functionality', testParticipantRemoval);

    console.log('\n📊 Test Results Summary');
    console.log('======================');
    console.log(`✅ Tests Passed: ${testsPassed}`);
    console.log(`❌ Tests Failed: ${testsFailed}`);
    console.log(
      `📈 Success Rate: ${(
        (testsPassed / (testsPassed + testsFailed)) *
        100
      ).toFixed(1)}%`
    );

    if (testsFailed > 0) {
      console.log('\n❌ Failed Tests:');
      testResults
        .filter((result) => result.status === 'FAILED')
        .forEach((result) => {
          console.log(`   - ${result.name}: ${result.error}`);
        });
    }

    console.log('\n🎉 Participant Tracking Tests Complete!');

    if (testsFailed === 0) {
      console.log(
        '🎊 All tests passed! Participant tracking is working correctly.'
      );
    } else {
      console.log('⚠️  Some tests failed. Please review the errors above.');
      process.exit(1);
    }
  } catch (error) {
    console.error('💥 Test runner error:', error);
    process.exit(1);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests();
}

module.exports = { runAllTests };
