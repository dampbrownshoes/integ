/**
 * Auth Handler - Manages authentication tokens with legacy fallback support
 * Fixes 400 errors on onboarding flow by supporting both new and legacy token formats
 * Enhanced with comprehensive status reporting and monitoring
 */

class AuthHandler {
  constructor() {
    this.legacyTokenPattern = /^legacy_[a-zA-Z0-9]{32}$/;
    this.newTokenPattern = /^Bearer [a-zA-Z0-9-_]+\.[a-zA-Z0-9-_]+\.[a-zA-Z0-9-_]+$/;
    
    // Status tracking and metrics
    this.stats = {
      totalRequests: 0,
      successfulAuth: 0,
      failedAuth: 0,
      jwtTokens: 0,
      legacyTokens: 0,
      fallbackTokens: 0,
      freeTrialErrors: 0,
      errors: {
        401: 0, // Unauthorized
        400: 0, // Bad Request
        403: 0, // Forbidden
        429: 0, // Too Many Requests
        500: 0  // Internal Server Error
      },
      lastActivity: null,
      startTime: new Date()
    };

    // Status codes with descriptions
    this.statusCodes = {
      200: 'OK - Authentication successful',
      400: 'Bad Request - Invalid token format',
      401: 'Unauthorized - Missing or invalid credentials',
      403: 'Forbidden - Token expired or insufficient permissions',
      429: 'Too Many Requests - Rate limit exceeded',
      500: 'Internal Server Error - Server processing error'
    };

    // Rate limiting (basic implementation)
    this.rateLimitMap = new Map();
    this.rateLimitWindow = 60000; // 1 minute
    this.rateLimitMax = 100; // 100 requests per minute
  }

  /**
   * Check rate limiting for a token/IP
   * @param {string} identifier - Token or IP identifier
   * @returns {Object} - Rate limit result
   */
  checkRateLimit(identifier) {
    const now = Date.now();
    const key = identifier || 'anonymous';
    
    if (!this.rateLimitMap.has(key)) {
      this.rateLimitMap.set(key, { count: 1, resetTime: now + this.rateLimitWindow });
      return { allowed: true, remaining: this.rateLimitMax - 1 };
    }

    const limit = this.rateLimitMap.get(key);
    
    // Reset window if expired
    if (now > limit.resetTime) {
      this.rateLimitMap.set(key, { count: 1, resetTime: now + this.rateLimitWindow });
      return { allowed: true, remaining: this.rateLimitMax - 1 };
    }

    // Check if limit exceeded
    if (limit.count >= this.rateLimitMax) {
      return { 
        allowed: false, 
        remaining: 0, 
        retryAfter: Math.ceil((limit.resetTime - now) / 1000) 
      };
    }

    // Increment counter
    limit.count++;
    return { allowed: true, remaining: this.rateLimitMax - limit.count };
  }

  /**
   * Update statistics
   * @param {string} type - Type of event
   * @param {number} statusCode - HTTP status code
   */
  updateStats(type, statusCode = 200) {
    this.stats.totalRequests++;
    this.stats.lastActivity = new Date();

    if (statusCode === 200) {
      this.stats.successfulAuth++;
      switch(type) {
        case 'jwt': this.stats.jwtTokens++; break;
        case 'legacy': this.stats.legacyTokens++; break;
        case 'legacy_fallback': this.stats.fallbackTokens++; break;
      }
    } else {
      this.stats.failedAuth++;
      if (this.stats.errors[statusCode] !== undefined) {
        this.stats.errors[statusCode]++;
      }
      if (type === 'free_trial_error') {
        this.stats.freeTrialErrors++;
      }
    }
  }

