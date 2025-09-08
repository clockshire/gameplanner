/**
 * DynamoDB client configuration for Game Planner application
 * Handles local development and production environments
 */

const AWS = require('aws-sdk');
const config = require('../config/environment');

/**
 * Configure AWS SDK based on environment
 */
function configureAWS() {
  if (config.dynamodb.endpoint) {
    // Local development with DynamoDB Local
    AWS.config.update({
      accessKeyId: config.dynamodb.accessKeyId,
      secretAccessKey: config.dynamodb.secretAccessKey,
      region: config.dynamodb.region,
      endpoint: config.dynamodb.endpoint,
    });
  } else {
    // Production environment
    AWS.config.update({
      region: config.dynamodb.region,
    });
  }
}

// Configure AWS
configureAWS();

/**
 * DynamoDB client instance
 */
const dynamodb = new AWS.DynamoDB.DocumentClient();

/**
 * Test DynamoDB connection
 * @returns {Promise<boolean>} True if connection is successful
 */
async function testConnection() {
  try {
    // Try to list tables to test connection
    const dynamodbService = new AWS.DynamoDB();
    await dynamodbService.listTables().promise();
    console.log('✅ DynamoDB connection successful');
    return true;
  } catch (error) {
    console.error('❌ DynamoDB connection failed:', error.message);
    return false;
  }
}

/**
 * Create a table if it doesn't exist
 * @param {string} tableName - Name of the table to create
 * @param {Object} schema - Table schema definition
 * @returns {Promise<boolean>} True if table was created or already exists
 */
async function createTableIfNotExists(tableName, schema) {
  try {
    const dynamodbService = new AWS.DynamoDB();

    // Check if table exists
    try {
      await dynamodbService.describeTable({ TableName: tableName }).promise();
      console.log(`✅ Table ${tableName} already exists`);
      return true;
    } catch (error) {
      if (error.code === 'ResourceNotFoundException') {
        // Table doesn't exist, create it
        console.log(`📝 Creating table ${tableName}...`);
        await dynamodbService.createTable(schema).promise();

        // Wait for table to be active
        await dynamodbService
          .waitFor('tableExists', { TableName: tableName })
          .promise();
        console.log(`✅ Table ${tableName} created successfully`);
        return true;
      }
      throw error;
    }
  } catch (error) {
    console.error(`❌ Failed to create table ${tableName}:`, error.message);
    return false;
  }
}

module.exports = {
  dynamodb,
  testConnection,
  createTableIfNotExists,
};
