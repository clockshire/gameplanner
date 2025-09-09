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
    const { name, description, address, contactInfo, capacity } = req.body;

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
      contactInfo,
      capacity,
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
 * DELETE /api/venues/:venueId
 * Delete a specific venue
 */
router.delete('/:venueId', async (req, res) => {
  try {
    const { venueId } = req.params;

    const result = await venueService.deleteVenue(venueId);

    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
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
