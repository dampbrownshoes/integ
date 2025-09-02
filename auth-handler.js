/**
 * Auth Handler - Manages authentication tokens with legacy fallback support
 * Fixes 400 errors on onboarding flow by supporting both new and legacy token formats
 */

class AuthHandler {
  constructor() {
    this.legacyTokenPattern = /^legacy_[a-zA-Z0-9]{32,}$/;
    this.newTokenPattern = /^Bearer [a-zA-Z0-9-_]+\.[a-zA-Z0-9-_]+\.[a-zA-Z0-9-_]+$/;
  }

  /**
   * Validates and processes authentication tokens
   * Supports both legacy and new JWT token formats
   * @param {string} token - The authentication token
   * @returns {Object} - Validation result with success status and processed token
   */
  validateToken(token) {
    if (!token) {
      return {
        success: false,
        error: 'No token provided',
        statusCode: 401
      };
    }

    // Check for new JWT token format (Bearer token)
    if (this.newTokenPattern.test(token)) {
      return this.processNewToken(token);
    }

    // Check for legacy token format
    if (this.legacyTokenPattern.test(token)) {
      return this.processLegacyToken(token);
    }

    // Try to process as legacy token without prefix (fallback)
    if (token.length >= 32) {
      return this.processLegacyTokenFallback(token);
    }

    return {
      success: false,
      error: 'Invalid token format',
      statusCode: 400
    };
  }

  /**
   * Process new JWT Bearer tokens
   * @param {string} token - Bearer JWT token
   * @returns {Object} - Processing result
   */
  processNewToken(token) {
    try {
      // Extract JWT token from Bearer prefix
      const jwtToken = token.replace('Bearer ', '');
      
      // Basic JWT structure validation (header.payload.signature)
      const parts = jwtToken.split('.');
      if (parts.length !== 3) {
        throw new Error('Invalid JWT structure');
      }

      return {
        success: true,
        tokenType: 'jwt',
        token: jwtToken,
        originalToken: token
      };
    } catch (error) {
      return {
        success: false,
        error: 'Invalid JWT token: ' + error.message,
        statusCode: 400
      };
    }
  }

  /**
   * Process legacy tokens with prefix
   * @param {string} token - Legacy token with prefix
   * @returns {Object} - Processing result
   */
  processLegacyToken(token) {
    try {
      const tokenValue = token.replace('legacy_', '');
      
      return {
        success: true,
        tokenType: 'legacy',
        token: tokenValue,
        originalToken: token
      };
    } catch (error) {
      return {
        success: false,
        error: 'Invalid legacy token: ' + error.message,
        statusCode: 400
      };
    }
  }

  /**
   * Fallback processing for legacy tokens without prefix
   * @param {string} token - Raw legacy token
   * @returns {Object} - Processing result
   */
  processLegacyTokenFallback(token) {
    try {
      // Validate token length and characters for legacy format
      if (!/^[a-zA-Z0-9]{32,}$/.test(token)) {
        throw new Error('Invalid legacy token format');
      }

      return {
        success: true,
        tokenType: 'legacy_fallback',
        token: token,
        originalToken: token
      };
    } catch (error) {
      return {
        success: false,
        error: 'Invalid legacy token: ' + error.message,
        statusCode: 400
      };
    }
  }

  /**
   * Main authentication middleware function
   * @param {string} authHeader - Authorization header value
   * @returns {Object} - Authentication result
   */
  authenticate(authHeader) {
    if (!authHeader) {
      return {
        success: false,
        error: 'Missing Authorization header',
        statusCode: 401
      };
    }

    const validation = this.validateToken(authHeader);
    
    if (!validation.success) {
      return validation;
    }

    return {
      success: true,
      user: {
        tokenType: validation.tokenType,
        authenticated: true
      },
      token: validation.token
    };
  }
}

// Export for Node.js environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AuthHandler;
}

// Export for browser/other environments
if (typeof window !== 'undefined') {
  window.AuthHandler = AuthHandler;
}