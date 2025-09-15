#!/usr/bin/env node

/**
 * Test Runner
 * Discovers and runs all test files in the src/tests/ directory
 *
 * Usage: node src/tests/test-runner.js
 * Prerequisites: Server must be running on localhost:3001
 */

const fs = require('fs');
const path = require('path');

// Test results tracking
let totalTestsPassed = 0;
let totalTestsFailed = 0;
let totalTestFiles = 0;
let totalTestFilesPassed = 0;
let totalTestFilesFailed = 0;
const allTestResults = [];

/**
 * Run a single test file
 */
async function runTestFile(testFilePath) {
  const testFileName = path.basename(testFilePath);
  console.log(`\n📁 Running test file: ${testFileName}`);
  console.log('='.repeat(50));

  try {
    // Import and run the test file
    const testModule = require(testFilePath);

    // If the test module exports a runTests function, use it
    if (typeof testModule.runTests === 'function') {
      await testModule.runTests();
    } else {
      // If it's a direct execution file, it should run automatically
      console.log(`✅ Test file ${testFileName} completed`);
    }

    totalTestFilesPassed++;
    allTestResults.push({
      file: testFileName,
      status: 'PASS',
      testsPassed: testModule.testsPassed || 0,
      testsFailed: testModule.testsFailed || 0,
    });
  } catch (error) {
    console.error(`❌ Test file ${testFileName} failed:`, error.message);
    totalTestFilesFailed++;
    allTestResults.push({
      file: testFileName,
      status: 'FAIL',
      error: error.message,
      testsPassed: 0,
      testsFailed: 1,
    });
  }
}

/**
 * Discover all test files in the tests directory
 */
function discoverTestFiles() {
  const testsDir = path.join(__dirname);
  const files = fs.readdirSync(testsDir);

  return files
    .filter((file) => {
      // Include .test.js and .spec.js files, exclude test-runner.js
      return (
        (file.endsWith('.test.js') || file.endsWith('.spec.js')) &&
        file !== 'test-runner.js'
      );
    })
    .map((file) => path.join(testsDir, file))
    .sort(); // Sort for consistent execution order
}

/**
 * Check if server is running
 */
async function checkServer() {
  try {
    const response = await fetch('http://localhost:3001/api/health');
    if (!response.ok) {
      throw new Error('Server is not responding');
    }
    console.log('✅ Server is running and responding');
    return true;
  } catch (error) {
    console.error('❌ Server check failed:', error.message);
    console.error('Please ensure the server is running on localhost:3001');
    return false;
  }
}

/**
 * Global cleanup function to remove any leftover test entities
 */