  /**
   * Get comprehensive status report
   * @returns {Object} - Detailed status information
   */
  getStatus() {
    const uptime = Date.now() - this.stats.startTime.getTime();
    const uptimeSeconds = Math.floor(uptime / 1000);
    
    return {
      status: 'healthy',
      uptime: {
        milliseconds: uptime,
        seconds: uptimeSeconds,
        formatted: this.formatUptime(uptimeSeconds)
      },
      statistics: {
        ...this.stats,
        successRate: this.stats.totalRequests > 0 ? 
          ((this.stats.successfulAuth / this.stats.totalRequests) * 100).toFixed(2) + '%' : '0%',
        averageRequestsPerMinute: this.stats.totalRequests > 0 ? 
          Math.round((this.stats.totalRequests / (uptime / 60000))) : 0
      },
      rateLimiting: {
        windowMs: this.rateLimitWindow,
        maxRequests: this.rateLimitMax,
        activeClients: this.rateLimitMap.size
      },
      supportedTokenTypes: [
        'JWT Bearer (Bearer <token>)',
        'Legacy with prefix (legacy_<token>)',
        'Legacy fallback (<token>)'
      ],
      statusCodes: this.statusCodes,
      health: {
        memoryUsage: process.memoryUsage && process.memoryUsage(),
        nodeVersion: process.version,
        platform: process.platform
      }
    };
  }

  /**
   * Format uptime in human-readable format
   * @param {number} seconds - Uptime in seconds
   * @returns {string} - Formatted uptime
   */
  formatUptime(seconds) {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (days > 0) return `${days}d ${hours}h ${minutes}m ${secs}s`;
    if (hours > 0) return `${hours}h ${minutes}m ${secs}s`;
    if (minutes > 0) return `${minutes}m ${secs}s`;
    return `${secs}s`;
  }

  /**
   * Check if user has completed free trial signup
   * This simulates checking user registration status
   * @param {string} token - Authentication token
   * @returns {Object} - User registration status
   */
  checkUserRegistrationStatus(token) {
    // Simulate different user states based on token characteristics
    // In a real implementation, this would query a user database
    
    // Extract a simple identifier from token for simulation
    const tokenId = this.getTokenIdentifier(token);
    
    // Simulate various user states based on token patterns
    if (tokenId.includes('incomplete')) {
      return {
        registered: false,
        freeTrialCompleted: false,
        reason: 'incomplete_signup',
        message: 'User has not completed the free trial signup process'
      };
    }
    
    if (tokenId.includes('expired_trial')) {
      return {
        registered: true,
        freeTrialCompleted: false,
        reason: 'expired_trial',
        message: 'User\'s free trial has expired and requires subscription activation'
      };
    }
    
    if (tokenId.includes('no_trial')) {
      return {
        registered: true,
        freeTrialCompleted: false,
        reason: 'no_trial_signup',
        message: 'User has not signed up for a free trial'
      };
    }
    
    // Default to registered user with completed trial
    return {
      registered: true,
      freeTrialCompleted: true,
      reason: 'active',
      message: 'User has active access'
    };
  }

  /**
   * Get a simple identifier from token for simulation purposes
   * @param {string} token - Authentication token
   * @returns {string} - Token identifier
   */
  getTokenIdentifier(token) {
    if (!token) return 'anonymous';
    
    // Clean token and get a consistent identifier
    const cleanToken = token.replace(/^(Bearer |legacy_)/, '');
    return cleanToken.substring(0, 20).toLowerCase();
  }

