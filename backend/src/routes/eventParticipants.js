/**
 * Event Participants Routes
 * API endpoints for managing event participants
 */

const express = require('express');
const EventParticipantsService = require('../eventParticipants');
const { authenticateUser } = require('../middleware/auth');
const router = express.Router();

const eventParticipantsService = new EventParticipantsService();

/**
 * POST /api/event-participants
 * Add a participant to an event
 * Requires authentication
 */
router.post('/', authenticateUser, async (req, res) => {
  try {
    const { eventId, userId, userName, userEmail, inviteCode } = req.body;
    const currentUserId = req.user.userId;

    // Validate required fields
    if (!eventId) {
      return res.status(400).json({
        success: false,
        error: 'Event ID is required',
        message: 'Event ID is required',
      });
    }

    // Use current user's info if not provided
    const participantUserId = userId || currentUserId;
    const participantUserName = userName || req.user.name;
    const participantUserEmail = userEmail || req.user.email;

    const result = await eventParticipantsService.addParticipant(
      eventId,
      participantUserId,
      participantUserName,
      participantUserEmail,
      inviteCode
    );

    if (result.success) {
      res.status(201).json(result);
    } else if (result.code === 'ALREADY_PARTICIPANT') {
      res.status(409).json(result);
    } else {
      res.status(500).json(result);
    }
  } catch (error) {
    console.error('Add participant error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to add participant',
    });
  }
});

/**
 * DELETE /api/event-participants/:eventId/:userId
 * Remove a participant from an event
 * Requires authentication
 */
router.delete('/:eventId/:userId', authenticateUser, async (req, res) => {
  try {
    const { eventId, userId } = req.params;
    const currentUserId = req.user.userId;

    // Users can only remove themselves unless they're the event owner
    // For now, allow users to remove themselves
    if (userId !== currentUserId) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized',
        message: 'You can only remove yourself from events',
      });
    }

    const result = await eventParticipantsService.removeParticipant(eventId, userId);

    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(500).json(result);
    }
  } catch (error) {
    console.error('Remove participant error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to remove participant',
    });
  }
});

/**
 * GET /api/event-participants/event/:eventId
 * Get all participants for an event
 * Requires authentication
 */
router.get('/event/:eventId', authenticateUser, async (req, res) => {
  try {
    const { eventId } = req.params;

    const result = await eventParticipantsService.getEventParticipants(eventId);

    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(500).json(result);
    }
  } catch (error) {
    console.error('Get event participants error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to retrieve event participants',
    });
  }
});

/**
 * GET /api/event-participants/user/:userId
 * Get all events a user has joined
 * Requires authentication
 */
router.get('/user/:userId', authenticateUser, async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user.userId;

    // Users can only view their own events
    if (userId !== currentUserId) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized',
        message: 'You can only view your own events',
      });
    }

    const result = await eventParticipantsService.getUserEvents(userId);

    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(500).json(result);
    }
  } catch (error) {
    console.error('Get user events error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to retrieve user events',
    });
  }
});

/**
 * GET /api/event-participants/check/:eventId/:userId
 * Check if a user is a participant in an event
 * Requires authentication
 */
router.get('/check/:eventId/:userId', authenticateUser, async (req, res) => {
  try {
    const { eventId, userId } = req.params;

    const result = await eventParticipantsService.isParticipant(eventId, userId);

    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(500).json(result);
    }
  } catch (error) {
    console.error('Check participant status error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to check participant status',
    });
  }
});

/**
 * GET /api/event-participants/count/:eventId
 * Get participant count for an event
 * Requires authentication
 */
router.get('/count/:eventId', authenticateUser, async (req, res) => {
  try {
    const { eventId } = req.params;

    const result = await eventParticipantsService.getParticipantCount(eventId);

    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(500).json(result);
    }
  } catch (error) {
    console.error('Get participant count error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to retrieve participant count',
    });
  }
});

module.exports = router;