async function globalCleanup() {
  console.log('🧹 Performing global cleanup of leftover test entities...');

  const API_BASE_URL = 'http://localhost:3001/api';

  try {
    // Authenticate as cleanup user
    let authHeaders = {};
    try {
      // First try to create the cleanup user if it doesn't exist
      await fetch(`${API_BASE_URL}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'cleanup@test.com',
          name: 'Cleanup User',
          password: 'cleanup123',
        }),
      });

      // Try to login as cleanup user
      const loginResponse = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'cleanup@test.com',
          password: 'cleanup123',
        }),
      });

      if (loginResponse.ok) {
        const loginData = await loginResponse.json();
        if (loginData.success && loginData.data.sessionToken) {
          authHeaders = {
            Authorization: `Bearer ${loginData.data.sessionToken}`,
          };
        }
      }
    } catch (error) {
      console.log(
        '   ⚠️  Could not authenticate for cleanup, proceeding without auth'
      );
    }

    // Get all entities
    const [
      eventsResponse,
      roomsResponse,
      venuesResponse,
      invitationsResponse,
      eventParticipantsResponse,
    ] = await Promise.all([
      fetch(`${API_BASE_URL}/events`, { headers: authHeaders }),
      fetch(`${API_BASE_URL}/rooms`, { headers: authHeaders }),
      fetch(`${API_BASE_URL}/venues`, { headers: authHeaders }),
      fetch(`${API_BASE_URL}/invitations`),
      fetch(`${API_BASE_URL}/event-participants`),
    ]);

    const events = await eventsResponse.json();
    const rooms = await roomsResponse.json();
    const venues = await venuesResponse.json();
    const invitations = await invitationsResponse.json();
    const eventParticipants = await eventParticipantsResponse.json();

    let cleanupCount = 0;

    // Delete all events
    if (events.success && events.data && events.data.length > 0) {
      for (const event of events.data) {
        try {
          const response = await fetch(
            `${API_BASE_URL}/events/${event.eventId}`,
            { method: 'DELETE', headers: authHeaders }
          );
          if (response.ok) {
            cleanupCount++;
          } else {
            console.log(
              `   ⚠️  Failed to delete event ${event.eventId}: HTTP ${response.status}`
            );
          }
        } catch (error) {
          console.log(
            `   ⚠️  Failed to delete event ${event.eventId}: ${error.message}`
          );
        }
        // Small delay to avoid overwhelming the server
        await new Promise((resolve) => setTimeout(resolve, 50));
      }
    }

    // Delete all rooms
    if (rooms.success && rooms.data && rooms.data.length > 0) {
      for (const room of rooms.data) {
        try {
          const response = await fetch(`${API_BASE_URL}/rooms/${room.roomId}`, {
            method: 'DELETE',
            headers: authHeaders,
          });
          if (response.ok) {
            cleanupCount++;
          } else {
            console.log(
              `   ⚠️  Failed to delete room ${room.roomId}: HTTP ${response.status}`
            );
          }
        } catch (error) {
          console.log(
            `   ⚠️  Failed to delete room ${room.roomId}: ${error.message}`
          );
        }
        // Small delay to avoid overwhelming the server
        await new Promise((resolve) => setTimeout(resolve, 50));
      }
    }

    // Delete all venues
    if (venues.success && venues.data && venues.data.length > 0) {
      for (const venue of venues.data) {
        try {
          const response = await fetch(
            `${API_BASE_URL}/venues/${venue.venueId}`,
            { method: 'DELETE', headers: authHeaders }
          );
          if (response.ok) {
            cleanupCount++;
          } else {
            console.log(
              `   ⚠️  Failed to delete venue ${venue.venueId}: HTTP ${response.status}`
            );
          }
        } catch (error) {
          console.log(
            `   ⚠️  Failed to delete venue ${venue.venueId}: ${error.message}`
          );
        }
        // Small delay to avoid overwhelming the server
        await new Promise((resolve) => setTimeout(resolve, 50));
      }
    }

    // Delete all invitations
    if (
      invitations.success &&
      invitations.data &&
      invitations.data.length > 0
    ) {
      for (const invitation of invitations.data) {
        try {
          const response = await fetch(
            `${API_BASE_URL}/invitations/${invitation.inviteCode}`,
            { method: 'DELETE', headers: authHeaders }
          );
          if (response.ok) {
            cleanupCount++;
          } else {
            console.log(
              `   ⚠️  Failed to delete invitation ${invitation.inviteCode}: HTTP ${response.status}`
            );
          }
        } catch (error) {
          console.log(
            `   ⚠️  Failed to delete invitation ${invitation.inviteCode}: ${error.message}`
          );
        }
        // Small delay to avoid overwhelming the server
        await new Promise((resolve) => setTimeout(resolve, 50));
      }
    }

    // Delete all event participants
    if (
      eventParticipants.success &&
      eventParticipants.data &&
      eventParticipants.data.length > 0
    ) {
      for (const participant of eventParticipants.data) {
        try {
          const response = await fetch(
            `${API_BASE_URL}/event-participants/${participant.eventId}/${participant.userId}`,
            { method: 'DELETE', headers: authHeaders }
          );
          if (response.ok) {
            cleanupCount++;
          } else {
            console.log(
              `   ⚠️  Failed to delete participant ${participant.userId} from event ${participant.eventId}: HTTP ${response.status}`
            );
          }
        } catch (error) {
          console.log(
            `   ⚠️  Failed to delete participant ${participant.userId} from event ${participant.eventId}: ${error.message}`
          );
        }
        // Small delay to avoid overwhelming the server
        await new Promise((resolve) => setTimeout(resolve, 50));
      }
    }

    if (cleanupCount > 0) {
      console.log(`✅ Cleaned up ${cleanupCount} leftover entities`);
    } else {
      console.log('✅ No leftover entities found');
    }
  } catch (error) {
    console.log(`⚠️  Global cleanup failed: ${error.message}`);
  }
}

/**
 * Main test runner function
 */
async function runAllTests() {
  console.log('🚀 Starting Test Suite');
  console.log('======================\n');

  // Check if server is running
  const serverRunning = await checkServer();
  if (!serverRunning) {
    process.exit(1);
  }

  // Check if this is a cleanup-only run
  if (process.argv.includes('--cleanup-only')) {
    console.log('🧹 Running cleanup only...');
    const { exec } = require('child_process');
    const { promisify } = require('util');
    const execAsync = promisify(exec);

    try {
      const { stdout, stderr } = await execAsync(
        'cd backend && node scripts/cleanup-test-data.js'
      );
      console.log(stdout);
      if (stderr) console.error(stderr);
    } catch (error) {
      console.error('Cleanup failed:', error.message);
    }
    console.log('✅ Cleanup completed');
    return;
  }

  // Perform global cleanup before running tests
  await globalCleanup();

  // Discover test files
  const testFiles = discoverTestFiles();
  totalTestFiles = testFiles.length;

  if (testFiles.length === 0) {
    console.log('⚠️  No test files found in src/tests/');
    console.log('   Looking for files ending with .test.js or .spec.js');
    process.exit(0);
  }

  console.log(`📋 Found ${testFiles.length} test file(s):`);
  testFiles.forEach((file) => {
    console.log(`   - ${path.basename(file)}`);
  });
  console.log('');

  // Run each test file
  for (const testFile of testFiles) {
    await runTestFile(testFile);
  }

  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 Test Suite Summary');
  console.log('='.repeat(60));
  console.log(`📁 Test Files: ${totalTestFiles}`);
  console.log(`✅ Files Passed: ${totalTestFilesPassed}`);
  console.log(`❌ Files Failed: ${totalTestFilesFailed}`);
  console.log(
    `📈 File Success Rate: ${Math.round(
      (totalTestFilesPassed / totalTestFiles) * 100
    )}%`
  );

  // Calculate total individual tests
  const totalIndividualTests = allTestResults.reduce(
    (sum, result) =>
      sum + (result.testsPassed || 0) + (result.testsFailed || 0),
    0
  );
  const totalIndividualPassed = allTestResults.reduce(
    (sum, result) => sum + (result.testsPassed || 0),
    0
  );
  const totalIndividualFailed = allTestResults.reduce(
    (sum, result) => sum + (result.testsFailed || 0),
    0
  );

  if (totalIndividualTests > 0) {
    console.log(`\n🧪 Individual Tests: ${totalIndividualTests}`);
    console.log(`✅ Tests Passed: ${totalIndividualPassed}`);
    console.log(`❌ Tests Failed: ${totalIndividualFailed}`);
    console.log(
      `📈 Test Success Rate: ${Math.round(
        (totalIndividualPassed / totalIndividualTests) * 100
      )}%`
    );
  }

  if (totalTestFilesFailed > 0) {
    console.log('\n❌ Failed Test Files:');
    allTestResults
      .filter((result) => result.status === 'FAIL')
      .forEach((result) => {
        console.log(`   - ${result.file}: ${result.error}`);
      });
  }

  console.log('\n🎉 Test suite completed!');

  // Exit with appropriate code
  process.exit(totalTestFilesFailed > 0 ? 1 : 0);
}

// Run the tests
runAllTests().catch((error) => {
  console.error('💥 Test runner crashed:', error);
  process.exit(1);
});
