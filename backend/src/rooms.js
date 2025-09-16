/**
 * Room Service
 * Handles room management operations for the Game Planner application
 */

const { dynamodb } = require('./dynamodb');
const { v4: uuidv4 } = require('uuid');

/**
 * Room Service class
 * Provides CRUD operations for rooms
 */
class RoomService {
  constructor() {
    this.tableName = 'rooms';
  }

  /**
   * Create a new room
   * @param {Object} roomData - Room data
   * @param {string} roomData.name - Room name
   * @param {string} roomData.description - Room description
   * @param {string} roomData.venueId - Associated venue ID
   * @param {number} roomData.capacity - Maximum capacity
   * @param {string} roomData.roomType - Type of room (e.g., 'conference', 'meeting', 'gaming')
   * @param {Object} roomData.amenities - Room amenities
   * @param {string} createdBy - User ID of the creator
   * @returns {Promise<Object>} Created room
   */
  async createRoom(roomData, createdBy) {
    try {
      const roomId = uuidv4();
      const now = new Date().toISOString();

      const room = {
        PK: `ROOM#${roomId}`,
        SK: `ROOM#${roomId}`,
        roomId,
        roomName: roomData.name,
        description: roomData.description || '',
        venueId: roomData.venueId,
        capacity: roomData.capacity || 0,
        roomType: roomData.roomType || 'general',
        amenities: roomData.amenities || {},
        createdBy: createdBy,
        createdAt: now,
        updatedAt: now,
        entityType: 'ROOM',
      };

      const params = {
        TableName: this.tableName,
        Item: room,
        ConditionExpression: 'attribute_not_exists(PK)',
      };

      await dynamodb.put(params).promise();

      // Update venue capacity after room creation
      try {
        const VenueService = require('./venues');
        const venueService = new VenueService();
        await venueService.updateVenueCapacity(roomData.venueId);
      } catch (error) {
        console.warn(
          'Failed to update venue capacity after room creation:',
          error
        );
        // Don't fail room creation if capacity update fails
      }

      return {
        success: true,
        data: room,
        message: 'Room created successfully',
      };
    } catch (error) {
      console.error('Error creating room:', error);
      return {
        success: false,
        error: error.message,
        message: 'Failed to create room',
      };
    }
  }

  /**
   * Get a room by ID
   * @param {string} roomId - Room ID
   * @returns {Promise<Object>} Room data
   */
  async getRoom(roomId) {
    try {
      const params = {
        TableName: this.tableName,
        Key: {
          PK: `ROOM#${roomId}`,
          SK: `ROOM#${roomId}`,
        },
      };

      const result = await dynamodb.get(params).promise();

      if (!result.Item) {
        return {
          success: false,
          error: 'Room not found',
          message: 'Room not found',
        };
      }

      return {
        success: true,
        data: result.Item,
        message: 'Room retrieved successfully',
      };
    } catch (error) {
      console.error('Error getting room:', error);
      return {
        success: false,
        error: error.message,
        message: 'Failed to get room',
      };
    }
  }

  /**
   * Get all rooms for a specific venue
   * @param {string} venueId - Venue ID
   * @returns {Promise<Object>} List of rooms
   */
  async getVenueRooms(venueId) {
    try {
      const params = {
        TableName: this.tableName,
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
   * Update a room
   * @param {string} roomId - Room ID
   * @param {Object} updateData - Updated room data
   * @returns {Promise<Object>} Updated room
   */
  async updateRoom(roomId, updateData) {
    try {
      const now = new Date().toISOString();

      // Build update expression dynamically
      const updateExpressions = [];
      const expressionAttributeNames = {};
      const expressionAttributeValues = {};

      Object.keys(updateData).forEach((key, index) => {
        if (key !== 'roomId' && key !== 'createdAt') {
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
          PK: `ROOM#${roomId}`,
          SK: `ROOM#${roomId}`,
        },
        UpdateExpression: `SET ${updateExpressions.join(', ')}`,
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: expressionAttributeValues,
        ConditionExpression: 'attribute_exists(PK)',
        ReturnValues: 'ALL_NEW',
      };

      const result = await dynamodb.update(params).promise();

      // Update venue capacity after room update
      try {
        const VenueService = require('./venues');
        const venueService = new VenueService();
        await venueService.updateVenueCapacity(result.Attributes.venueId);
      } catch (error) {
        console.warn(
          'Failed to update venue capacity after room update:',
          error
        );
        // Don't fail room update if capacity update fails
      }

      return {
        success: true,
        data: result.Attributes,
        message: 'Room updated successfully',
      };
    } catch (error) {
      console.error('Error updating room:', error);
      return {
        success: false,
        error: error.message,
        message: 'Failed to update room',
      };
    }
  }

  /**
   * Delete a room
   * @param {string} roomId - Room ID
   * @returns {Promise<Object>} Deletion result
   */
  async deleteRoom(roomId) {
    try {
      // First get the room to retrieve venueId before deletion
      const roomResult = await this.getRoom(roomId);
      if (!roomResult.success) {
        return {
          success: false,
          error: 'Room not found',
          message: 'Failed to delete room - room not found',
        };
      }

      const venueId = roomResult.data.venueId;

      const params = {
        TableName: this.tableName,
        Key: {
          PK: `ROOM#${roomId}`,
          SK: `ROOM#${roomId}`,
        },
        ConditionExpression: 'attribute_exists(PK)',
      };

      await dynamodb.delete(params).promise();

      // Update venue capacity after room deletion
      try {
        const VenueService = require('./venues');
        const venueService = new VenueService();
        await venueService.updateVenueCapacity(venueId);
      } catch (error) {
        console.warn(
          'Failed to update venue capacity after room deletion:',
          error
        );
        // Don't fail room deletion if capacity update fails
      }

      return {
        success: true,
        message: 'Room deleted successfully',
      };
    } catch (error) {
      console.error('Error deleting room:', error);
      return {
        success: false,
        error: error.message,
        message: 'Failed to delete room',
      };
    }
  }

  /**
   * Get all rooms
   * @returns {Promise<Object>} All rooms
   */
  async getAllRooms() {
    try {
      const params = {
        TableName: this.tableName,
        FilterExpression: 'entityType = :entityType',
        ExpressionAttributeValues: {
          ':entityType': 'ROOM',
        },
      };

      const result = await dynamodb.scan(params).promise();

      return {
        success: true,
        data: result.Items || [],
        message: 'Rooms retrieved successfully',
      };
    } catch (error) {
      console.error('Error getting all rooms:', error);
      return {
        success: false,
        error: error.message,
        message: 'Failed to get rooms',
      };
    }
  }
}

module.exports = RoomService;
