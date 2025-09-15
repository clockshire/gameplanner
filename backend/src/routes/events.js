/**
 * Event Routes
 * API endpoints for event management
 */

const express = require('express');
const EventService = require('../events');
const { authenticateUser } = require('../middleware/auth');
const router = express.Router();

const eventService = new EventService();

/**
 * POST /api/events
 * Create a new event
 */
router.post('/', authenticateUser, async (req, res) => {
  try {
    const {
      name,
      description,
      eventDate,
      endDate,
      startTime,
      endTime,
      venueId,
      maxParticipants,
      createdBy,
    } = req.body;

    // Validate required fields
    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'Event name is required',
        message: 'Event name is required',
      });
    }

    if (!eventDate) {
      return res.status(400).json({
        success: false,
        error: 'Event date is required',
        message: 'Event date is required',
      });
    }

    if (!venueId) {
      return res.status(400).json({
        success: false,
        error: 'Venue ID is required',
        message: 'Venue ID is required',
      });
    }

    const result = await eventService.createEvent({
      name,
      description,
      eventDate,
      endDate,
      startTime,
      endTime,
      venueId,
      maxParticipants,
      createdBy: req.user.userId,
    });

    if (result.success) {
      res.status(201).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Event creation error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to create event',
    });
  }
});

/**
 * GET /api/events
 * Get all events for the authenticated user
 */
router.get('/', authenticateUser, async (req, res) => {
  try {
    const result = await eventService.getAllEvents(req.user.userId);

    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Get events error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to get events',
    });
  }
});

/**
 * GET /api/events/:eventId
 * Get a specific event by ID (only if user owns it)
 */
router.get('/:eventId', authenticateUser, async (req, res) => {
  try {
    const { eventId } = req.params;

    // Check if user owns this event
    const ownershipCheck = await eventService.checkEventOwnership(
      eventId,
      req.user.userId
    );
    if (!ownershipCheck.success || !ownershipCheck.ownsEvent) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        message: 'You can only view events you created',
      });
    }

    const result = await eventService.getEvent(eventId);

    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(404).json(result);
    }
  } catch (error) {
    console.error('Get event error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to get event',
    });
  }
});

/**
 * PUT /api/events/:eventId
 * Update a specific event (only if user owns it)
 */
router.put('/:eventId', authenticateUser, async (req, res) => {
  try {
    const { eventId } = req.params;
    const {
      eventName,
      description,
      eventDate,
      endDate,
      startTime,
      endTime,
      venueId,
      maxParticipants,
      status,
      assignedRoomIds,
    } = req.body;

    // Check if user owns this event
    const ownershipCheck = await eventService.checkEventOwnership(
      eventId,
      req.user.userId
    );
    if (!ownershipCheck.success || !ownershipCheck.ownsEvent) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        message: 'You can only update events you created',
      });
    }

    // Map frontend field names to backend field names
    const updateData = {
      name: eventName,
      description,
      eventDate,
      endDate,
      startTime,
      endTime,
      venueId,
      maxParticipants,
      status,
      assignedRoomIds,
    };

    // Remove undefined/null values
    Object.keys(updateData).forEach((key) => {
      if (updateData[key] === undefined || updateData[key] === null) {
        delete updateData[key];
      }
    });

    const result = await eventService.updateEvent(eventId, updateData);

    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Update event error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to update event',
    });
  }
});

/**
 * DELETE /api/events/:eventId
 * Delete a specific event (only if user owns it)
 */
router.delete('/:eventId', authenticateUser, async (req, res) => {
  try {
    const { eventId } = req.params;

    // Check if user owns this event
    const ownershipCheck = await eventService.checkEventOwnership(
      eventId,
      req.user.userId
    );
    if (!ownershipCheck.success || !ownershipCheck.ownsEvent) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        message: 'You can only delete events you created',
      });
    }

    const result = await eventService.deleteEvent(eventId);

    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Delete event error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to delete event',
    });
  }
});

/**
 * GET /api/events/date-range
 * Get events by date range
 */
router.get('/date-range', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: 'Start date and end date are required',
        message: 'Start date and end date are required',
      });
    }

    const result = await eventService.getEventsByDateRange(startDate, endDate);

    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Get events by date range error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to get events by date range',
    });
  }
});

module.exports = router;
