const express = require('express');
const eventRoomService = require('../eventRooms');

const router = express.Router();

/**
 * GET /api/events/:eventId/rooms
 * Get all rooms for a specific event
 */
router.get('/:eventId/rooms', async (req, res) => {
  try {
    const { eventId } = req.params;
    const result = await eventRoomService.getEventRooms(eventId);

    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Get event rooms error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to get event rooms',
    });
  }
});

/**
 * POST /api/events/:eventId/rooms
 * Create a new room for a specific event
 */
router.post('/:eventId/rooms', async (req, res) => {
  try {
    const { eventId } = req.params;
    const { roomName, capacity, description, availableTimes, createdBy } =
      req.body;

    if (!roomName || !roomName.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Room name is required',
        message: 'Room name cannot be empty',
      });
    }

    if (!createdBy) {
      return res.status(400).json({
        success: false,
        error: 'Created by user ID is required',
        message: 'Created by user ID is required',
      });
    }

    const result = await eventRoomService.createEventRoom({
      eventId,
      roomName: roomName.trim(),
      capacity: capacity ? parseInt(capacity) : null,
      description: description ? description.trim() : null,
      availableTimes: availableTimes || [],
      createdBy,
    });

    if (result.success) {
      res.status(201).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Create event room error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to create event room',
    });
  }
});

/**
 * PUT /api/events/:eventId/rooms
 * Update all room assignments for an event
 */
router.put('/:eventId/rooms', async (req, res) => {
  try {
    const { eventId } = req.params;
    const { rooms } = req.body;

    if (!rooms || !Array.isArray(rooms)) {
      return res.status(400).json({
        success: false,
        error: 'Rooms array is required',
        message: 'Rooms must be provided as an array',
      });
    }

    const result = await eventRoomService.updateEventRooms(eventId, rooms);

    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Update event rooms error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to update event rooms',
    });
  }
});

/**
 * DELETE /api/events/:eventId/rooms/:roomId
 * Delete a room from a specific event
 */
router.delete('/:eventId/rooms/:roomId', async (req, res) => {
  try {
    const { eventId, roomId } = req.params;
    const result = await eventRoomService.deleteEventRoom(eventId, roomId);

    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Delete event room error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to delete event room',
    });
  }
});

/**
 * DELETE /api/events/:eventId/rooms
 * Clear all room assignments for an event
 */
router.delete('/:eventId/rooms', async (req, res) => {
  try {
    const { eventId } = req.params;
    const result = await eventRoomService.clearEventRooms(eventId);

    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Clear event rooms error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to clear event rooms',
    });
  }
});

module.exports = router;