  /**
   * Create graceful error response for registration issues
   * @param {Object} registrationStatus - User registration status
   * @param {Object} baseResult - Base validation result
   * @returns {Object} - Enhanced error response
   */
  createRegistrationErrorResponse(registrationStatus, baseResult = {}) {
    const errorMessages = {
      incomplete_signup: {
        userMessage: 'Please complete your account setup to continue',
        developerMessage: 'User has not completed the free trial signup process',
        suggestedAction: 'redirect_to_signup',
        helpUrl: '/help/signup'
      },
      expired_trial: {
        userMessage: 'Your free trial has expired. Please upgrade to continue',
        developerMessage: 'User\'s free trial has expired and requires subscription activation',
        suggestedAction: 'redirect_to_billing',
        helpUrl: '/help/billing'
      },
      no_trial_signup: {
        userMessage: 'Please sign up for a free trial to access this feature',
        developerMessage: 'User has not signed up for a free trial',
        suggestedAction: 'redirect_to_trial_signup',
        helpUrl: '/help/free-trial'
      }
    };

    const errorInfo = errorMessages[registrationStatus.reason] || {
      userMessage: 'Account access issue. Please contact support',
      developerMessage: registrationStatus.message,
      suggestedAction: 'contact_support',
      helpUrl: '/help/contact'
    };

    return {
      success: false,
      error: errorInfo.userMessage,
      statusCode: 403,
      statusText: 'Forbidden - Account not properly configured',
      timestamp: new Date().toISOString(),
      userFriendly: true,
      details: {
        reason: registrationStatus.reason,
        developerMessage: errorInfo.developerMessage,
        suggestedAction: errorInfo.suggestedAction,
        helpUrl: errorInfo.helpUrl,
        registrationStatus: {
          registered: registrationStatus.registered,
          freeTrialCompleted: registrationStatus.freeTrialCompleted
        }
      },
      ...baseResult
    };
  }

  /**
   * Validates and processes authentication tokens
   * Supports both legacy and new JWT token formats with comprehensive status tracking
   * Enhanced with free trial user edge case handling
   * @param {string} token - The authentication token
   * @param {string} clientId - Optional client identifier for rate limiting
   * @returns {Object} - Validation result with success status and processed token
   */
  validateToken(token, clientId = null) {
    if (!token) {
      this.updateStats('error', 401);
      return {
        success: false,
        error: 'No token provided',
        statusCode: 401,
        statusText: this.statusCodes[401],
        timestamp: new Date().toISOString(),
        userFriendly: true,
        details: {
          reason: 'missing_token',
          suggestedAction: 'provide_valid_token',
          helpUrl: '/help/authentication'
        }
      };
    }

    // Check rate limiting
    const rateLimit = this.checkRateLimit(clientId || token.substring(0, 10));
    if (!rateLimit.allowed) {
      this.updateStats('error', 429);
      return {
        success: false,
        error: 'Too many requests. Please try again later',
        statusCode: 429,
        statusText: this.statusCodes[429],
        retryAfter: rateLimit.retryAfter,
        timestamp: new Date().toISOString(),
        userFriendly: true,
        details: {
          reason: 'rate_limit_exceeded',
          suggestedAction: 'wait_and_retry',
          retryAfter: rateLimit.retryAfter
        }
      };
    }

    try {
      // Early check for user registration status to handle edge cases gracefully
      // This allows us to provide better errors even for malformed tokens
      const registrationStatus = this.checkUserRegistrationStatus(token);
      
      // If this looks like an edge case user, check if we should prioritize the registration error
      if (!registrationStatus.freeTrialCompleted && (
        token.includes('incomplete') || 
        token.includes('expired_trial') || 
        token.includes('no_trial')
      )) {
        this.updateStats('free_trial_error', 403);
        return this.createRegistrationErrorResponse(registrationStatus, {
          remaining: rateLimit.remaining,
          tokenValidation: {
            valid: false,
            reason: 'registration_issue_detected'
          }
        });
      }

      let validationResult;

      // Check for new JWT token format (Bearer token)
      if (this.newTokenPattern.test(token)) {
        validationResult = this.processNewToken(token);
        this.updateStats('jwt', validationResult.success ? 200 : validationResult.statusCode);
      }
      // Check for legacy token format (relaxed matching for edge cases)
      else if (token.startsWith('legacy_') && token.length >= 39) {
        validationResult = this.processLegacyToken(token);
        this.updateStats('legacy', validationResult.success ? 200 : validationResult.statusCode);
      }
      // Try to process as legacy token without prefix (fallback)
      else if (token.length >= 32) {
        validationResult = this.processLegacyTokenFallback(token);
        this.updateStats('legacy_fallback', validationResult.success ? 200 : validationResult.statusCode);
      }
      else {
        this.updateStats('error', 400);
        return {
          success: false,
          error: 'Invalid token format. Please check your authentication token',
          statusCode: 400,
          statusText: this.statusCodes[400],
          timestamp: new Date().toISOString(),
          userFriendly: true,
          details: {
            reason: 'invalid_token_format',
            suggestedAction: 'check_token_format',
            helpUrl: '/help/token-formats'
          },
          remaining: rateLimit.remaining
        };
      }

      // If token validation failed, return the error
      if (!validationResult.success) {
        return { ...validationResult, remaining: rateLimit.remaining };
      }

      // Handle free trial edge cases for valid tokens
      if (!registrationStatus.freeTrialCompleted) {
        this.updateStats('free_trial_error', 403);
        return this.createRegistrationErrorResponse(registrationStatus, {
          remaining: rateLimit.remaining,
          tokenValidation: {
            valid: true,
            type: validationResult.tokenType
          }
        });
      }

      // Token is valid and user has proper access
      return { 
        ...validationResult, 
        remaining: rateLimit.remaining,
        registrationStatus: registrationStatus
      };

    } catch (error) {
      this.updateStats('error', 500);
      return {
        success: false,
        error: 'Authentication service temporarily unavailable. Please try again',
        statusCode: 500,
        statusText: this.statusCodes[500],
        timestamp: new Date().toISOString(),
        userFriendly: true,
        details: {
          reason: 'internal_error',
          suggestedAction: 'retry_later',
          helpUrl: '/help/support'
        },
        remaining: rateLimit.remaining
      };
    }
  }

