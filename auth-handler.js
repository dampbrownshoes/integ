/**
 * Mobile Onboarding Authentication Handler
 * Handles token validation and authentication for mobile onboarding flow
 */

class AuthHandler {
  constructor(config = {}) {
    this.config = {
      tokenVersion: '2.0',
      requireStrictFormat: true,
      ...config
    };
  }

  /**
   * Validates authentication token for mobile onboarding
   * @param {string} token - Authentication token
   * @param {Object} headers - Request headers
   * @returns {Object} Validation result
   */
  validateToken(token, headers = {}) {
    if (!token) {
      return { valid: false, error: 'No token provided', statusCode: 401 };
    }

    // Current implementation - strict v2.0 format only
    // This is the "problematic change" that causes 400 errors
    const tokenParts = token.split('.');
    
    // Require new v2.0 format: bearer.version.payload.signature
    if (tokenParts.length !== 4 || tokenParts[1] !== '2' || tokenParts[0] !== 'bearer') {
      return { 
        valid: false, 
        error: 'Invalid token format - expected v2.0 format', 
        statusCode: 400 
      };
    }

    try {
      const payload = JSON.parse(atob(tokenParts[2]));
      
      if (!payload.userId || !payload.exp) {
        return { valid: false, error: 'Invalid token payload', statusCode: 400 };
      }

      if (Date.now() > payload.exp * 1000) {
        return { valid: false, error: 'Token expired', statusCode: 401 };
      }

      return {
        valid: true,
        userId: payload.userId,
        exp: payload.exp,
        version: '2.0'
      };
    } catch (error) {
      return { valid: false, error: 'Token parsing failed', statusCode: 400 };
    }
  }

  /**
   * Middleware for Express.js to validate mobile onboarding requests
   */
  middleware() {
    return (req, res, next) => {
      const authHeader = req.headers.authorization;
      const token = authHeader && authHeader.startsWith('Bearer ') 
        ? authHeader.substring(7) 
        : null;

      const result = this.validateToken(token, req.headers);
      
      if (!result.valid) {
        return res.status(result.statusCode).json({
          error: result.error,
          code: 'AUTH_VALIDATION_FAILED'
        });
      }

      req.user = {
        userId: result.userId,
        tokenVersion: result.version
      };
      
      next();
    };
  }
}

module.exports = AuthHandler;