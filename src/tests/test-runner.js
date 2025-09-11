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
