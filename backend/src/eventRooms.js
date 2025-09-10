const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');

// Configure AWS
AWS.config.update({
  region: process.env.AWS_REGION || 'us-east-1',
  endpoint: process.env.DYNAMODB_ENDPOINT || 'http://localhost:8000',
});

const dynamodb = new AWS.DynamoDB.DocumentClient();
const tableName = 'users';

/**
 * Event Rooms Service
 * Handles event-specific room management
 */
class EventRoomService {
  constructor() {
    this.tableName = tableName;
  }

  /**
   * Get all rooms for a specific event
   * @param {string} eventId - Event ID
   * @returns {Promise<Object>} List of event rooms
   */
  async getEventRooms(eventId) {
    try {
      const params = {
        TableName: this.tableName,
        IndexName: 'EventIdIndex',
        KeyConditionExpression: 'eventId = :eventId',
        FilterExpression: 'entityType = :entityType',
        ExpressionAttributeValues: {
          ':eventId': eventId,
          ':entityType': 'EVENT_ROOM',
        },
      };

      const result = await dynamodb.query(params).promise();

      return {
        success: true,
        data: result.Items || [],
        message: 'Event rooms retrieved successfully',
      };
    } catch (error) {
      console.error('Error getting event rooms:', error);
      return {
        success: false,
        error: error.message,
        message: 'Failed to get event rooms',
      };
    }
  }

  /**
   * Assign a room to a specific event
   * @param {Object} roomData - Room assignment data
   * @returns {Promise<Object>} Assigned room
   */
  async createEventRoom(roomData) {
    try {
      const now = new Date().toISOString();

      const room = {
        PK: `EVENT#${roomData.eventId}`,
        SK: `ROOM#${roomData.roomId}`,
        entityType: 'EVENT_ROOM',
        roomId: roomData.roomId,
        eventId: roomData.eventId,
        roomName: roomData.roomName,
        capacity: roomData.capacity,
        description: roomData.description,
        availableTimes: roomData.availableTimes || [],
        createdBy: roomData.createdBy,
        createdAt: now,
        updatedAt: now,
      };

      const params = {
        TableName: this.tableName,
        Item: room,
      };

      await dynamodb.put(params).promise();

      return {
        success: true,
        data: room,
        message: 'Room assigned to event successfully',
      };
    } catch (error) {
      console.error('Error assigning room to event:', error);
      return {
        success: false,
        error: error.message,
        message: 'Failed to assign room to event',
      };
    }
  }

  /**
   * Delete a room from a specific event
   * @param {string} eventId - Event ID
   * @param {string} roomId - Room ID
   * @returns {Promise<Object>} Deletion result
   */
  async deleteEventRoom(eventId, roomId) {
    try {
      const params = {
        TableName: this.tableName,
        Key: {
          PK: `EVENT#${eventId}`,
          SK: `ROOM#${roomId}`,
        },
        ConditionExpression: 'attribute_exists(PK)',
      };

      await dynamodb.delete(params).promise();

      return {
        success: true,
        message: 'Event room deleted successfully',
      };
    } catch (error) {
      console.error('Error deleting event room:', error);
      return {
        success: false,
        error: error.message,
        message: 'Failed to delete event room',
      };
    }
  }

  /**
   * Update all room assignments for an event
   * @param {string} eventId - Event ID
   * @param {Array} rooms - Array of room assignments
   * @returns {Promise<Object>} Update result
   */
  async updateEventRooms(eventId, rooms) {
    try {
      // First clear all existing room assignments
      await this.clearEventRooms(eventId);

      // Then create new room assignments
      const createPromises = rooms.map((room) =>
        this.createEventRoom({
          eventId,
          roomId: room.roomId,
          roomName: room.roomName,
          capacity: room.capacity,
          description: room.description,
          availableTimes: room.availableTimes || [],
          createdBy: room.createdBy,
        })
      );

      const results = await Promise.all(createPromises);

      // Check if any creation failed
      const failed = results.filter((result) => !result.success);
      if (failed.length > 0) {
        return {
          success: false,
          error: 'Some room assignments failed',
          message: `Failed to assign ${failed.length} rooms`,
        };
      }

      return {
        success: true,
        data: results.map((result) => result.data),
        message: `Successfully assigned ${rooms.length} rooms to event`,
      };
    } catch (error) {
      console.error('Error updating event rooms:', error);
      return {
        success: false,
        error: error.message,
        message: 'Failed to update event rooms',
      };
    }
  }

  /**
   * Clear all room assignments for an event
   * @param {string} eventId - Event ID
   * @returns {Promise<Object>} Clear result
   */
  async clearEventRooms(eventId) {
    try {
      // First get all room assignments for this event
      const rooms = await this.getEventRooms(eventId);

      if (!rooms.success) {
        return rooms;
      }

      // Delete each room assignment
      const deletePromises = rooms.data.map((room) =>
        this.deleteEventRoom(eventId, room.roomId)
      );

      await Promise.all(deletePromises);

      return {
        success: true,
        message: 'All room assignments cleared successfully',
      };
    } catch (error) {
      console.error('Error clearing event rooms:', error);
      return {
        success: false,
        error: error.message,
        message: 'Failed to clear event rooms',
      };
    }
  }
}

module.exports = new EventRoomService();
