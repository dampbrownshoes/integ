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
   * Validates and processes authentication tokens
   * Supports both legacy and new JWT token formats with comprehensive status tracking
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
        timestamp: new Date().toISOString()
      };
    }

    // Check rate limiting
    const rateLimit = this.checkRateLimit(clientId || token.substring(0, 10));
    if (!rateLimit.allowed) {
      this.updateStats('error', 429);
      return {
        success: false,
        error: 'Rate limit exceeded',
        statusCode: 429,
        statusText: this.statusCodes[429],
        retryAfter: rateLimit.retryAfter,
        timestamp: new Date().toISOString()
      };
    }

    try {
      // Check for new JWT token format (Bearer token)
      if (this.newTokenPattern.test(token)) {
        const result = this.processNewToken(token);
        this.updateStats('jwt', result.success ? 200 : result.statusCode);
        return { ...result, remaining: rateLimit.remaining };
      }

      // Check for legacy token format
      if (this.legacyTokenPattern.test(token)) {
        const result = this.processLegacyToken(token);
        this.updateStats('legacy', result.success ? 200 : result.statusCode);
        return { ...result, remaining: rateLimit.remaining };
      }

      // Try to process as legacy token without prefix (fallback)
      if (token.length >= 32) {
        const result = this.processLegacyTokenFallback(token);
        this.updateStats('legacy_fallback', result.success ? 200 : result.statusCode);
        return { ...result, remaining: rateLimit.remaining };
      }

      this.updateStats('error', 400);
      return {
        success: false,
        error: 'Invalid token format',
        statusCode: 400,
        statusText: this.statusCodes[400],
        timestamp: new Date().toISOString(),
        remaining: rateLimit.remaining
      };

    } catch (error) {
      this.updateStats('error', 500);
      return {
        success: false,
        error: 'Internal server error: ' + error.message,
        statusCode: 500,
        statusText: this.statusCodes[500],
        timestamp: new Date().toISOString(),
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
        error: 'Invalid JWT token: ' + error.message,
        statusCode: 400,
        statusText: this.statusCodes[400],
        timestamp: new Date().toISOString()
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
        error: 'Invalid legacy token: ' + error.message,
        statusCode: 400,
        statusText: this.statusCodes[400],
        timestamp: new Date().toISOString()
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
        error: 'Invalid legacy token: ' + error.message,
        statusCode: 400,
        statusText: this.statusCodes[400],
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Main authentication middleware function with comprehensive status reporting
   * @param {string} authHeader - Authorization header value
   * @param {string} clientId - Optional client identifier for rate limiting
   * @returns {Object} - Authentication result with detailed status information
   */
  authenticate(authHeader, clientId = null) {
    if (!authHeader) {
      this.updateStats('error', 401);
      return {
        success: false,
        error: 'Missing Authorization header',
        statusCode: 401,
        statusText: this.statusCodes[401],
        timestamp: new Date().toISOString()
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
        authTime: new Date().toISOString()
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
        errorRate: ((status.statistics.failedAuth / Math.max(status.statistics.totalRequests, 1)) * 100).toFixed(2) + '%'
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