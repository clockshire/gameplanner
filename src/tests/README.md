# Test Suite

This directory contains all test files for the Game Planner application.

## Structure

```text
src/tests/
├── README.md                 # This file
├── test-runner.js           # Main test runner that discovers and runs all tests
├── example.test.js          # Example test file showing the structure
└── venue-deletion.test.js   # Venue deletion functionality tests
```

## Running Tests

### Run All Tests

```bash
npm test
# or
npm run test:all
```

### Run Specific Test File

```bash
npm run test:venue-deletion
# or
node src/tests/venue-deletion.test.js
```

## Creating New Tests

### 1. Create a Test File

Create a new file ending with `.test.js` or `.spec.js` in this directory.

### 2. Test File Structure

```javascript
#!/usr/bin/env node

// Test results tracking
let testsPassed = 0;
let testsFailed = 0;
const testResults = [];

// Helper functions (apiRequest, test, assert, etc.)

// Your test functions
const testSomething = test('Test description', async () => {
  // Test implementation
  assert(condition, 'Error message if condition fails');
});

// Run all tests function
async function runTests() {
  console.log('🧪 Your Test Suite Name');
  console.log('======================\n');

  const tests = [
    testSomething,
    // ... other tests
  ];

  for (const testFn of tests) {
    await testFn();
    console.log('');
  }

  // Print summary
  console.log('======================');
  console.log('📊 Test Results');
  console.log('======================');
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

  console.log('\n✅ Tests completed!');
}

// Export for test runner
module.exports = {
  runTests,
  get testsPassed() {
    return testsPassed;
  },
  get testsFailed() {
    return testsFailed;
  },
};
```

### 3. Test Helper Functions

#### `apiRequest(method, endpoint, data)`

Makes HTTP requests to the API server.

```javascript
const response = await apiRequest('GET', '/venues');
const response = await apiRequest('POST', '/venues', { name: 'Test Venue' });
```

#### `test(name, testFn)`

Creates a test function with automatic pass/fail tracking.

```javascript
const testSomething = test('Test description', async () => {
  // Test implementation
});
```

#### `assert(condition, message)`

Throws an error if the condition is false.

```javascript
assert(response.success, 'API request should succeed');
assert(response.status === 200, 'Should return 200 status');
```

## Test Categories

### API Tests

Test API endpoints, request/response handling, and error cases.

### Integration Tests

Test complete workflows and interactions between components.

### Business Logic Tests

Test specific business rules and validation logic.

## Prerequisites

- Server must be running on `localhost:3001`
- DynamoDB Local must be running
- Test data will be created and cleaned up automatically

## Best Practices

1. **Use descriptive test names** that explain what is being tested
2. **Test both success and failure cases**
3. **Clean up test data** after each test
4. **Use meaningful assertions** with clear error messages
5. **Group related tests** in the same test file
6. **Keep tests independent** - each test should be able to run in isolation

## Example Test Files

- `example.test.js` - Basic API health checks and endpoint accessibility
- `venue-deletion.test.js` - Comprehensive venue deletion functionality tests

## Test Runner Features

- **Automatic discovery** of all `.test.js` and `.spec.js` files
- **Parallel execution** of test files
- **Comprehensive reporting** with pass/fail counts and success rates
- **Server health check** before running tests
- **Exit codes** for CI/CD integration (0 = success, 1 = failure)
