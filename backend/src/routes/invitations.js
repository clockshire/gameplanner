/**
 * Invitations API Routes
 * Handles invitation code generation, management, and redemption
 */

const express = require('express');
const InvitationService = require('../invitations');
const EventParticipantsService = require('../eventParticipants');
const { authenticateUser } = require('../middleware/auth');

const router = express.Router();
const invitationService = new InvitationService();
const eventParticipantsService = new EventParticipantsService();

/**
 * POST /api/invitations
 * Create a new invitation for an event
 */
router.post('/', authenticateUser, async (req, res) => {
  try {
    const { eventId, type, description } = req.body;
    const createdBy = req.user.userId;

    if (!eventId || !type) {
      return res.status(400).json({
        success: false,
        error: 'Event ID and invitation type are required',
        message: 'Event ID and invitation type are required',
      });
    }

    if (!['one-time', 'generic'].includes(type)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid invitation type',
        message: 'Invitation type must be "one-time" or "generic"',
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
      res.status(500).json(result);
    }
  } catch (error) {
    console.error('Create invitation error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to create invitation',
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

    const result = await invitationService.getEventInvitations(eventId);

    if (result.success) {
      // Filter to only show invites created by the requesting user
      const userInvitations = result.data.filter(
        (invite) => invite.createdBy === userId
      );
      res.status(200).json({
        success: true,
        data: userInvitations,
        message: 'Event invitations retrieved',
      });
    } else {
      res.status(500).json(result);
    }
  } catch (error) {
    console.error('Error getting event invitations:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to retrieve event invitations',
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
      error: 'Internal server error',
      message: 'Failed to retrieve invitation details',
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
    const userName = req.user.name;
    const userEmail = req.user.email;

    // First redeem the invitation
    const redeemResult = await invitationService.redeemInvitation(inviteCode, userId);

    if (!redeemResult.success) {
      return res.status(400).json(redeemResult);
    }

    // Get the event ID from the invitation
    const invitationResult = await invitationService.getInvitationByCode(inviteCode);
    if (!invitationResult.success) {
      return res.status(500).json({
        success: false,
        error: 'Failed to get invitation details',
        message: 'Failed to get invitation details',
      });
    }

    const eventId = invitationResult.data.invitedEventId;

    // Add user as participant to the event
    const participantResult = await eventParticipantsService.addParticipant(
      eventId,
      userId,
      userName,
      userEmail,
      inviteCode
    );

    if (!participantResult.success && participantResult.code !== 'ALREADY_PARTICIPANT') {
      // If adding participant fails, we should still consider the invitation redeemed
      // but log the error
      console.error('Failed to add participant after invitation redemption:', participantResult);
    }

    // Return success even if participant addition failed (invitation was still redeemed)
    res.json({
      success: true,
      data: {
        eventId: eventId,
        inviteCode: inviteCode,
        type: invitationResult.data.type,
        participantAdded: participantResult.success || participantResult.code === 'ALREADY_PARTICIPANT',
      },
      message: 'Invitation redeemed successfully',
    });
  } catch (error) {
    console.error('Error redeeming invitation:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to redeem invitation',
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
      res.status(200).json(result);
    } else if (result.code === 'INVITATION_NOT_FOUND') {
      res.status(404).json(result);
    } else if (result.code === 'UNAUTHORIZED') {
      res.status(403).json(result);
    } else {
      res.status(500).json(result);
    }
  } catch (error) {
    console.error('Error deleting invitation:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to delete invitation',
    });
  }
});

module.exports = router;