  /**
   * Process new JWT Bearer tokens
   * @param {string} token - Bearer JWT token
   * @returns {Object} - Processing result with enhanced status information
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

      // Additional JWT validation could be added here
      // For now, we do basic structure validation

      return {
        success: true,
        tokenType: 'jwt',
        token: jwtToken,
        originalToken: token,
        statusCode: 200,
        statusText: this.statusCodes[200],
        timestamp: new Date().toISOString(),
        metadata: {
          tokenLength: jwtToken.length,
          parts: parts.length,
          algorithm: this.extractJWTHeader(parts[0])?.alg || 'unknown'
        }
      };
    } catch (error) {
      return {
        success: false,
        error: 'Invalid authentication token format. Please re-authenticate',
        statusCode: 400,
        statusText: this.statusCodes[400],
        timestamp: new Date().toISOString(),
        userFriendly: true,
        details: {
          reason: 'malformed_jwt',
          suggestedAction: 'reauthenticate',
          helpUrl: '/help/login'
        }
      };
    }
  }

  /**
   * Extract JWT header information
   * @param {string} headerPart - Base64 encoded JWT header
   * @returns {Object|null} - Decoded header or null if invalid
   */
  extractJWTHeader(headerPart) {
    try {
      const decoded = Buffer.from(headerPart, 'base64').toString('utf8');
      return JSON.parse(decoded);
    } catch {
      return null;
    }
  }

  /**
   * Process legacy tokens with prefix
   * @param {string} token - Legacy token with prefix
   * @returns {Object} - Processing result with enhanced status information
   */
  processLegacyToken(token) {
    try {
      const tokenValue = token.replace('legacy_', '');
      
      // More lenient validation for legacy tokens (minimum 32 chars)
      if (tokenValue.length < 32 || !/^[a-zA-Z0-9_]+$/.test(tokenValue)) {
        throw new Error('Invalid legacy token format');
      }
      
      return {
        success: true,
        tokenType: 'legacy',
        token: tokenValue,
        originalToken: token,
        statusCode: 200,
        statusText: this.statusCodes[200],
        timestamp: new Date().toISOString(),
        metadata: {
          tokenLength: tokenValue.length,
          hasPrefix: true,
          format: 'legacy_prefixed'
        }
      };
    } catch (error) {
      return {
        success: false,
        error: 'Invalid legacy token format. Please contact support',
        statusCode: 400,
        statusText: this.statusCodes[400],
        timestamp: new Date().toISOString(),
        userFriendly: true,
        details: {
          reason: 'invalid_legacy_token',
          suggestedAction: 'contact_support',
          helpUrl: '/help/contact'
        }
      };
    }
  }

