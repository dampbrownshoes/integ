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
     * Validates incoming authentication tokens with fallback for legacy tokens
     * @param {string} token - The authentication token
     * @returns {Object} - Decoded token payload or null if invalid
     */
    validateToken(token) {
        try {
            const decoded = jwt.verify(token, this.secret);
            
            // Check for enhanced token format first (v2.0)
            if (decoded.userId && decoded.type === 'mobile-onboarding' && 
                decoded.deviceId && decoded.sessionId && decoded.version === '2.0') {
                console.log('Token validation successful: Enhanced format detected');
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
            
            // Fallback to legacy token format (v1.0) - for backward compatibility
            if (decoded.userId && decoded.type === 'mobile-onboarding') {
                console.log('Token validation successful: Legacy format detected');
                return {
                    userId: decoded.userId,
                    type: decoded.type,
                    timestamp: decoded.iat,
                    isLegacy: true
                };
            }
            
            // Log token format mismatch for debugging
            console.warn('Token format mismatch detected:', {
                hasUserId: !!decoded.userId,
                tokenType: decoded.type || 'missing',
                hasDeviceId: !!decoded.deviceId,
                hasSessionId: !!decoded.sessionId,
                version: decoded.version || 'missing',
                expectedTypes: ['mobile-onboarding'],
                receivedFields: Object.keys(decoded).filter(key => key !== 'iat' && key !== 'exp')
            });
            
            return null;
        } catch (error) {
            console.error('Token validation failed:', error.message);
            return null;
        }
    }

    /**
     * Generates a new authentication token for mobile onboarding
     * @param {string} userId - The user ID
     * @param {string} deviceId - Optional device ID (for enhanced format)
     * @param {string} sessionId - Optional session ID (for enhanced format)
     * @returns {string} - JWT token
     */
    generateToken(userId, deviceId, sessionId) {
        // If deviceId and sessionId are provided, generate enhanced token
        if (deviceId && sessionId) {
            const payload = {
                userId: userId,
                type: 'mobile-onboarding',
                deviceId: deviceId,
                sessionId: sessionId,
                version: '2.0',
                iat: Math.floor(Date.now() / 1000)
            };
            return jwt.sign(payload, this.secret);
        }
        
        // Otherwise, generate legacy token for backward compatibility
        const payload = {
            userId: userId,
            type: 'mobile-onboarding',
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