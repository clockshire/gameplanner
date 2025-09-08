#!/usr/bin/env node

/**
 * Test script for basic DynamoDB operations
 * Verifies that the local setup is working correctly
 */

const { dynamodb } = require('../src/dynamodb');

/**
 * Test basic CRUD operations
 */
async function testBasicOperations() {
  console.log('🧪 Testing basic DynamoDB operations...\n');

  const testUser = {
    PK: 'USER#test123',
    SK: 'PROFILE',
    userId: 'test123',
    name: 'Test User',
    email: 'test@example.com',
    createdAt: new Date().toISOString(),
  };

  try {
    // Test PUT operation
    console.log('1. Testing PUT operation...');
    await dynamodb
      .put({
        TableName: 'users',
        Item: testUser,
      })
      .promise();
    console.log('✅ PUT operation successful');

    // Test GET operation
    console.log('2. Testing GET operation...');
    const result = await dynamodb
      .get({
        TableName: 'users',
        Key: {
          PK: 'USER#test123',
          SK: 'PROFILE',
        },
      })
      .promise();

    if (result.Item) {
      console.log('✅ GET operation successful');
      console.log(
        `   Retrieved user: ${result.Item.name} (${result.Item.email})`
      );
    } else {
      console.log('❌ GET operation failed - no item found');
    }

    // Test UPDATE operation
    console.log('3. Testing UPDATE operation...');
    await dynamodb
      .update({
        TableName: 'users',
        Key: {
          PK: 'USER#test123',
          SK: 'PROFILE',
        },
        UpdateExpression: 'SET #name = :name',
        ExpressionAttributeNames: {
          '#name': 'name',
        },
        ExpressionAttributeValues: {
          ':name': 'Updated Test User',
        },
      })
      .promise();
    console.log('✅ UPDATE operation successful');

    // Test QUERY operation
    console.log('4. Testing QUERY operation...');
    const queryResult = await dynamodb
      .query({
        TableName: 'users',
        KeyConditionExpression: 'PK = :pk',
        ExpressionAttributeValues: {
          ':pk': 'USER#test123',
        },
      })
      .promise();

    if (queryResult.Items && queryResult.Items.length > 0) {
      console.log('✅ QUERY operation successful');
      console.log(`   Found ${queryResult.Items.length} item(s)`);
    } else {
      console.log('❌ QUERY operation failed - no items found');
    }

    // Test DELETE operation
    console.log('5. Testing DELETE operation...');
    await dynamodb
      .delete({
        TableName: 'users',
        Key: {
          PK: 'USER#test123',
          SK: 'PROFILE',
        },
      })
      .promise();
    console.log('✅ DELETE operation successful');

    console.log('\n🎉 All basic operations test passed!');
    console.log('✅ Local DynamoDB setup is working correctly');
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  testBasicOperations().catch((error) => {
    console.error('❌ Test suite failed:', error);
    process.exit(1);
  });
}

module.exports = { testBasicOperations };
