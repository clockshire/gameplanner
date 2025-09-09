#!/usr/bin/env node

/**
 * Setup script for local DynamoDB development environment
 * Creates all necessary tables and tests the connection
 */

const { testConnection, createTableIfNotExists } = require('../src/dynamodb');
const schemas = require('../src/schemas');

/**
 * Main setup function
 */
async function setupLocalEnvironment() {
  console.log('🚀 Setting up local DynamoDB environment...\n');

  // Test connection first
  console.log('1. Testing DynamoDB connection...');
  const connectionOk = await testConnection();
  if (!connectionOk) {
    console.error(
      "❌ Cannot connect to DynamoDB Local. Make sure it's running on localhost:8000"
    );
    process.exit(1);
  }

  // Create tables
  const tables = [
    { name: 'users', schema: schemas.usersTableSchema },
    { name: 'events', schema: schemas.eventsTableSchema },
    { name: 'venues', schema: schemas.venuesTableSchema },
    { name: 'rooms', schema: schemas.roomsTableSchema },
    { name: 'games', schema: schemas.gamesTableSchema },
    { name: 'bookings', schema: schemas.bookingsTableSchema },
  ];

  console.log('\n2. Creating tables...');
  for (const table of tables) {
    await createTableIfNotExists(table.name, table.schema);
  }

  console.log('\n✅ Local DynamoDB environment setup complete!');
  console.log('\n📋 Available tables:');
  tables.forEach((table) => {
    console.log(`   - ${table.name}`);
  });

  console.log('\n🔗 DynamoDB Local is running on: http://localhost:8000');
  console.log(
    '📖 You can use the AWS CLI or DynamoDB console to interact with it.'
  );
}

// Run setup if this script is executed directly
if (require.main === module) {
  setupLocalEnvironment().catch((error) => {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  });
}

module.exports = { setupLocalEnvironment };
