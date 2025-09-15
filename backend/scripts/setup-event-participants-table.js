/**
 * Setup Event Participants Table
 * Creates the eventParticipants table in DynamoDB
 */

const AWS = require('aws-sdk');
const { eventParticipantsTableSchema } = require('../src/schemas');
const { createTableIfNotExists } = require('../src/dynamodb');

async function setupEventParticipantsTable() {
  console.log('🎯 Setting up Event Participants Table');
  console.log('Creating event participants table...');

  const tableCreated = await createTableIfNotExists(
    'eventParticipants',
    eventParticipantsTableSchema
  );

  if (tableCreated) {
    console.log('✅ Event participants table created successfully');
  } else {
    console.log('⚠️ Event participants table already exists or failed to create');
  }

  console.log('Waiting for table to become active...');
  const dynamodb = new AWS.DynamoDB({
    endpoint: 'http://localhost:8000',
    region: 'us-east-1',
  });

  await dynamodb
    .waitFor('tableExists', { TableName: 'eventParticipants' })
    .promise();
  console.log('✅ Event participants table is now active');

  console.log('Verifying event participants table...');
  const describeTable = await dynamodb
    .describeTable({ TableName: 'eventParticipants' })
    .promise();
  const tableStatus = describeTable.Table.TableStatus;
  const itemCount = describeTable.Table.ItemCount;

  console.log(`✅ Event participants table verification successful`);
  console.log(`   Table status: ${tableStatus}`);
  console.log(`   Item count: ${itemCount}`);

  console.log('✅ Event participants table setup complete!');
}

if (require.main === module) {
  setupEventParticipantsTable().catch((error) => {
    console.error('❌ Error setting up event participants table:', error);
    process.exit(1);
  });
}

module.exports = { setupEventParticipantsTable };
