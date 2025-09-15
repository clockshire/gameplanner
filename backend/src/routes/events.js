/**
 * Event Routes
 * API endpoints for event management
 */

const express = require('express');
const EventService = require('../events');
const { authenticateUser } = require('../middleware/auth');
const {
  checkEventAccessMiddleware,
  requireEventOwnership,
} = require('../middleware/eventAccess');
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

    // Use createdBy from request body if provided, otherwise use authenticated user
    const creatorId = createdBy || req.user.userId;

    const result = await eventService.createEvent({
      name,
      description,
      eventDate,
      endDate,
      startTime,
      endTime,
      venueId,
      maxParticipants,
      createdBy: creatorId,
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
 * Get all events for the authenticated user (both created and participated)
 */
router.get('/', authenticateUser, async (req, res) => {
  try {
    const result = await eventService.getAllUserEvents(req.user.userId);

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
 * GET /api/events/:eventId/public
 * Get a specific event by ID (public access for invitation redemption)
 */
router.get('/:eventId/public', async (req, res) => {
  try {
    const { eventId } = req.params;

    const result = await eventService.getEvent(eventId);

    if (result.success) {
      // Return only public event information
      const publicEvent = {
        eventId: result.data.eventId,
        eventName: result.data.eventName,
        description: result.data.description,
        eventDate: result.data.eventDate,
        endDate: result.data.endDate,
        startTime: result.data.startTime,
        endTime: result.data.endTime,
        venueId: result.data.venueId,
        maxParticipants: result.data.maxParticipants,
        status: result.data.status,
        createdBy: result.data.createdBy,
        createdAt: result.data.createdAt,
        updatedAt: result.data.updatedAt,
      };

      res.status(200).json({
        success: true,
        data: publicEvent,
        message: 'Event details retrieved',
      });
    } else {
      res.status(404).json(result);
    }
  } catch (error) {
    console.error('Get public event error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to retrieve event details',
    });
  }
});

/**
 * GET /api/events/:eventId
 * Get a specific event by ID (if user owns it or is a participant)
 */
router.get(
  '/:eventId',
  authenticateUser,
  checkEventAccessMiddleware,
  async (req, res) => {
    try {
      const { eventId } = req.params;

      const result = await eventService.getEvent(eventId);

      if (result.success) {
        // Add access level information to the response
        const responseData = {
          ...result.data,
          userAccess: {
            level: req.eventAccess.level,
            isOwner: req.eventAccess.isOwner,
            isParticipant: req.eventAccess.isParticipant,
          },
        };

        res.status(200).json({
          success: true,
          data: responseData,
          message: 'Event details retrieved',
        });
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
  }
);

/**
 * PUT /api/events/:eventId
 * Update a specific event (only if user owns it)
 */
router.put(
  '/:eventId',
  authenticateUser,
  requireEventOwnership,
  async (req, res) => {
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

      // Ownership check is handled by requireEventOwnership middleware

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
  }
);

/**
 * DELETE /api/events/:eventId
 * Delete a specific event (only if user owns it)
 */
router.delete(
  '/:eventId',
  authenticateUser,
  requireEventOwnership,
  async (req, res) => {
    try {
      const { eventId } = req.params;

      // Ownership check is handled by requireEventOwnership middleware

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
  }
);

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