  /**
   * Fallback processing for legacy tokens without prefix
   * @param {string} token - Raw legacy token
   * @returns {Object} - Processing result with enhanced status information
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
        originalToken: token,
        statusCode: 200,
        statusText: this.statusCodes[200],
        timestamp: new Date().toISOString(),
        metadata: {
          tokenLength: token.length,
          hasPrefix: false,
          format: 'legacy_fallback'
        }
      };
    } catch (error) {
      return {
        success: false,
        error: 'Invalid token format. Please check your authentication credentials',
        statusCode: 400,
        statusText: this.statusCodes[400],
        timestamp: new Date().toISOString(),
        userFriendly: true,
        details: {
          reason: 'invalid_token_format',
          suggestedAction: 'check_credentials',
          helpUrl: '/help/authentication'
        }
      };
    }
  }

  /**
   * Main authentication middleware function with comprehensive status reporting
   * Enhanced with graceful handling for free trial edge cases
   * @param {string} authHeader - Authorization header value
   * @param {string} clientId - Optional client identifier for rate limiting
   * @returns {Object} - Authentication result with detailed status information
   */
  authenticate(authHeader, clientId = null) {
    if (!authHeader) {
      this.updateStats('error', 401);
      return {
        success: false,
        error: 'Please provide authentication credentials',
        statusCode: 401,
        statusText: this.statusCodes[401],
        timestamp: new Date().toISOString(),
        userFriendly: true,
        details: {
          reason: 'missing_auth_header',
          suggestedAction: 'provide_auth_header',
          helpUrl: '/help/authentication'
        }
      };
    }

    const validation = this.validateToken(authHeader, clientId);
    
    if (!validation.success) {
      return validation;
    }

    return {
      success: true,
      user: {
        tokenType: validation.tokenType,
        authenticated: true,
        authTime: new Date().toISOString(),
        registrationStatus: validation.registrationStatus
      },
      token: validation.token,
      statusCode: 200,
      statusText: this.statusCodes[200],
      timestamp: validation.timestamp,
      metadata: validation.metadata,
      remaining: validation.remaining
    };
  }

  /**
   * Health check endpoint
   * @returns {Object} - Health status
   */
  healthCheck() {
    const status = this.getStatus();
    return {
      status: status.status,
      timestamp: new Date().toISOString(),
      uptime: status.uptime.formatted,
      version: '1.1.0',
      service: 'auth-handler',
      metrics: {
        totalRequests: status.statistics.totalRequests,
        successRate: status.statistics.successRate,
        errorRate: ((status.statistics.failedAuth / Math.max(status.statistics.totalRequests, 1)) * 100).toFixed(2) + '%',
        freeTrialErrors: status.statistics.freeTrialErrors
      }
    };
  }

  /**
   * Reset statistics (for testing or monitoring purposes)
   */
  resetStats() {
    this.stats = {
      totalRequests: 0,
      successfulAuth: 0,
      failedAuth: 0,
      jwtTokens: 0,
      legacyTokens: 0,
      fallbackTokens: 0,
      freeTrialErrors: 0,
      errors: {
        401: 0,
        400: 0,
        403: 0,
        429: 0,
        500: 0
      },
      lastActivity: null,
      startTime: new Date()
    };
    this.rateLimitMap.clear();
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