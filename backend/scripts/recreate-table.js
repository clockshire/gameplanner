/**
 * Script to recreate the users table with the updated schema including EventIdIndex
 */

const AWS = require('aws-sdk');
const config = require('../config/environment');

// Configure AWS
if (config.dynamodb.endpoint) {
  AWS.config.update({
    accessKeyId: config.dynamodb.accessKeyId,
    secretAccessKey: config.dynamodb.secretAccessKey,
    region: config.dynamodb.region,
    endpoint: config.dynamodb.endpoint,
  });
} else {
  AWS.config.update({
    region: config.dynamodb.region,
  });
}

const dynamodb = new AWS.DynamoDB();

async function recreateTable() {
  const tableName = 'users';

  try {
    console.log('🔄 Recreating users table with updated schema...');

    // First, try to delete the existing table
    try {
      console.log('🗑️  Deleting existing table...');
      await dynamodb.deleteTable({ TableName: tableName }).promise();

      // Wait for table to be deleted
      await dynamodb.waitFor('tableNotExists', { TableName: tableName }).promise();
      console.log('✅ Table deleted successfully');
    } catch (error) {
      if (error.code === 'ResourceNotFoundException') {
        console.log('ℹ️  Table does not exist, proceeding to create...');
      } else {
        throw error;
      }
    }

    // Create the table with the updated schema
    const schema = {
      TableName: tableName,
      KeySchema: [
        { AttributeName: 'PK', KeyType: 'HASH' },
        { AttributeName: 'SK', KeyType: 'RANGE' },
      ],
      AttributeDefinitions: [
        { AttributeName: 'PK', AttributeType: 'S' },
        { AttributeName: 'SK', AttributeType: 'S' },
        { AttributeName: 'email', AttributeType: 'S' },
        { AttributeName: 'eventId', AttributeType: 'S' },
      ],
      GlobalSecondaryIndexes: [
        {
          IndexName: 'EmailIndex',
          KeySchema: [{ AttributeName: 'email', KeyType: 'HASH' }],
          Projection: { ProjectionType: 'ALL' },
        },
        {
          IndexName: 'EventIdIndex',
          KeySchema: [{ AttributeName: 'eventId', KeyType: 'HASH' }],
          Projection: { ProjectionType: 'ALL' },
        },
      ],
      BillingMode: 'PAY_PER_REQUEST',
    };

    console.log('📝 Creating table with updated schema...');
    await dynamodb.createTable(schema).promise();

    // Wait for table to be active
    await dynamodb.waitFor('tableExists', { TableName: tableName }).promise();
    console.log('✅ Table created successfully with EventIdIndex');

  } catch (error) {
    console.error('❌ Failed to recreate table:', error.message);
    process.exit(1);
  }
}

// Run the script
recreateTable();
