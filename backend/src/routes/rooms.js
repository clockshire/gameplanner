/**
 * Room Routes
 * API endpoints for room management
 */

const express = require('express');
const RoomService = require('../rooms');
const router = express.Router();

const roomService = new RoomService();

/**
 * POST /api/rooms
 * Create a new room
 */
router.post('/', async (req, res) => {
  try {
    const { name, description, venueId, capacity, roomType, amenities } =
      req.body;

    // Validate required fields
    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'Room name is required',
        message: 'Room name is required',
      });
    }

    if (!venueId) {
      return res.status(400).json({
        success: false,
        error: 'Venue ID is required',
        message: 'Venue ID is required',
      });
    }

    const result = await roomService.createRoom({
      name,
      description,
      venueId,
      capacity,
      roomType,
      amenities,
    });

    if (result.success) {
      res.status(201).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Room creation error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to create room',
    });
  }
});

/**
 * GET /api/rooms/:roomId
 * Get a specific room by ID
 */
router.get('/:roomId', async (req, res) => {
  try {
    const { roomId } = req.params;

    const result = await roomService.getRoom(roomId);

    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(404).json(result);
    }
  } catch (error) {
    console.error('Get room error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to get room',
    });
  }
});

/**
 * PUT /api/rooms/:roomId
 * Update a specific room
 */
router.put('/:roomId', async (req, res) => {
  try {
    const { roomId } = req.params;
    const updateData = req.body;

    // Remove fields that shouldn't be updated
    delete updateData.roomId;
    delete updateData.createdAt;

    const result = await roomService.updateRoom(roomId, updateData);

    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Update room error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to update room',
    });
  }
});

/**
 * DELETE /api/rooms/:roomId
 * Delete a specific room
 */
router.delete('/:roomId', async (req, res) => {
  try {
    const { roomId } = req.params;

    const result = await roomService.deleteRoom(roomId);

    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Delete room error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to delete room',
    });
  }
});

/**
 * GET /api/rooms/venue/:venueId
 * Get all rooms for a specific venue
 */
router.get('/venue/:venueId', async (req, res) => {
  try {
    const { venueId } = req.params;

    const result = await roomService.getVenueRooms(venueId);

    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Get venue rooms error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to get venue rooms',
    });
  }
});

module.exports = router;
