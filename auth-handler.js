/**
 * Mobile Onboarding Auth Handler
 * Handles token validation for mobile app authentication
 */

class AuthHandler {
  constructor() {
    this.NEW_TOKEN_PREFIX = 'mob_v2_';
    this.LEGACY_TOKEN_PREFIX = 'mob_';
  }

  /**
   * Validates authentication token
   * Fixed: Now supports both v2 tokens and legacy tokens as fallback
   */
  validateToken(token) {
    if (!token) {
      throw new Error('Token is required');
    }

    // Try new v2 token format first
    if (token.startsWith(this.NEW_TOKEN_PREFIX)) {
      const tokenData = token.substring(this.NEW_TOKEN_PREFIX.length);
      
      if (tokenData.length < 32) {
        throw new Error('Token too short');
      }

      return {
        valid: true,
        userId: this.extractUserId(tokenData),
        tokenType: 'v2'
      };
    }
    
    // Fallback: Support legacy token format
    if (token.startsWith(this.LEGACY_TOKEN_PREFIX) && !token.startsWith(this.NEW_TOKEN_PREFIX)) {
      const tokenData = token.substring(this.LEGACY_TOKEN_PREFIX.length);
      
      if (tokenData.length < 32) {
        throw new Error('Token too short');
      }

      return {
        valid: true,
        userId: this.extractUserId(tokenData),
        tokenType: 'legacy'
      };
    }

    throw new Error('Invalid token format');
  }

  /**
   * Processes mobile onboarding request
   */
  processOnboardingRequest(authHeader) {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new Error('Invalid authorization header');
    }

    const token = authHeader.substring(7); // Remove 'Bearer '
    
    try {
      const validation = this.validateToken(token);
      return {
        status: 200,
        message: 'Onboarding authorized',
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