/**
 * Invitations API Routes
 * Handles invitation code generation, management, and redemption
 */

const express = require('express');
const InvitationService = require('../invitations');
const { authenticateUser } = require('../middleware/auth');

const router = express.Router();
const invitationService = new InvitationService();

/**
 * POST /api/invitations
 * Create a new invitation for an event
 */
router.post('/', authenticateUser, async (req, res) => {
  try {
    const { eventId, type = 'generic', description = '' } = req.body;
    const createdBy = req.user.userId;

    if (!eventId) {
      return res.status(400).json({
        success: false,
        error: 'Event ID is required',
        message: 'Please provide an event ID',
      });
    }

    if (!['generic', 'one-time'].includes(type)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid invitation type',
        message: 'Type must be either "generic" or "one-time"',
      });
    }

    const result = await invitationService.createInvitation(
      eventId,
      createdBy,
      type,
      description
    );

    if (result.success) {
      res.status(201).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Error creating invitation:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Internal server error',
    });
  }
});

/**
 * GET /api/invitations/event/:eventId
 * Get all invitations for a specific event
 */
router.get('/event/:eventId', authenticateUser, async (req, res) => {
  try {
    const { eventId } = req.params;
    const userId = req.user.userId;

    // TODO: Verify user owns the event or has permission to view invitations
    // For now, we'll allow any authenticated user to view invitations

    const result = await invitationService.getEventInvitations(eventId);

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Error getting event invitations:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Internal server error',
    });
  }
});

/**
 * GET /api/invitations/:inviteCode
 * Get invitation details by code (for redemption page)
 */
router.get('/:inviteCode', async (req, res) => {
  try {
    const { inviteCode } = req.params;

    const result = await invitationService.getInvitationByCode(inviteCode);

    if (result.success) {
      // Don't expose sensitive information like createdBy
      const publicInvitation = {
        inviteCode: result.data.inviteCode,
        invitedEventId: result.data.invitedEventId,
        type: result.data.type,
        description: result.data.description,
        usesLeft: result.data.usesLeft,
        createdAt: result.data.createdAt,
      };
      res.json({
        success: true,
        data: publicInvitation,
        message: 'Invitation details retrieved',
      });
    } else {
      res.status(404).json(result);
    }
  } catch (error) {
    console.error('Error getting invitation details:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Internal server error',
    });
  }
});

/**
 * POST /api/invitations/:inviteCode/redeem
 * Redeem an invitation code
 */
router.post('/:inviteCode/redeem', authenticateUser, async (req, res) => {
  try {
    const { inviteCode } = req.params;
    const userId = req.user.userId;

    const result = await invitationService.redeemInvitation(inviteCode, userId);

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Error redeeming invitation:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Internal server error',
    });
  }
});

/**
 * DELETE /api/invitations/:inviteCode
 * Delete an invitation
 */
router.delete('/:inviteCode', authenticateUser, async (req, res) => {
  try {
    const { inviteCode } = req.params;
    const userId = req.user.userId;

    const result = await invitationService.deleteInvitation(inviteCode, userId);

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Error deleting invitation:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Internal server error',
    });
  }
});

module.exports = router;
