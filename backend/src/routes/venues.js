/**
 * Venue Routes
 * API endpoints for venue management
 */

const express = require('express');
const VenueService = require('../venues');
const { authenticateUser } = require('../middleware/auth');
const router = express.Router();

const venueService = new VenueService();

/**
 * POST /api/venues
 * Create a new venue
 */
router.post('/', authenticateUser, async (req, res) => {
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
      createdBy,
    } = req.body;

    // Validate required fields
    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'Venue name is required',
        message: 'Venue name is required',
      });
    }

    if (!address) {
      return res.status(400).json({
        success: false,
        error: 'Venue address is required',
        message: 'Venue address is required',
      });
    }

    // Use createdBy from request body if provided, otherwise use authenticated user
    const creatorId = createdBy || req.user.userId;

    const result = await venueService.createVenue(
      {
        name,
        description,
        address,
        contactPhone,
        contactEmail,
        websiteURL,
        capacity,
        mapLink,
      },
      creatorId
    );

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
 * Get all venues for the authenticated user
 */
router.get('/', authenticateUser, async (req, res) => {
  try {
    const result = await venueService.getAllVenues(req.user.userId);

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
 * GET /api/venues/:venueId/public
 * Get a specific venue by ID (public access for invitation redemption)
 */
router.get('/:venueId/public', async (req, res) => {
  try {
    const { venueId } = req.params;

    const result = await venueService.getVenue(venueId);

    if (result.success) {
      // Return only public venue information
      const publicVenue = {
        venueId: result.data.venueId,
        venueName: result.data.venueName,
        description: result.data.description,
        address: result.data.address,
        contactPhone: result.data.contactPhone,
        contactEmail: result.data.contactEmail,
        websiteURL: result.data.websiteURL,
        capacity: result.data.capacity,
        mapLink: result.data.mapLink,
        createdBy: result.data.createdBy,
        createdAt: result.data.createdAt,
        updatedAt: result.data.updatedAt,
      };

      res.status(200).json({
        success: true,
        data: publicVenue,
        message: 'Venue details retrieved',
      });
    } else {
      res.status(404).json(result);
    }
  } catch (error) {
    console.error('Get public venue error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to retrieve venue details',
    });
  }
});

/**
 * GET /api/venues/:venueId
 * Get a specific venue by ID (only if user owns it)
 */
router.get('/:venueId', authenticateUser, async (req, res) => {
  try {
    const { venueId } = req.params;

    // Check if user owns this venue
    const ownershipCheck = await venueService.checkVenueOwnership(
      venueId,
      req.user.userId
    );
    if (!ownershipCheck.success || !ownershipCheck.ownsVenue) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        message: 'You can only view venues you created',
      });
    }

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
 * Update a specific venue (only if user owns it)
 */
router.put('/:venueId', authenticateUser, async (req, res) => {
  try {
    const { venueId } = req.params;
    const updateData = req.body;

    // Check if user owns this venue
    const ownershipCheck = await venueService.checkVenueOwnership(
      venueId,
      req.user.userId
    );
    if (!ownershipCheck.success || !ownershipCheck.ownsVenue) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        message: 'You can only update venues you created',
      });
    }

    // Remove fields that shouldn't be updated
    delete updateData.venueId;
    delete updateData.createdAt;
    delete updateData.createdBy;

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
 * Delete a specific venue with validation and cascading deletes (only if user owns it)
 */
router.delete('/:venueId', authenticateUser, async (req, res) => {
  try {
    const { venueId } = req.params;
    const { force } = req.query; // Optional force parameter

    // Check if user owns this venue
    const ownershipCheck = await venueService.checkVenueOwnership(
      venueId,
      req.user.userId
    );
    if (!ownershipCheck.success) {
      // If venue doesn't exist, return 404
      if (ownershipCheck.error === 'Venue not found') {
        return res.status(404).json({
          success: false,
          error: 'Venue not found',
          message: 'Venue not found',
        });
      }
      // Other errors (like database issues)
      return res.status(500).json({
        success: false,
        error: ownershipCheck.error,
        message: ownershipCheck.message,
      });
    }
    if (!ownershipCheck.ownsVenue) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        message: 'You can only delete venues you created',
      });
    }

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
 * DELETE /api/venues/admin/cleanup
 * Admin endpoint to delete all venues (for cleanup purposes)
 */
router.delete('/admin/cleanup', async (req, res) => {
  try {
    // Get all venues
    const venuesResult = await venueService.getAllVenuesForCleanup();

    if (!venuesResult.success) {
      return res.status(500).json(venuesResult);
    }

    let deletedCount = 0;
    const errors = [];

    // Delete each venue
    for (const venue of venuesResult.data) {
      try {
        const deleteResult = await venueService.deleteVenue(
          venue.venueId,
          true
        ); // Force delete
        if (deleteResult.success) {
          deletedCount++;
        } else {
          errors.push(
            `Failed to delete venue ${venue.venueId}: ${deleteResult.error}`
          );
        }
      } catch (error) {
        errors.push(
          `Failed to delete venue ${venue.venueId}: ${error.message}`
        );
      }
    }

    res.status(200).json({
      success: true,
      message: `Cleanup completed. Deleted ${deletedCount} venues.`,
      deletedCount,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error('Admin venue cleanup error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to cleanup venues',
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
