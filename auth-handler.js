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

  // Verify token with new format only (causes failures for legacy tokens)
  verifyToken(token) {
    try {
      const decoded = jwt.verify(token, this.secret);
      
      // Strict validation for new format only
      if (!decoded.uid || !decoded.did || decoded.v !== 2) {
        throw new Error('Invalid token format');
      }
      
      return {
        userId: decoded.uid,
        deviceId: decoded.did,
        issuedAt: decoded.iat,
        expiresAt: decoded.exp
      };
    } catch (error) {
      throw new Error('Token verification failed: ' + error.message);
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