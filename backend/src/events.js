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
   * @param {string} eventData.eventDate - Event start date (ISO string)
   * @param {string} eventData.endDate - Event end date (ISO string, optional)
   * @param {string} eventData.startTime - Event start time
   * @param {string} eventData.endTime - Event end time
   * @param {string} eventData.venueId - Associated venue ID
   * @param {number} eventData.maxParticipants - Maximum participants
   * @param {string} eventData.createdBy - User ID who created the event
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
        endDate: eventData.endDate || eventData.eventDate, // Default to start date if no end date
        startTime: eventData.startTime || '',
        endTime: eventData.endTime || '',
        venueId: eventData.venueId || null,
        maxParticipants: eventData.maxParticipants || 0,
        currentParticipants: 0,
        status: 'active',
        createdBy: eventData.createdBy || null, // User ID who created the event
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
   * Check if a user owns an event
   * @param {string} eventId - Event ID
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Ownership check result
   */
  async checkEventOwnership(eventId, userId) {
    try {
      const eventResult = await this.getEvent(eventId);

      if (!eventResult.success) {
        return {
          success: false,
          ownsEvent: false,
          error: eventResult.error,
          message: eventResult.message,
        };
      }

      const event = eventResult.data;
      const ownsEvent = event.createdBy === userId;

      return {
        success: true,
        ownsEvent: ownsEvent,
        message: ownsEvent ? 'User owns event' : 'User does not own event',
      };
    } catch (error) {
      console.error('Error checking event ownership:', error);
      return {
        success: false,
        ownsEvent: false,
        error: error.message,
        message: 'Failed to check event ownership',
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
   * Get all events for a specific user
   * @param {string} userId - User ID to filter events by
   * @returns {Promise<Object>} List of events
   */
  async getAllEvents(userId) {
    try {
      const params = {
        TableName: this.tableName,
        FilterExpression: 'entityType = :entityType AND createdBy = :userId',
        ExpressionAttributeValues: {
          ':entityType': 'EVENT',
          ':userId': userId,
        },
      };

      const result = await dynamodb.scan(params).promise();
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Start of today

      // Process events to update status for past events
      const processedEvents = [];
      const eventsToUpdate = [];

      for (const event of result.Items || []) {
        const eventStartDate = new Date(event.eventDate);
        eventStartDate.setHours(0, 0, 0, 0); // Start of event start date

        const eventEndDate = new Date(event.endDate || event.eventDate);
        eventEndDate.setHours(23, 59, 59, 999); // End of event end date

        // If event has ended and still marked as active, update it
        if (eventEndDate < today && event.status === 'active') {
          event.status = 'completed';
          eventsToUpdate.push(event);
        }

        processedEvents.push(event);
      }

      // Update past events in the database
      if (eventsToUpdate.length > 0) {
        await this.updatePastEvents(eventsToUpdate);
      }

      // Sort events by date (soonest to furthest in the future)
      const sortedEvents = processedEvents.sort((a, b) => {
        return new Date(a.eventDate) - new Date(b.eventDate);
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
   * Update past events to completed status
   * @param {Array} events - Array of events to update
   * @returns {Promise<void>}
   */
  async updatePastEvents(events) {
    try {
      const updatePromises = events.map(async (event) => {
        const now = new Date().toISOString();

        const params = {
          TableName: this.tableName,
          Key: {
            PK: event.PK,
            SK: event.SK,
          },
          UpdateExpression: 'SET #status = :status, #updatedAt = :updatedAt',
          ExpressionAttributeNames: {
            '#status': 'status',
            '#updatedAt': 'updatedAt',
          },
          ExpressionAttributeValues: {
            ':status': 'completed',
            ':updatedAt': now,
          },
        };

        await dynamodb.update(params).promise();
      });

      await Promise.all(updatePromises);
    } catch (error) {
      console.error('Error updating past events:', error);
      // Don't throw error here as we don't want to break the main flow
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

  /**
   * Get all events for a user (both created and participated)
   * @param {string} userId - User ID
   * @returns {Promise<Object>} List of events with participation info
   */
  async getAllUserEvents(userId) {
    try {
      // Get events created by the user
      const createdEventsResult = await this.getAllEvents(userId);
      if (!createdEventsResult.success) {
        return createdEventsResult;
      }

      // Get events where user is a participant
      const participatedEventsResult = await this.getParticipatedEvents(userId);
      if (!participatedEventsResult.success) {
        return participatedEventsResult;
      }

      // Combine and deduplicate events
      const createdEvents = createdEventsResult.data || [];
      const participatedEvents = participatedEventsResult.data || [];

      // Mark created events
      const markedCreatedEvents = createdEvents.map((event) => ({
        ...event,
        userRole: 'owner',
        isOwner: true,
        isParticipant: false,
      }));

      // Mark participated events (excluding those already created by user)
      const createdEventIds = new Set(
        createdEvents.map((event) => event.eventId)
      );
      const markedParticipatedEvents = participatedEvents
        .filter((event) => !createdEventIds.has(event.eventId))
        .map((event) => ({
          ...event,
          userRole: 'participant',
          isOwner: false,
          isParticipant: true,
        }));

      // Combine all events
      const allEvents = [...markedCreatedEvents, ...markedParticipatedEvents];

      // Sort by date
      const sortedEvents = allEvents.sort((a, b) => {
        return new Date(a.eventDate) - new Date(b.eventDate);
      });

      return {
        success: true,
        data: sortedEvents,
        message: 'User events retrieved successfully',
      };
    } catch (error) {
      console.error('Error getting all user events:', error);
      return {
        success: false,
        error: error.message,
        message: 'Failed to get user events',
      };
    }
  }

  /**
   * Get events where user is a participant
   * @param {string} userId - User ID
   * @returns {Promise<Object>} List of participated events
   */
  async getParticipatedEvents(userId) {
    try {
      // First get all event participants for this user
      const EventParticipantsService = require('./eventParticipants');
      const eventParticipantsService = new EventParticipantsService();

      const participantsResult = await eventParticipantsService.getUserEvents(
        userId
      );
      if (!participantsResult.success) {
        return participantsResult;
      }

      const participants = participantsResult.data || [];
      if (participants.length === 0) {
        return {
          success: true,
          data: [],
          message: 'No participated events found',
        };
      }

      // Get event details for each participated event
      const eventIds = participants.map((p) => p.eventId);
      const events = [];

      for (const eventId of eventIds) {
        const eventResult = await this.getEvent(eventId);
        if (eventResult.success && eventResult.data) {
          events.push(eventResult.data);
        }
      }

      return {
        success: true,
        data: events,
        message: 'Participated events retrieved successfully',
      };
    } catch (error) {
      console.error('Error getting participated events:', error);
      return {
        success: false,
        error: error.message,
        message: 'Failed to get participated events',
      };
    }
  }
}

module.exports = EventService;
