#!/usr/bin/env node

/**
 * Cleanup Test Data Script
 * Directly deletes all test data from DynamoDB tables
 *
 * Usage: node backend/scripts/cleanup-test-data.js
 */

const AWS = require('aws-sdk');

// Configure DynamoDB
const dynamodb = new AWS.DynamoDB.DocumentClient({
  endpoint: 'http://localhost:8000',
  region: 'us-east-1',
  accessKeyId: 'dummy',
  secretAccessKey: 'dummy',
});

const TABLES = [
  'invitations',
  'eventParticipants',
  'events',
  'rooms',
  'venues',
  'users',
];

async function cleanupTable(tableName) {
  console.log(`🧹 Cleaning up ${tableName}...`);

  try {
    // Get all items from the table
    const scanParams = {
      TableName: tableName,
    };

    const result = await dynamodb.scan(scanParams).promise();
    const items = result.Items || [];

    if (items.length === 0) {
      console.log(`   ✅ No items found in ${tableName}`);
      return 0;
    }

    let deletedCount = 0;

    // Delete each item
    for (const item of items) {
      try {
        // All tables use PK and SK as primary key
        const key = {
          PK: item.PK,
          SK: item.SK,
        };

        const deleteParams = {
          TableName: tableName,
          Key: key,
        };

        await dynamodb.delete(deleteParams).promise();
        deletedCount++;

        // Small delay to avoid overwhelming the database
        await new Promise((resolve) => setTimeout(resolve, 10));
      } catch (error) {
        console.log(
          `   ⚠️  Failed to delete item from ${tableName}: ${error.message}`
        );
      }
    }

    console.log(`   ✅ Deleted ${deletedCount} items from ${tableName}`);
    return deletedCount;
  } catch (error) {
    console.log(`   ❌ Error cleaning up ${tableName}: ${error.message}`);
    return 0;
  }
}

async function main() {
  console.log('🧹 Starting test data cleanup...');
  console.log('================================');

  let totalDeleted = 0;

  // Clean up tables in reverse dependency order
  for (const tableName of TABLES) {
    const deleted = await cleanupTable(tableName);
    totalDeleted += deleted;
  }

  console.log('================================');
  console.log(`✅ Cleanup completed! Deleted ${totalDeleted} total items`);
}

// Run if this file is executed directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main };
