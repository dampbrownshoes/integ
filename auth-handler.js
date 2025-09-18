/**
 * Mobile App Publishing Pipeline Auth Handler
 * Handles token validation for mobile app publishing authentication
 */

class AuthHandler {
  constructor() {
    this.NEW_TOKEN_PREFIX = 'mob_v2_';
  }

  /**
   * Validates authentication token
   * STRICT VERSION: Only supports new v2 tokens - DROPS legacy SDK apps
   */
  validateToken(token) {
    if (!token) {
      console.log('[AUTH] Token validation failed: No token provided');
      throw new Error('Token is required');
    }

    // STRICT CHECK: Only accept new v2 token format
    if (!token.startsWith(this.NEW_TOKEN_PREFIX)) {
      console.log(`[AUTH] Token validation failed: Legacy token format not supported`);
      throw new Error('Legacy token format not supported. Please update your SDK.');
    }

    const tokenData = token.substring(this.NEW_TOKEN_PREFIX.length);
    
    if (tokenData.length < 32) {
      console.log(`[AUTH] Token validation failed: V2 token too short (${tokenData.length} chars, need 32+)`);
      throw new Error('Token too short');
    }

    console.log('[AUTH] Token validation successful: V2 token format');
    return {
      valid: true,
      userId: this.extractUserId(tokenData),
      tokenType: 'v2'
    };
  }

  /**
   * Processes mobile app publishing request
   */
  processPublishingRequest(authHeader) {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new Error('Invalid authorization header');
    }

    const token = authHeader.substring(7); // Remove 'Bearer '
    
    try {
      const validation = this.validateToken(token);
      return {
        status: 200,
        message: 'Publishing authorized',
        user: validation.userId,
        tokenType: validation.tokenType
      };
    } catch (error) {
      return {
        status: 400,
        message: error.message,
        error: 'INVALID_TOKEN'
      };
    }
  }

  extractUserId(tokenData) {
    // Simplified user ID extraction
    return tokenData.substring(0, 8);
  }
}

module.exports = AuthHandler;