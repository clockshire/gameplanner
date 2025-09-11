#!/usr/bin/env node

/**
 * Script to fix the rooms table by recreating it with the correct schema
 * This adds the missing VenueRoomsIndex
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

async function fixRoomsTable() {
  const tableName = 'rooms';

  try {
    console.log('🔄 Fixing rooms table with correct schema...');

    // First, backup existing data
    console.log('📦 Backing up existing room data...');
    const scanParams = {
      TableName: tableName,
    };
    const scanResult = await dynamodb.scan(scanParams).promise();
    const existingRooms = scanResult.Items || [];
    console.log(`✅ Backed up ${existingRooms.length} rooms`);

    // Delete the existing table
    try {
      console.log('🗑️  Deleting existing rooms table...');
      await dynamodb.deleteTable({ TableName: tableName }).promise();
      await dynamodb.waitFor('tableNotExists', { TableName: tableName }).promise();
      console.log('✅ Table deleted successfully');
    } catch (error) {
      if (error.code === 'ResourceNotFoundException') {
        console.log('ℹ️  Table does not exist, proceeding to create...');
      } else {
        throw error;
      }
    }

    // Create the table with the correct schema including VenueRoomsIndex
    const schema = {
      TableName: tableName,
      KeySchema: [
        { AttributeName: 'PK', KeyType: 'HASH' },
        { AttributeName: 'SK', KeyType: 'RANGE' },
      ],
      AttributeDefinitions: [
        { AttributeName: 'PK', AttributeType: 'S' },
        { AttributeName: 'SK', AttributeType: 'S' },
        { AttributeName: 'venueId', AttributeType: 'S' },
      ],
      GlobalSecondaryIndexes: [
        {
          IndexName: 'VenueRoomsIndex',
          KeySchema: [
            { AttributeName: 'venueId', KeyType: 'HASH' },
            { AttributeName: 'SK', KeyType: 'RANGE' },
          ],
          Projection: { ProjectionType: 'ALL' },
        },
      ],
      BillingMode: 'PAY_PER_REQUEST',
    };

    console.log('📝 Creating rooms table with VenueRoomsIndex...');
    await dynamodb.createTable(schema).promise();
    await dynamodb.waitFor('tableExists', { TableName: tableName }).promise();
    console.log('✅ Table created successfully with VenueRoomsIndex');

    // Restore the backed up data
    if (existingRooms.length > 0) {
      console.log('🔄 Restoring room data...');

      for (const room of existingRooms) {
        const putParams = {
          TableName: tableName,
          Item: room,
        };
        await dynamodb.putItem(putParams).promise();
      }
      console.log(`✅ Restored ${existingRooms.length} rooms`);
    }

    console.log('🎉 Rooms table fixed successfully!');

  } catch (error) {
    console.error('❌ Failed to fix rooms table:', error.message);
    process.exit(1);
  }
}

// Run the script
fixRoomsTable();
