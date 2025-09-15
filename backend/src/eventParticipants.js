/**
 * Event Participants Service
 * Manages event participant tracking and management
 */

const AWS = require('aws-sdk');

const dynamodb = new AWS.DynamoDB.DocumentClient({
  endpoint: process.env.DYNAMODB_ENDPOINT || 'http://localhost:8000',
  region: process.env.AWS_REGION || 'us-east-1',
});

class EventParticipantsService {
  constructor() {
    this.tableName = 'eventParticipants';
  }

  /**
   * Add a participant to an event
   * @param {string} eventId - Event ID
   * @param {string} userId - User ID
   * @param {string} userName - User name
   * @param {string} userEmail - User email
   * @param {string} [inviteCode] - Optional invite code used
   * @returns {Promise<Object>} Result of adding participant
   */
  async addParticipant(
    eventId,
    userId,
    userName,
    userEmail,
    inviteCode = null
  ) {
    try {
      const now = new Date().toISOString();

      const participant = {
        PK: `EVENT#${eventId}`,
        SK: `USER#${userId}`,
        entityType: 'EVENT_PARTICIPANT',
        eventId,
        userId,
        userName,
        userEmail,
        inviteCode,
        joinedAt: now,
        createdAt: now,
        updatedAt: now,
      };

      const params = {
        TableName: this.tableName,
        Item: participant,
        ConditionExpression:
          'attribute_not_exists(PK) AND attribute_not_exists(SK)', // Prevent duplicates
      };

      await dynamodb.put(params).promise();

      return {
        success: true,
        data: participant,
        message: 'Participant added successfully',
      };
    } catch (error) {
      if (error.code === 'ConditionalCheckFailedException') {
        return {
          success: false,
          error: 'User already joined this event',
          message: 'User is already a participant in this event',
          code: 'ALREADY_PARTICIPANT',
        };
      }
      console.error('Error adding participant:', error);
      return {
        success: false,
        error: error.message,
        message: 'Failed to add participant',
      };
    }
  }

  /**
   * Remove a participant from an event
   * @param {string} eventId - Event ID
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Result of removing participant
   */
  async removeParticipant(eventId, userId) {
    try {
      const params = {
        TableName: this.tableName,
        Key: {
          PK: `EVENT#${eventId}`,
          SK: `USER#${userId}`,
        },
      };

      await dynamodb.delete(params).promise();

      return {
        success: true,
        message: 'Participant removed successfully',
      };
    } catch (error) {
      console.error('Error removing participant:', error);
      return {
        success: false,
        error: error.message,
        message: 'Failed to remove participant',
      };
    }
  }

  /**
   * Get all participants for an event
   * @param {string} eventId - Event ID
   * @returns {Promise<Object>} List of participants
   */
  async getEventParticipants(eventId) {
    try {
      const params = {
        TableName: this.tableName,
        IndexName: 'EventParticipantsIndex',
        KeyConditionExpression: 'eventId = :eventId',
        ExpressionAttributeValues: {
          ':eventId': eventId,
        },
      };

      const result = await dynamodb.query(params).promise();

      return {
        success: true,
        data: result.Items || [],
        message: 'Event participants retrieved successfully',
      };
    } catch (error) {
      console.error('Error getting event participants:', error);
      return {
        success: false,
        error: error.message,
        message: 'Failed to retrieve event participants',
      };
    }
  }

  /**
   * Get all events a user has joined
   * @param {string} userId - User ID
   * @returns {Promise<Object>} List of events user has joined
   */
  async getUserEvents(userId) {
    try {
      const params = {
        TableName: this.tableName,
        IndexName: 'UserEventsIndex',
        KeyConditionExpression: 'userId = :userId',
        ExpressionAttributeValues: {
          ':userId': userId,
        },
      };

      const result = await dynamodb.query(params).promise();

      return {
        success: true,
        data: result.Items || [],
        message: 'User events retrieved successfully',
      };
    } catch (error) {
      console.error('Error getting user events:', error);
      return {
        success: false,
        error: error.message,
        message: 'Failed to retrieve user events',
      };
    }
  }

  /**
   * Check if a user is a participant in an event
   * @param {string} eventId - Event ID
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Participant status
   */
  async isParticipant(eventId, userId) {
    try {
      const params = {
        TableName: this.tableName,
        Key: {
          PK: `EVENT#${eventId}`,
          SK: `USER#${userId}`,
        },
      };

      const result = await dynamodb.get(params).promise();

      return {
        success: true,
        isParticipant: !!result.Item,
        data: result.Item || null,
        message: result.Item
          ? 'User is a participant'
          : 'User is not a participant',
      };
    } catch (error) {
      console.error('Error checking participant status:', error);
      return {
        success: false,
        error: error.message,
        message: 'Failed to check participant status',
      };
    }
  }

  /**
   * Get participant count for an event
   * @param {string} eventId - Event ID
   * @returns {Promise<Object>} Participant count
   */
  async getParticipantCount(eventId) {
    try {
      const params = {
        TableName: this.tableName,
        IndexName: 'EventParticipantsIndex',
        KeyConditionExpression: 'eventId = :eventId',
        ExpressionAttributeValues: {
          ':eventId': eventId,
        },
        Select: 'COUNT',
      };

      const result = await dynamodb.query(params).promise();

      return {
        success: true,
        count: result.Count || 0,
        message: 'Participant count retrieved successfully',
      };
    } catch (error) {
      console.error('Error getting participant count:', error);
      return {
        success: false,
        error: error.message,
        message: 'Failed to retrieve participant count',
      };
    }
  }

  /**
   * Get all event participants (for cleanup purposes)
   * @returns {Promise<Object>} All event participants
   */
  async getAllEventParticipants() {
    try {
      const params = {
        TableName: this.tableName,
      };

      const result = await dynamodb.scan(params).promise();

      return {
        success: true,
        data: result.Items || [],
        message: 'Event participants retrieved successfully',
      };
    } catch (error) {
      console.error('Error getting all event participants:', error);
      return {
        success: false,
        error: error.message,
        message: 'Failed to get event participants',
      };
    }
  }
}

module.exports = EventParticipantsService;
