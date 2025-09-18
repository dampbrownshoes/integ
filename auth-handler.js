/**
 * Mobile App Publishing Pipeline Auth Handler
 * Handles token validation for mobile app publishing authentication
 */

class AuthHandler {
  constructor() {
    this.NEW_TOKEN_PREFIX = 'mob_v2_';
    this.LEGACY_TOKEN_PREFIX = 'mob_';
  }

  /**
   * Validates authentication token
   * REVERTED: Now supports both v2 tokens and legacy tokens as fallback
   */
  validateToken(token) {
    if (!token) {
      console.log('[AUTH] Token validation failed: No token provided');
      throw new Error('Token is required');
    }

    const tokenPrefix = token.substring(0, 10); // Safe prefix for logging

    // Try new v2 token format first
    if (token.startsWith(this.NEW_TOKEN_PREFIX)) {
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
    
    // Fallback: Support legacy token format (REVERT of strict version check)
    if (token.startsWith(this.LEGACY_TOKEN_PREFIX) && !token.startsWith(this.NEW_TOKEN_PREFIX)) {
      const tokenData = token.substring(this.LEGACY_TOKEN_PREFIX.length);
      
      if (tokenData.length < 32) {
        console.log(`[AUTH] Token validation failed: Legacy token too short (${tokenData.length} chars, need 32+)`);
        throw new Error('Token too short');
      }

      console.log('[AUTH] Token validation successful: Legacy token format (fallback)');
      return {
        valid: true,
        userId: this.extractUserId(tokenData),
        tokenType: 'legacy'
      };
    }

    // Log token format mismatch for debugging
    console.log(`[AUTH] Token validation failed: Invalid format - prefix "${tokenPrefix}" does not match expected formats (${this.NEW_TOKEN_PREFIX} or ${this.LEGACY_TOKEN_PREFIX})`);
    throw new Error('Invalid token format');
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