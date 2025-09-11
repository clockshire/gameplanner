/**
 * Venue Routes
 * API endpoints for venue management
 */

const express = require('express');
const VenueService = require('../venues');
const router = express.Router();

const venueService = new VenueService();

/**
 * POST /api/venues
 * Create a new venue
 */
router.post('/', async (req, res) => {
  try {
    const {
      name,
      description,
      address,
      contactPhone,
      contactEmail,
      websiteURL,
      capacity,
      mapLink,
    } = req.body;

    // Validate required fields
    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'Venue name is required',
        message: 'Venue name is required',
      });
    }

    const result = await venueService.createVenue({
      name,
      description,
      address,
      contactPhone,
      contactEmail,
      websiteURL,
      capacity,
      mapLink,
    });

    if (result.success) {
      res.status(201).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Venue creation error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to create venue',
    });
  }
});

/**
 * GET /api/venues
 * Get all venues
 */
router.get('/', async (req, res) => {
  try {
    const result = await venueService.getAllVenues();

    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Get venues error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to get venues',
    });
  }
});

/**
 * GET /api/venues/:venueId
 * Get a specific venue by ID
 */
router.get('/:venueId', async (req, res) => {
  try {
    const { venueId } = req.params;

    const result = await venueService.getVenue(venueId);

    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(404).json(result);
    }
  } catch (error) {
    console.error('Get venue error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to get venue',
    });
  }
});

/**
 * PUT /api/venues/:venueId
 * Update a specific venue
 */
router.put('/:venueId', async (req, res) => {
  try {
    const { venueId } = req.params;
    const updateData = req.body;

    // Remove fields that shouldn't be updated
    delete updateData.venueId;
    delete updateData.createdAt;

    const result = await venueService.updateVenue(venueId, updateData);

    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Update venue error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to update venue',
    });
  }
});

/**
 * GET /api/venues/:venueId/deletion-info
 * Get information about what would be deleted with this venue
 */
router.get('/:venueId/deletion-info', async (req, res) => {
  try {
    const { venueId } = req.params;

    // Check for event references
    const eventCheck = await venueService.checkVenueEventReferences(venueId);
    if (!eventCheck.success) {
      return res.status(500).json(eventCheck);
    }

    // Get venue rooms
    const roomsResult = await venueService.getVenueRooms(venueId);
    if (!roomsResult.success) {
      return res.status(500).json(roomsResult);
    }

    const rooms = roomsResult.data || [];

    res.status(200).json({
      success: true,
      data: {
        venueId,
        hasEventReferences: eventCheck.hasReferences,
        events: eventCheck.events,
        rooms: rooms.map((room) => ({
          roomId: room.roomId,
          roomName: room.roomName,
          capacity: room.capacity,
        })),
        canDelete: !eventCheck.hasReferences,
        message: eventCheck.hasReferences
          ? `Cannot delete: venue is referenced by ${eventCheck.events.length} event(s)`
          : `Can delete: will also remove ${rooms.length} room(s)`,
      },
    });
  } catch (error) {
    console.error('Get venue deletion info error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to get venue deletion info',
    });
  }
});

/**
 * DELETE /api/venues/:venueId
 * Delete a specific venue with validation and cascading deletes
 */
router.delete('/:venueId', async (req, res) => {
  try {
    const { venueId } = req.params;
    const { force } = req.query; // Optional force parameter

    const result = await venueService.deleteVenue(venueId, force === 'true');

    if (result.success) {
      res.status(200).json(result);
    } else {
      // Handle specific error cases
      if (result.error === 'VENUE_HAS_EVENT_REFERENCES') {
        res.status(409).json(result); // Conflict status for business rule violation
      } else if (result.error === 'Venue not found') {
        res.status(404).json(result);
      } else {
        res.status(400).json(result);
      }
    }
  } catch (error) {
    console.error('Delete venue error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to delete venue',
    });
  }
});

/**
 * GET /api/venues/:venueId/rooms
 * Get all rooms for a specific venue
 */
router.get('/:venueId/rooms', async (req, res) => {
  try {
    const { venueId } = req.params;

    const result = await venueService.getVenueRooms(venueId);

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
