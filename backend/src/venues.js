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
   * @param {string} venueData.contactPhone - Contact phone number
   * @param {string} venueData.contactEmail - Contact email address
   * @param {string} venueData.websiteURL - Website URL
   * @param {number} venueData.capacity - Maximum capacity
   * @param {string} venueData.mapLink - Optional map link (e.g., Google Maps)
   * @param {string} createdBy - User ID of the creator
   * @returns {Promise<Object>} Created venue
   */
  async createVenue(venueData, createdBy) {
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
        contactPhone: venueData.contactPhone || null,
        contactEmail: venueData.contactEmail || null,
        websiteURL: venueData.websiteURL || null,
        capacity: venueData.capacity || 0,
        mapLink: venueData.mapLink || null,
        createdBy: createdBy,
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
   * Check if a user owns a venue
   * @param {string} venueId - Venue ID
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Ownership check result
   */
  async checkVenueOwnership(venueId, userId) {
    try {
      const venueResult = await this.getVenue(venueId);

      if (!venueResult.success) {
        return {
          success: false,
          ownsVenue: false,
          error: venueResult.error,
          message: venueResult.message,
        };
      }

      const venue = venueResult.data;
      const ownsVenue = venue.createdBy === userId;

      return {
        success: true,
        ownsVenue: ownsVenue,
        message: ownsVenue ? 'User owns venue' : 'User does not own venue',
      };
    } catch (error) {
      console.error('Error checking venue ownership:', error);
      return {
        success: false,
        ownsVenue: false,
        error: error.message,
        message: 'Failed to check venue ownership',
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
   * Get all venues for a specific user
   * @param {string} userId - User ID to filter venues by
   * @returns {Promise<Object>} List of venues
   */
  async getAllVenues(userId) {
    try {
      const params = {
        TableName: this.tableName,
        FilterExpression: 'entityType = :entityType AND createdBy = :userId',
        ExpressionAttributeValues: {
          ':entityType': 'VENUE',
          ':userId': userId,
        },
      };

      const result = await dynamodb.scan(params).promise();

      // Sort venues alphabetically by name
      const sortedVenues = (result.Items || []).sort((a, b) => {
        return a.venueName.localeCompare(b.venueName);
      });

      return {
        success: true,
        data: sortedVenues,
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
   * Check if venue is referenced by any events
   * @param {string} venueId - Venue ID
   * @returns {Promise<Object>} Validation result with event details
   */
  async checkVenueEventReferences(venueId) {
    try {
      const params = {
        TableName: 'events',
        FilterExpression: 'venueId = :venueId',
        ExpressionAttributeValues: {
          ':venueId': venueId,
        },
      };

      const result = await dynamodb.scan(params).promise();
      const events = result.Items || [];

      return {
        success: true,
        hasReferences: events.length > 0,
        events: events,
        message:
          events.length > 0
            ? `Venue is referenced by ${events.length} event(s)`
            : 'No event references found',
      };
    } catch (error) {
      console.error('Error checking venue event references:', error);
      return {
        success: false,
        hasReferences: false,
        events: [],
        error: error.message,
        message: 'Failed to check event references',
      };
    }
  }

  /**
   * Delete all rooms associated with a venue
   * @param {string} venueId - Venue ID
   * @returns {Promise<Object>} Deletion result with room details
   */
  async deleteVenueRooms(venueId) {
    try {
      // Get all rooms for this venue
      const roomsResult = await this.getVenueRooms(venueId);

      if (!roomsResult.success) {
        return {
          success: false,
          error: roomsResult.error,
          message: 'Failed to get venue rooms',
        };
      }

      const rooms = roomsResult.data;
      const deletedRooms = [];

      // Delete each room
      for (const room of rooms) {
        try {
          const deleteParams = {
            TableName: 'rooms',
            Key: {
              PK: room.PK,
              SK: room.SK,
            },
            ConditionExpression: 'attribute_exists(PK)',
          };

          await dynamodb.delete(deleteParams).promise();
          deletedRooms.push({
            roomId: room.roomId,
            roomName: room.roomName,
          });
        } catch (error) {
          console.error(`Error deleting room ${room.roomId}:`, error);
          // Continue with other rooms even if one fails
        }
      }

      return {
        success: true,
        deletedRooms: deletedRooms,
        message: `Successfully deleted ${deletedRooms.length} room(s)`,
      };
    } catch (error) {
      console.error('Error deleting venue rooms:', error);
      return {
        success: false,
        error: error.message,
        message: 'Failed to delete venue rooms',
      };
    }
  }

  /**
   * Delete a venue with proper validation and cascading deletes
   * @param {string} venueId - Venue ID
   * @param {boolean} forceDelete - Whether to force delete even with event references
   * @returns {Promise<Object>} Deletion result
   */
  async deleteVenue(venueId, forceDelete = false) {
    try {
      // First, check if venue exists
      const venueResult = await this.getVenue(venueId);
      if (!venueResult.success) {
        return {
          success: false,
          error: 'Venue not found',
          message: 'Venue not found',
        };
      }

      // Check for event references
      const eventCheck = await this.checkVenueEventReferences(venueId);
      if (!eventCheck.success) {
        return {
          success: false,
          error: eventCheck.error,
          message: 'Failed to validate venue references',
        };
      }

      // If venue has event references and not forcing delete, block deletion
      if (eventCheck.hasReferences && !forceDelete) {
        const eventNames = eventCheck.events
          .map((event) => event.eventName)
          .join(', ');
        return {
          success: false,
          error: 'VENUE_HAS_EVENT_REFERENCES',
          message: `Cannot delete venue. It is referenced by the following event(s): ${eventNames}`,
          events: eventCheck.events,
        };
      }

      // Get venue rooms for reporting
      const roomsResult = await this.getVenueRooms(venueId);
      const rooms = roomsResult.success ? roomsResult.data : [];

      // Delete associated rooms first
      if (rooms.length > 0) {
        const roomsDeleteResult = await this.deleteVenueRooms(venueId);
        if (!roomsDeleteResult.success) {
          return {
            success: false,
            error: roomsDeleteResult.error,
            message: 'Failed to delete associated rooms',
          };
        }
      }

      // Finally, delete the venue itself
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
        deletedRooms: rooms.map((room) => ({
          roomId: room.roomId,
          roomName: room.roomName,
        })),
        deletedRoomsCount: rooms.length,
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

  /**
   * Get all venues for cleanup purposes (no user filtering)
   * @returns {Promise<Object>} All venues
   */
  async getAllVenuesForCleanup() {
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
        message: 'All venues retrieved successfully',
      };
    } catch (error) {
      console.error('Error getting all venues for cleanup:', error);
      return {
        success: false,
        error: error.message,
        message: 'Failed to get venues for cleanup',
      };
    }
  }
}

module.exports = VenueService;
