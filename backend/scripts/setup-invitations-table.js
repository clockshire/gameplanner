/**
 * Setup Invitations Table Script
 * Creates the invitations table for event invite codes
 */

const AWS = require('aws-sdk');
const { invitationsTableSchema } = require('../src/schemas');

// Configure DynamoDB
const dynamodb = new AWS.DynamoDB({
  endpoint: 'http://localhost:8000',
  region: 'us-east-1',
  accessKeyId: 'dummy',
  secretAccessKey: 'dummy',
});

/**
 * Create the invitations table
 */
async function createInvitationsTable() {
  try {
    console.log('Creating invitations table...');

    const params = {
      TableName: invitationsTableSchema.TableName,
      KeySchema: invitationsTableSchema.KeySchema,
      AttributeDefinitions: invitationsTableSchema.AttributeDefinitions,
      GlobalSecondaryIndexes: invitationsTableSchema.GlobalSecondaryIndexes,
      BillingMode: invitationsTableSchema.BillingMode,
    };

    await dynamodb.createTable(params).promise();
    console.log('✅ Invitations table created successfully');

    // Wait for table to be active
    console.log('Waiting for table to become active...');
    await dynamodb
      .waitFor('tableExists', { TableName: 'invitations' })
      .promise();
    console.log('✅ Invitations table is now active');
  } catch (error) {
    if (error.code === 'ResourceInUseException') {
      console.log('ℹ️  Invitations table already exists');
    } else {
      console.error('❌ Error creating invitations table:', error);
      throw error;
    }
  }
}

/**
 * Verify the invitations table exists and is accessible
 */
async function verifyTable() {
  try {
    console.log('Verifying invitations table...');

    const params = {
      TableName: 'invitations',
    };

    const result = await dynamodb.describeTable(params).promise();
    console.log('✅ Invitations table verification successful');
    console.log(`   Table status: ${result.Table.TableStatus}`);
    console.log(`   Item count: ${result.Table.ItemCount}`);

    return true;
  } catch (error) {
    console.error('❌ Error verifying invitations table:', error);
    return false;
  }
}

/**
 * Main function
 */
async function main() {
  try {
    console.log('🎯 Setting up Invitations Table');
    console.log('=' * 50);

    await createInvitationsTable();
    await verifyTable();

    console.log('=' * 50);
    console.log('✅ Invitations table setup complete!');
  } catch (error) {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = {
  createInvitationsTable,
  verifyTable,
};
