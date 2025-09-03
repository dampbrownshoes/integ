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
      console.warn('[Auth] Token validation failed: No token provided');
      return { valid: false, error: 'No token provided', statusCode: 401 };
    }

    const tokenParts = token.split('.');
    const maskedToken = this._maskToken(token);
    
    // Try v2.0 format first: bearer.version.payload.signature
    if (tokenParts.length === 4 && tokenParts[1] === '2' && tokenParts[0] === 'bearer') {
      console.log(`[Auth] Attempting v2.0 token validation for token: ${maskedToken}`);
      return this._validateV2Token(tokenParts);
    }
    
    // Log v2.0 format mismatch details
    if (tokenParts.length !== 4) {
      console.warn(`[Auth] Token format mismatch: Expected 4 parts for v2.0, got ${tokenParts.length} parts. Token: ${maskedToken}`);
    } else if (tokenParts[1] !== '2') {
      console.warn(`[Auth] Token version mismatch: Expected version '2' for v2.0, got '${tokenParts[1]}'. Token: ${maskedToken}`);
    } else if (tokenParts[0] !== 'bearer') {
      console.warn(`[Auth] Token prefix mismatch: Expected 'bearer' for v2.0, got '${tokenParts[0]}'. Token: ${maskedToken}`);
    }
    
    // Fallback to legacy v1.0 format: legacy.version.payload or prefix.version.payload
    if (tokenParts.length >= 3) {
      console.log(`[Auth] Falling back to legacy v1.0 token validation for token: ${maskedToken}`);
      return this._validateLegacyToken(tokenParts);
    }

    console.warn(`[Auth] Token format completely unsupported: Expected at least 3 parts, got ${tokenParts.length} parts. Token: ${maskedToken}`);
    return { 
      valid: false, 
      error: 'Invalid token format - unsupported format', 
      statusCode: 400 
    };
  }

  /**
   * Validates v2.0 format tokens
   * @private
   */
  _validateV2Token(tokenParts) {
    try {
      const payload = JSON.parse(atob(tokenParts[2]));
      
      if (!payload.userId || !payload.exp) {
        console.warn('[Auth] v2.0 token validation failed: Invalid payload structure - missing userId or exp');
        return { valid: false, error: 'Invalid token payload', statusCode: 400 };
      }

      if (Date.now() > payload.exp * 1000) {
        console.warn('[Auth] v2.0 token validation failed: Token expired');
        return { valid: false, error: 'Token expired', statusCode: 401 };
      }

      console.log(`[Auth] v2.0 token validation successful for userId: ${payload.userId}`);
      return {
        valid: true,
        userId: payload.userId,
        exp: payload.exp,
        version: '2.0'
      };
    } catch (error) {
      console.warn(`[Auth] v2.0 token validation failed: Token parsing error - ${error.message}`);
      return { valid: false, error: 'Token parsing failed', statusCode: 400 };
    }
  }

  /**
   * Validates legacy v1.0 format tokens
   * @private
   */
  _validateLegacyToken(tokenParts) {
    try {
      // Legacy format: prefix.version.payload (v1.0 tokens)
      const versionIndex = 1;
      const payloadIndex = 2;
      
      // Check if it's a v1.0 token
      if (tokenParts[versionIndex] === '1') {
        const payload = JSON.parse(atob(tokenParts[payloadIndex]));
        
        if (!payload.userId || !payload.exp) {
          console.warn('[Auth] Legacy token validation failed: Invalid payload structure - missing userId or exp');
          return { valid: false, error: 'Invalid legacy token payload', statusCode: 400 };
        }

        if (Date.now() > payload.exp * 1000) {
          console.warn('[Auth] Legacy token validation failed: Token expired');
          return { valid: false, error: 'Token expired', statusCode: 401 };
        }

        console.log(`[Auth] Legacy v1.0 token validation successful for userId: ${payload.userId}`);
        return {
          valid: true,
          userId: payload.userId,
          exp: payload.exp,
          version: '1.0',
          legacy: true
        };
      }
      
      console.warn(`[Auth] Legacy token validation failed: Unsupported version '${tokenParts[versionIndex]}' - expected '1'`);
      return { 
        valid: false, 
        error: 'Unsupported token version', 
        statusCode: 400 
      };
    } catch (error) {
      console.warn(`[Auth] Legacy token validation failed: Token parsing error - ${error.message}`);
      return { valid: false, error: 'Legacy token parsing failed', statusCode: 400 };
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
        tokenVersion: result.version,
        isLegacyToken: result.legacy || false
      };
      
      next();
    };
  }

  /**
   * Masks token for safe logging
   * @private
   */
  _maskToken(token) {
    if (!token || token.length < 10) {
      return '[INVALID_TOKEN]';
    }
    const start = token.substring(0, 6);
    const end = token.substring(token.length - 4);
    return `${start}...${end}`;
  }
}

module.exports = AuthHandler;