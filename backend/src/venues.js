/**
 * Venue Service
 * Handles venue management operations for the Game Planner application
 */

const { dynamodb } = require('./dynamodb');
const { v4: uuidv4 } = require('uuid');

/**
 * Venue Service class
 * Provides CRUD operations for venues
 */
class VenueService {
  constructor() {
    this.tableName = 'venues';
  }

  /**
   * Create a new venue
   * @param {Object} venueData - Venue data
   * @param {string} venueData.name - Venue name
   * @param {string} venueData.description - Venue description
   * @param {string} venueData.address - Venue address
   * @param {string} venueData.contactInfo - Contact information
   * @param {number} venueData.capacity - Maximum capacity
   * @returns {Promise<Object>} Created venue
   */
  async createVenue(venueData) {
    try {
      const venueId = uuidv4();
      const now = new Date().toISOString();

      const venue = {
        PK: `VENUE#${venueId}`,
        SK: `VENUE#${venueId}`,
        venueId,
        venueName: venueData.name,
        description: venueData.description || '',
        address: venueData.address || '',
        contactInfo: venueData.contactInfo || '',
        capacity: venueData.capacity || 0,
        createdAt: now,
        updatedAt: now,
        entityType: 'VENUE',
      };

      const params = {
        TableName: this.tableName,
        Item: venue,
        ConditionExpression: 'attribute_not_exists(PK)',
      };

      await dynamodb.put(params).promise();

      return {
        success: true,
        data: venue,
        message: 'Venue created successfully',
      };
    } catch (error) {
      console.error('Error creating venue:', error);
      return {
        success: false,
        error: error.message,
        message: 'Failed to create venue',
      };
    }
  }

  /**
   * Get a venue by ID
   * @param {string} venueId - Venue ID
   * @returns {Promise<Object>} Venue data
   */
  async getVenue(venueId) {
    try {
      const params = {
        TableName: this.tableName,
        Key: {
          PK: `VENUE#${venueId}`,
          SK: `VENUE#${venueId}`,
        },
      };

      const result = await dynamodb.get(params).promise();

      if (!result.Item) {
        return {
          success: false,
          error: 'Venue not found',
          message: 'Venue not found',
        };
      }

      return {
        success: true,
        data: result.Item,
        message: 'Venue retrieved successfully',
      };
    } catch (error) {
      console.error('Error getting venue:', error);
      return {
        success: false,
        error: error.message,
        message: 'Failed to get venue',
      };
    }
  }

  /**
   * Get all venues
   * @returns {Promise<Object>} List of venues
   */
  async getAllVenues() {
    try {
      const params = {
        TableName: this.tableName,
        FilterExpression: 'entityType = :entityType',
        ExpressionAttributeValues: {
          ':entityType': 'VENUE',
        },
      };

      const result = await dynamodb.scan(params).promise();

      return {
        success: true,
        data: result.Items || [],
        message: 'Venues retrieved successfully',
      };
    } catch (error) {
      console.error('Error getting all venues:', error);
      return {
        success: false,
        error: error.message,
        message: 'Failed to get venues',
      };
    }
  }

  /**
   * Update a venue
   * @param {string} venueId - Venue ID
   * @param {Object} updateData - Updated venue data
   * @returns {Promise<Object>} Updated venue
   */
  async updateVenue(venueId, updateData) {
    try {
      const now = new Date().toISOString();

      // Build update expression dynamically
      const updateExpressions = [];
      const expressionAttributeNames = {};
      const expressionAttributeValues = {};

      Object.keys(updateData).forEach((key, index) => {
        if (key !== 'venueId' && key !== 'createdAt') {
          const nameKey = `#${key}${index}`;
          const valueKey = `:${key}${index}`;

          updateExpressions.push(`${nameKey} = ${valueKey}`);
          expressionAttributeNames[nameKey] = key;
          expressionAttributeValues[valueKey] = updateData[key];
        }
      });

      updateExpressions.push('#updatedAt = :updatedAt');
      expressionAttributeNames['#updatedAt'] = 'updatedAt';
      expressionAttributeValues[':updatedAt'] = now;

      const params = {
        TableName: this.tableName,
        Key: {
          PK: `VENUE#${venueId}`,
          SK: `VENUE#${venueId}`,
        },
        UpdateExpression: `SET ${updateExpressions.join(', ')}`,
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: expressionAttributeValues,
        ConditionExpression: 'attribute_exists(PK)',
        ReturnValues: 'ALL_NEW',
      };

      const result = await dynamodb.update(params).promise();

      return {
        success: true,
        data: result.Attributes,
        message: 'Venue updated successfully',
      };
    } catch (error) {
      console.error('Error updating venue:', error);
      return {
        success: false,
        error: error.message,
        message: 'Failed to update venue',
      };
    }
  }

  /**
   * Delete a venue
   * @param {string} venueId - Venue ID
   * @returns {Promise<Object>} Deletion result
   */
  async deleteVenue(venueId) {
    try {
      const params = {
        TableName: this.tableName,
        Key: {
          PK: `VENUE#${venueId}`,
          SK: `VENUE#${venueId}`,
        },
        ConditionExpression: 'attribute_exists(PK)',
      };

      await dynamodb.delete(params).promise();

      return {
        success: true,
        message: 'Venue deleted successfully',
      };
    } catch (error) {
      console.error('Error deleting venue:', error);
      return {
        success: false,
        error: error.message,
        message: 'Failed to delete venue',
      };
    }
  }

  /**
   * Get rooms for a specific venue
   * @param {string} venueId - Venue ID
   * @returns {Promise<Object>} List of rooms in the venue
   */
  async getVenueRooms(venueId) {
    try {
      const params = {
        TableName: 'rooms',
        IndexName: 'VenueRoomsIndex',
        KeyConditionExpression: 'venueId = :venueId',
        ExpressionAttributeValues: {
          ':venueId': venueId,
        },
      };

      const result = await dynamodb.query(params).promise();

      return {
        success: true,
        data: result.Items || [],
        message: 'Venue rooms retrieved successfully',
      };
    } catch (error) {
      console.error('Error getting venue rooms:', error);
      return {
        success: false,
        error: error.message,
        message: 'Failed to get venue rooms',
      };
    }
  }
}

module.exports = VenueService;
