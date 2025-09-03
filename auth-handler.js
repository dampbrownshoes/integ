const jwt = require('jsonwebtoken');
const crypto = require('crypto');

class AuthHandler {
  constructor() {
    this.secret = process.env.JWT_SECRET || 'mobile-onboarding-secret';
  }

  // NEW FORMAT: Problematic change that causes 400 errors
  // This format was changed recently and breaks mobile clients
  generateToken(userId, deviceId) {
    const payload = {
      uid: userId,  // Changed from 'user_id' to 'uid'
      did: deviceId, // Changed from 'device_id' to 'did'  
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24 hours
      v: 2 // New version field
    };
    
    return jwt.sign(payload, this.secret, { algorithm: 'HS256' });
  }

  // Verify token with fallback for legacy tokens (fixed to prevent 400 errors)
  verifyToken(token) {
    try {
      const decoded = jwt.verify(token, this.secret);
      
      // Try new format first
      if (decoded.uid && decoded.did && decoded.v === 2) {
        console.log(`[AUTH] New format token detected - userId: ${decoded.uid}, deviceId: ${decoded.did}`);
        return {
          userId: decoded.uid,
          deviceId: decoded.did,
          issuedAt: decoded.iat,
          expiresAt: decoded.exp,
          tokenVersion: 'v2'
        };
      }
      
      // Fallback to legacy format (pre-change format)
      if (decoded.user_id && decoded.device_id) {
        console.warn(`[AUTH] Legacy format token detected - userId: ${decoded.user_id}, deviceId: ${decoded.device_id}`);
        return {
          userId: decoded.user_id,
          deviceId: decoded.device_id,
          issuedAt: decoded.iat,
          expiresAt: decoded.exp,
          tokenVersion: 'legacy'
        };
      }
      
      // If neither format is valid
      console.error('[AUTH] Token format mismatch - neither new nor legacy format detected');
      throw new Error('Invalid token format - neither new nor legacy format detected');
      
    } catch (error) {
      if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
        console.error(`[AUTH] Token verification failed: ${error.message}`);
        throw new Error('Token verification failed: ' + error.message);
      }
      throw error;
    }
  }

  // Generate auth headers for mobile client
  generateAuthHeaders(userId, deviceId) {
    const token = this.generateToken(userId, deviceId);
    return {
      'Authorization': `Bearer ${token}`,
      'X-Device-ID': deviceId,
      'X-Auth-Version': '2.0'
    };
  }

  // Validate incoming request headers
  validateRequest(headers) {
    const authHeader = headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new Error('Missing or invalid authorization header');
    }

    const token = authHeader.split(' ')[1];
    return this.verifyToken(token);
  }
}

module.exports = AuthHandler;