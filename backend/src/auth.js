/**
 * Authentication service for Game Planner application
 * Handles honour-based email-only authentication for local development
 */

const { dynamodb } = require('./dynamodb');
const { v4: uuidv4 } = require('uuid');

/**
 * User authentication service
 */
class AuthService {
  /**
   * Create a new user account
   * @param {string} email - User's email address
   * @param {string} name - User's display name
   * @returns {Promise<Object>} Created user object
   */
  async signup(email, name) {
    try {
      // Validate email format
      if (!this.isValidEmail(email)) {
        throw new Error('Invalid email format');
      }

      // Check if user already exists
      const existingUser = await this.getUserByEmail(email);
      if (existingUser) {
        throw new Error('User with this email already exists');
      }

      // Create new user
      const userId = uuidv4();
      const user = {
        PK: `USER#${userId}`,
        SK: 'PROFILE',
        userId,
        email: email.toLowerCase(),
        name: name || email.split('@')[0],
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
        isActive: true,
      };

      // Save user to DynamoDB
      await dynamodb.put({
        TableName: 'users',
        Item: user,
        ConditionExpression: 'attribute_not_exists(PK)', // Prevent overwrites
      }).promise();

      // Return user without sensitive data
      return this.sanitizeUser(user);
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    }
  }

  /**
   * Authenticate user with email (honour-based)
   * @param {string} email - User's email address
   * @returns {Promise<Object>} User object and session token
   */
  async login(email) {
    try {
      // Validate email format
      if (!this.isValidEmail(email)) {
        throw new Error('Invalid email format');
      }

      // Find user by email
      const user = await this.getUserByEmail(email);
      if (!user) {
        throw new Error('User not found');
      }

      if (!user.isActive) {
        throw new Error('User account is inactive');
      }

      // Update last login time
      await dynamodb.update({
        TableName: 'users',
        Key: {
          PK: user.PK,
          SK: user.SK,
        },
        UpdateExpression: 'SET lastLoginAt = :lastLoginAt',
        ExpressionAttributeValues: {
          ':lastLoginAt': new Date().toISOString(),
        },
      }).promise();

      // Generate session token (simple UUID for local dev)
      const sessionToken = uuidv4();

      // Store session (in production, this would be in Redis or similar)
      await dynamodb.put({
        TableName: 'users',
        Item: {
          PK: `SESSION#${sessionToken}`,
          SK: 'ACTIVE',
          userId: user.userId,
          email: user.email,
          createdAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
        },
      }).promise();

      return {
        user: this.sanitizeUser(user),
        sessionToken,
      };
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  /**
   * Logout user by invalidating session
   * @param {string} sessionToken - User's session token
   * @returns {Promise<boolean>} Success status
   */
  async logout(sessionToken) {
    try {
      if (!sessionToken) {
        throw new Error('Session token required');
      }

      // Remove session from DynamoDB
      await dynamodb.delete({
        TableName: 'users',
        Key: {
          PK: `SESSION#${sessionToken}`,
          SK: 'ACTIVE',
        },
      }).promise();

      return true;
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  }

  /**
   * Get current user by session token
   * @param {string} sessionToken - User's session token
   * @returns {Promise<Object|null>} User object or null if invalid
   */
  async getCurrentUser(sessionToken) {
    try {
      if (!sessionToken) {
        return null;
      }

      // Get session
      const sessionResult = await dynamodb.get({
        TableName: 'users',
        Key: {
          PK: `SESSION#${sessionToken}`,
          SK: 'ACTIVE',
        },
      }).promise();

      if (!sessionResult.Item) {
        return null;
      }

      // Check if session is expired
      if (new Date(sessionResult.Item.expiresAt) < new Date()) {
        // Clean up expired session
        await this.logout(sessionToken);
        return null;
      }

      // Get user details
      const userResult = await dynamodb.get({
        TableName: 'users',
        Key: {
          PK: `USER#${sessionResult.Item.userId}`,
          SK: 'PROFILE',
        },
      }).promise();

      if (!userResult.Item || !userResult.Item.isActive) {
        return null;
      }

      return this.sanitizeUser(userResult.Item);
    } catch (error) {
      console.error('Get current user error:', error);
      return null;
    }
  }

  /**
   * Get user by email address
   * @param {string} email - User's email address
   * @returns {Promise<Object|null>} User object or null if not found
   */
  async getUserByEmail(email) {
    try {
      const result = await dynamodb.query({
        TableName: 'users',
        IndexName: 'EmailIndex',
        KeyConditionExpression: 'email = :email',
        ExpressionAttributeValues: {
          ':email': email.toLowerCase(),
        },
      }).promise();

      return result.Items && result.Items.length > 0 ? result.Items[0] : null;
    } catch (error) {
      console.error('Get user by email error:', error);
      return null;
    }
  }

  /**
   * Validate email format
   * @param {string} email - Email address to validate
   * @returns {boolean} True if valid email format
   */
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Remove sensitive data from user object
   * @param {Object} user - User object
   * @returns {Object} Sanitized user object
   */
  sanitizeUser(user) {
    const { PK, SK, ...sanitized } = user;
    return sanitized;
  }
}

module.exports = new AuthService();
