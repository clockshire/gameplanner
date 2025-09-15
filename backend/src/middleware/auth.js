/**
 * Authentication middleware for Game Planner application
 * Validates user sessions and adds user context to requests
 */

const authService = require('../auth');

/**
 * Authentication middleware
 * Validates session token and adds user to request object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
async function authenticateUser(req, res, next) {
  try {
    // Get session token from Authorization header or query parameter
    const sessionToken =
      req.headers.authorization?.replace('Bearer ', '') || req.query.token;

    if (!sessionToken) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        code: 'MISSING_SESSION_TOKEN',
      });
    }

    // Get current user from session token
    const user = await authService.getCurrentUser(sessionToken);

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired session',
        code: 'INVALID_SESSION',
      });
    }

    // Add user to request object for use in route handlers
    req.user = user;
    next();
  } catch (error) {
    console.error('Authentication middleware error:', error);
    return res.status(500).json({
      success: false,
      error: 'Authentication error',
      code: 'AUTH_ERROR',
    });
  }
}

/**
 * Optional authentication middleware
 * Validates session token if present, but doesn't require it
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
async function optionalAuthenticateUser(req, res, next) {
  try {
    // Get session token from Authorization header or query parameter
    const sessionToken =
      req.headers.authorization?.replace('Bearer ', '') || req.query.token;

    if (sessionToken) {
      // Get current user from session token
      const user = await authService.getCurrentUser(sessionToken);
      if (user) {
        req.user = user;
      }
    }

    next();
  } catch (error) {
    console.error('Optional authentication middleware error:', error);
    // Don't fail the request, just continue without user context
    next();
  }
}

module.exports = {
  authenticateUser,
  optionalAuthenticateUser,
};
