/**
 * Authentication handler for mobile onboarding flow
 * Handles token validation and user authentication
 */

const jwt = require('jsonwebtoken');

class AuthHandler {
    constructor() {
        this.secret = process.env.JWT_SECRET || 'default-secret';
    }

    /**
     * Validates incoming authentication tokens
     * @param {string} token - The authentication token
     * @returns {Object} - Decoded token payload or null if invalid
     */
    validateToken(token) {
        try {
            // NEW TOKEN FORMAT: enhanced JWT with additional security fields
            const decoded = jwt.verify(token, this.secret);
            
            // New tokens require enhanced structure with mandatory security fields
            if (decoded.userId && decoded.type === 'mobile-onboarding' && 
                decoded.deviceId && decoded.sessionId && decoded.version === '2.0') {
                return {
                    userId: decoded.userId,
                    type: decoded.type,
                    deviceId: decoded.deviceId,
                    sessionId: decoded.sessionId,
                    version: decoded.version,
                    timestamp: decoded.iat,
                    isLegacy: false
                };
            }
            
            // Reject tokens that don't match new format
            return null;
        } catch (error) {
            console.error('Token validation failed:', error.message);
            return null;
        }
    }

    /**
     * Generates a new authentication token for mobile onboarding
     * @param {string} userId - The user ID
     * @param {string} deviceId - The device ID (required for new format)
     * @param {string} sessionId - The session ID (required for new format)
     * @returns {string} - JWT token
     */
    generateToken(userId, deviceId, sessionId) {
        const payload = {
            userId: userId,
            type: 'mobile-onboarding',
            deviceId: deviceId || 'unknown',
            sessionId: sessionId || 'unknown',
            version: '2.0',
            iat: Math.floor(Date.now() / 1000)
        };
        
        return jwt.sign(payload, this.secret);
    }

    /**
     * Middleware for Express routes to validate authentication
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * @param {Function} next - Next middleware function
     */
    authenticateRequest(req, res, next) {
        const authHeader = req.headers.authorization;
        
        if (!authHeader) {
            return res.status(401).json({ error: 'No authorization header provided' });
        }

        const token = authHeader.replace('Bearer ', '');
        const validatedToken = this.validateToken(token);

        if (!validatedToken) {
            return res.status(401).json({ error: 'Invalid or expired token' });
        }

        req.user = validatedToken;
        next();
    }
}

module.exports = AuthHandler;