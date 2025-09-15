/**
 * Invitation Service
 * Handles invitation code generation, validation, and redemption
 */

const AWS = require('aws-sdk');
const { generate } = require('referral-codes');

// Configure DynamoDB
const dynamodb = new AWS.DynamoDB.DocumentClient({
  endpoint: 'http://localhost:8000',
  region: 'us-east-1',
  accessKeyId: 'dummy',
  secretAccessKey: 'dummy',
});

class InvitationService {
  constructor() {
    this.tableName = 'invitations';
  }

  /**
   * Generate a unique 8-character invite code
   * @returns {string} Unique invite code
   */
  generateInviteCode() {
    const code = generate({
      length: 8,
      count: 1,
      charset: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
    })[0];
    return code;
  }

  /**
   * Create a new invitation
   * @param {string} eventId - Event ID to invite to
   * @param {string} createdBy - User ID who created the invitation
   * @param {string} type - 'generic' or 'one-time'
   * @param {string} description - Optional description
   * @returns {Object} Created invitation data
   */
  async createInvitation(
    eventId,
    createdBy,
    type = 'generic',
    description = ''
  ) {
    try {
      // Generate unique invite code
      let inviteCode;
      let attempts = 0;
      const maxAttempts = 10;

      do {
        inviteCode = this.generateInviteCode();
        const existing = await this.getInvitationByCode(inviteCode);
        if (!existing.success) {
          break; // Code is unique
        }
        attempts++;
      } while (attempts < maxAttempts);

      if (attempts >= maxAttempts) {
        throw new Error('Failed to generate unique invite code');
      }

      // Determine uses left based on type
      const usesLeft = type === 'one-time' ? 1 : 'infinite';

      const invitation = {
        PK: `INVITE#${inviteCode}`,
        SK: `INVITE#${inviteCode}`,
        entityType: 'INVITATION',
        inviteCode: inviteCode,
        invitedEventId: eventId,
        createdBy: createdBy,
        type: type,
        usesLeft: usesLeft,
        description: description,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const params = {
        TableName: this.tableName,
        Item: invitation,
      };

      await dynamodb.put(params).promise();

      return {
        success: true,
        data: invitation,
        message: 'Invitation created successfully',
      };
    } catch (error) {
      console.error('Error creating invitation:', error);
      return {
        success: false,
        error: error.message,
        message: 'Failed to create invitation',
      };
    }
  }

  /**
   * Get invitation by invite code
   * @param {string} inviteCode - The invite code
   * @returns {Object} Invitation data
   */
  async getInvitationByCode(inviteCode) {
    try {
      const params = {
        TableName: this.tableName,
        IndexName: 'InviteCodeIndex',
        KeyConditionExpression: 'inviteCode = :inviteCode',
        ExpressionAttributeValues: {
          ':inviteCode': inviteCode,
        },
      };

      const result = await dynamodb.query(params).promise();
      const invitation = result.Items?.[0];

      if (!invitation) {
        return {
          success: false,
          error: 'Invitation not found',
          message: 'Invalid invite code',
        };
      }

      return {
        success: true,
        data: invitation,
        message: 'Invitation found',
      };
    } catch (error) {
      console.error('Error getting invitation by code:', error);
      return {
        success: false,
        error: error.message,
        message: 'Failed to get invitation',
      };
    }
  }

  /**
   * Get all invitations for an event
   * @param {string} eventId - Event ID
   * @returns {Object} List of invitations
   */
  async getEventInvitations(eventId) {
    try {
      const params = {
        TableName: this.tableName,
        IndexName: 'EventInvitesIndex',
        KeyConditionExpression: 'invitedEventId = :eventId',
        ExpressionAttributeValues: {
          ':eventId': eventId,
        },
      };

      const result = await dynamodb.query(params).promise();

      return {
        success: true,
        data: result.Items || [],
        message: 'Event invitations retrieved successfully',
      };
    } catch (error) {
      console.error('Error getting event invitations:', error);
      return {
        success: false,
        error: error.message,
        message: 'Failed to get event invitations',
      };
    }
  }

  /**
   * Redeem an invitation code
   * @param {string} inviteCode - The invite code to redeem
   * @param {string} userId - User ID redeeming the code
   * @returns {Object} Redemption result
   */
  async redeemInvitation(inviteCode, userId) {
    try {
      // Get the invitation
      const invitationResult = await this.getInvitationByCode(inviteCode);
      if (!invitationResult.success) {
        return invitationResult;
      }

      const invitation = invitationResult.data;

      // Check if invitation is still valid
      if (invitation.usesLeft === 0) {
        return {
          success: false,
          error: 'Invitation expired',
          message: 'This invitation has no uses remaining',
        };
      }

      // Update uses left for non-infinite invitations
      if (invitation.usesLeft !== 'infinite') {
        const newUsesLeft = invitation.usesLeft - 1;

        const params = {
          TableName: this.tableName,
          Key: {
            PK: invitation.PK,
            SK: invitation.SK,
          },
          UpdateExpression: 'SET usesLeft = :usesLeft, updatedAt = :updatedAt',
          ExpressionAttributeValues: {
            ':usesLeft': newUsesLeft,
            ':updatedAt': new Date().toISOString(),
          },
          ConditionExpression: 'usesLeft > :zero',
          ExpressionAttributeValues: {
            ':usesLeft': newUsesLeft,
            ':updatedAt': new Date().toISOString(),
            ':zero': 0,
          },
        };

        await dynamodb.update(params).promise();
      }

      return {
        success: true,
        data: {
          eventId: invitation.invitedEventId,
          inviteCode: invitation.inviteCode,
          type: invitation.type,
        },
        message: 'Invitation redeemed successfully',
      };
    } catch (error) {
      console.error('Error redeeming invitation:', error);
      if (error.code === 'ConditionalCheckFailedException') {
        return {
          success: false,
          error: 'Invitation expired',
          message: 'This invitation has no uses remaining',
        };
      }
      return {
        success: false,
        error: error.message,
        message: 'Failed to redeem invitation',
      };
    }
  }

  /**
   * Delete an invitation
   * @param {string} inviteCode - The invite code to delete
   * @param {string} userId - User ID requesting deletion
   * @returns {Object} Deletion result
   */
  async deleteInvitation(inviteCode, userId) {
    try {
      // Get the invitation first to verify ownership
      const invitationResult = await this.getInvitationByCode(inviteCode);
      if (!invitationResult.success) {
        return invitationResult;
      }

      const invitation = invitationResult.data;

      // Check if user owns the invitation
      if (invitation.createdBy !== userId) {
        return {
          success: false,
          error: 'Unauthorized',
          message: 'You can only delete invitations you created',
        };
      }

      const params = {
        TableName: this.tableName,
        Key: {
          PK: invitation.PK,
          SK: invitation.SK,
        },
      };

      await dynamodb.delete(params).promise();

      return {
        success: true,
        message: 'Invitation deleted successfully',
      };
    } catch (error) {
      console.error('Error deleting invitation:', error);
      return {
        success: false,
        error: error.message,
        message: 'Failed to delete invitation',
      };
    }
  }
}

module.exports = InvitationService;
