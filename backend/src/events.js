/**
 * Event Service
 * Handles event management operations for the Game Planner application
 */

const { dynamodb } = require('./dynamodb');
const { v4: uuidv4 } = require('uuid');

/**
 * Event Service class
 * Provides CRUD operations for events
 */
class EventService {
  constructor() {
    this.tableName = 'events';
  }

  /**
   * Create a new event
   * @param {Object} eventData - Event data
   * @param {string} eventData.name - Event name
   * @param {string} eventData.description - Event description
   * @param {string} eventData.eventDate - Event date (ISO string)
   * @param {string} eventData.startTime - Event start time
   * @param {string} eventData.endTime - Event end time
   * @param {string} eventData.venueId - Associated venue ID
   * @param {number} eventData.maxParticipants - Maximum participants
   * @returns {Promise<Object>} Created event
   */
  async createEvent(eventData) {
    try {
      const eventId = uuidv4();
      const now = new Date().toISOString();

      const event = {
        PK: `EVENT#${eventId}`,
        SK: `EVENT#${eventId}`,
        eventId,
        eventName: eventData.name,
        description: eventData.description || '',
        eventDate: eventData.eventDate,
        startTime: eventData.startTime || '',
        endTime: eventData.endTime || '',
        venueId: eventData.venueId || null,
        maxParticipants: eventData.maxParticipants || 0,
        currentParticipants: 0,
        status: 'active',
        createdAt: now,
        updatedAt: now,
        entityType: 'EVENT',
      };

      const params = {
        TableName: this.tableName,
        Item: event,
        ConditionExpression: 'attribute_not_exists(PK)',
      };

      await dynamodb.put(params).promise();

      return {
        success: true,
        data: event,
        message: 'Event created successfully',
      };
    } catch (error) {
      console.error('Error creating event:', error);
      return {
        success: false,
        error: error.message,
        message: 'Failed to create event',
      };
    }
  }

  /**
   * Get an event by ID
   * @param {string} eventId - Event ID
   * @returns {Promise<Object>} Event data
   */
  async getEvent(eventId) {
    try {
      const params = {
        TableName: this.tableName,
        Key: {
          PK: `EVENT#${eventId}`,
          SK: `EVENT#${eventId}`,
        },
      };

      const result = await dynamodb.get(params).promise();

      if (!result.Item) {
        return {
          success: false,
          error: 'Event not found',
          message: 'Event not found',
        };
      }

      return {
        success: true,
        data: result.Item,
        message: 'Event retrieved successfully',
      };
    } catch (error) {
      console.error('Error getting event:', error);
      return {
        success: false,
        error: error.message,
        message: 'Failed to get event',
      };
    }
  }

  /**
   * Get all events
   * @returns {Promise<Object>} List of events
   */
  async getAllEvents() {
    try {
      const params = {
        TableName: this.tableName,
        FilterExpression: 'entityType = :entityType',
        ExpressionAttributeValues: {
          ':entityType': 'EVENT',
        },
      };

      const result = await dynamodb.scan(params).promise();

      // Sort events by date (most recent first)
      const sortedEvents = (result.Items || []).sort((a, b) => {
        return new Date(b.eventDate) - new Date(a.eventDate);
      });

      return {
        success: true,
        data: sortedEvents,
        message: 'Events retrieved successfully',
      };
    } catch (error) {
      console.error('Error getting all events:', error);
      return {
        success: false,
        error: error.message,
        message: 'Failed to get events',
      };
    }
  }

  /**
   * Get events by date range
   * @param {string} startDate - Start date (ISO string)
   * @param {string} endDate - End date (ISO string)
   * @returns {Promise<Object>} List of events in date range
   */
  async getEventsByDateRange(startDate, endDate) {
    try {
      const params = {
        TableName: this.tableName,
        IndexName: 'EventDateIndex',
        KeyConditionExpression: 'eventDate BETWEEN :startDate AND :endDate',
        ExpressionAttributeValues: {
          ':startDate': startDate,
          ':endDate': endDate,
        },
      };

      const result = await dynamodb.query(params).promise();

      return {
        success: true,
        data: result.Items || [],
        message: 'Events retrieved successfully',
      };
    } catch (error) {
      console.error('Error getting events by date range:', error);
      return {
        success: false,
        error: error.message,
        message: 'Failed to get events by date range',
      };
    }
  }

  /**
   * Update an event
   * @param {string} eventId - Event ID
   * @param {Object} updateData - Updated event data
   * @returns {Promise<Object>} Updated event
   */
  async updateEvent(eventId, updateData) {
    try {
      const now = new Date().toISOString();

      // Build update expression dynamically
      const updateExpressions = [];
      const expressionAttributeNames = {};
      const expressionAttributeValues = {};

      Object.keys(updateData).forEach((key, index) => {
        if (key !== 'eventId' && key !== 'createdAt') {
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
          PK: `EVENT#${eventId}`,
          SK: `EVENT#${eventId}`,
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
        message: 'Event updated successfully',
      };
    } catch (error) {
      console.error('Error updating event:', error);
      return {
        success: false,
        error: error.message,
        message: 'Failed to update event',
      };
    }
  }

  /**
   * Delete an event
   * @param {string} eventId - Event ID
   * @returns {Promise<Object>} Deletion result
   */
  async deleteEvent(eventId) {
    try {
      const params = {
        TableName: this.tableName,
        Key: {
          PK: `EVENT#${eventId}`,
          SK: `EVENT#${eventId}`,
        },
        ConditionExpression: 'attribute_exists(PK)',
      };

      await dynamodb.delete(params).promise();

      return {
        success: true,
        message: 'Event deleted successfully',
      };
    } catch (error) {
      console.error('Error deleting event:', error);
      return {
        success: false,
        error: error.message,
        message: 'Failed to delete event',
      };
    }
  }
}

module.exports = EventService;
