/**
 * Event Access Control Middleware
 * Handles access control for events based on ownership and participation
 */

const EventService = require('../events');
const EventParticipantsService = require('../eventParticipants');

const eventService = new EventService();
const eventParticipantsService = new EventParticipantsService();

/**
 * Check if user has access to an event (owner or participant)
 * @param {string} eventId - Event ID
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Access check result
 */
async function checkEventAccess(eventId, userId) {
  try {
    // First check if user owns the event
    const ownershipCheck = await eventService.checkEventOwnership(eventId, userId);
    if (ownershipCheck.success && ownershipCheck.ownsEvent) {
      return {
        success: true,
        hasAccess: true,
        accessLevel: 'owner',
        message: 'User owns the event',
      };
    }

    // Then check if user is a participant
    const participantCheck = await eventParticipantsService.isParticipant(eventId, userId);
    if (participantCheck.success && participantCheck.isParticipant) {
      return {
        success: true,
        hasAccess: true,
        accessLevel: 'participant',
        message: 'User is a participant in the event',
      };
    }

    // No access
    return {
      success: true,
      hasAccess: false,
      accessLevel: 'none',
      message: 'User has no access to this event',
    };
  } catch (error) {
    console.error('Error checking event access:', error);
    return {
      success: false,
      hasAccess: false,
      accessLevel: 'none',
      error: error.message,
      message: 'Failed to check event access',
    };
  }
}

/**
 * Middleware to check event access
 * Adds access level to req.eventAccess
 */
async function checkEventAccessMiddleware(req, res, next) {
  try {
    const { eventId } = req.params;
    const userId = req.user.userId;

    const accessCheck = await checkEventAccess(eventId, userId);

    if (!accessCheck.success) {
      return res.status(500).json({
        success: false,
        error: 'Failed to check event access',
        message: 'Failed to check event access',
      });
    }

    if (!accessCheck.hasAccess) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        message: 'You do not have access to this event',
      });
    }

    // Add access level to request
    req.eventAccess = {
      level: accessCheck.accessLevel,
      isOwner: accessCheck.accessLevel === 'owner',
      isParticipant: accessCheck.accessLevel === 'participant',
    };

    next();
  } catch (error) {
    console.error('Event access middleware error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to check event access',
    });
  }
}

/**
 * Middleware to check if user is event owner (for edit/delete operations)
 */
async function requireEventOwnership(req, res, next) {
  try {
    const { eventId } = req.params;
    const userId = req.user.userId;

    const ownershipCheck = await eventService.checkEventOwnership(eventId, userId);
    if (!ownershipCheck.success || !ownershipCheck.ownsEvent) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        message: 'You can only modify events you created',
      });
    }

    req.eventAccess = {
      level: 'owner',
      isOwner: true,
      isParticipant: true, // Owners are also participants
    };

    next();
  } catch (error) {
    console.error('Event ownership middleware error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to check event ownership',
    });
  }
}

module.exports = {
  checkEventAccess,
  checkEventAccessMiddleware,
  requireEventOwnership,
};
