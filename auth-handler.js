/**
 * Authentication Handler
 * Supports both new token format and legacy token fallback
 */

class AuthHandler {
    constructor() {
        // New token format: Bearer JWT_TOKEN
        // Legacy token format: Basic BASE64_TOKEN or Token API_KEY
    }

    /**
     * Validates authentication token and extracts user information
     * @param {string} authHeader - Authorization header from request
     * @returns {Object} - { valid: boolean, userId: string, format: string, error?: string }
     */
    validateToken(authHeader) {
        if (!authHeader) {
            return { valid: false, error: 'No authorization header provided' };
        }

        try {
            // Try new token format first (Bearer JWT)
            const newFormatResult = this.validateNewFormat(authHeader);
            if (newFormatResult.valid) {
                return newFormatResult;
            }

            // Fallback to legacy token formats
            const legacyFormatResult = this.validateLegacyFormat(authHeader);
            if (legacyFormatResult.valid) {
                return legacyFormatResult;
            }

            return { valid: false, error: 'Invalid token format' };
        } catch (error) {
            return { valid: false, error: `Token validation failed: ${error.message}` };
        }
    }

    /**
     * Validates new JWT Bearer token format
     * @param {string} authHeader 
     * @returns {Object}
     */
    validateNewFormat(authHeader) {
        if (!authHeader.startsWith('Bearer ')) {
            return { valid: false, error: 'Not a Bearer token' };
        }

        const token = authHeader.substring(7); // Remove 'Bearer '
        
        // Simple JWT validation (in real app, would use proper JWT library)
        if (token.includes('.') && token.split('.').length === 3) {
            try {
                // Mock JWT payload extraction
                const payload = this.decodeJWTPayload(token);
                return {
                    valid: true,
                    userId: payload.sub || payload.userId,
                    format: 'jwt',
                    tokenData: payload
                };
            } catch (error) {
                return { valid: false, error: 'Invalid JWT token' };
            }
        }

        return { valid: false, error: 'Invalid JWT format' };
    }

    /**
     * Validates legacy token formats (Basic auth or Token auth)
     * @param {string} authHeader 
     * @returns {Object}
     */
    validateLegacyFormat(authHeader) {
        // Handle Basic auth format
        if (authHeader.startsWith('Basic ')) {
            const base64Token = authHeader.substring(6);
            try {
                const decoded = Buffer.from(base64Token, 'base64').toString('ascii');
                const [username, password] = decoded.split(':');
                
                if (username && password) {
                    return {
                        valid: true,
                        userId: username,
                        format: 'basic',
                        tokenData: { username, password }
                    };
                }
            } catch (error) {
                return { valid: false, error: 'Invalid Basic auth format' };
            }
        }

        // Handle Token/API key format
        if (authHeader.startsWith('Token ') || authHeader.startsWith('ApiKey ')) {
            const tokenType = authHeader.startsWith('Token ') ? 'token' : 'apikey';
            const token = authHeader.substring(tokenType === 'token' ? 6 : 7);
            
            if (token && token.length > 10) { // Basic validation
                // Mock user extraction from token
                const userId = this.extractUserFromApiToken(token);
                return {
                    valid: true,
                    userId: userId,
                    format: tokenType,
                    tokenData: { token }
                };
            }
        }

        return { valid: false, error: 'Unsupported legacy format' };
    }

    /**
     * Simple JWT payload decoder (mock implementation)
     * @param {string} token 
     * @returns {Object}
     */
    decodeJWTPayload(token) {
        const parts = token.split('.');
        if (parts.length !== 3) {
            throw new Error('Invalid JWT structure');
        }

        // Decode payload (second part)
        const payload = Buffer.from(parts[1], 'base64').toString('ascii');
        return JSON.parse(payload);
    }

    /**
     * Extract user ID from API token (mock implementation)
     * @param {string} token 
     * @returns {string}
     */
    extractUserFromApiToken(token) {
        // Mock implementation - in real app would look up in database
        return `user_${token.substring(0, 8)}`;
    }

    /**
     * Checks if user has permission to download images
     * @param {string} userId 
     * @param {string} albumId 
     * @returns {boolean}
     */
    hasImageDownloadPermission(userId, albumId) {
        // Mock permission check - in real app would check database/permissions
        return userId && albumId;
    }

    /**
     * Main authentication middleware function
     * @param {string} authHeader 
     * @param {string} albumId 
     * @returns {Object}
     */
    authenticateImageDownload(authHeader, albumId) {
        const authResult = this.validateToken(authHeader);
        
        if (!authResult.valid) {
            return {
                success: false,
                error: authResult.error,
                statusCode: 401
            };
        }

        const hasPermission = this.hasImageDownloadPermission(authResult.userId, albumId);
        
        if (!hasPermission) {
            return {
                success: false,
                error: 'Insufficient permissions for image download',
                statusCode: 403
            };
        }

        return {
            success: true,
            userId: authResult.userId,
            tokenFormat: authResult.format,
            statusCode: 200
        };
    }
}

module.exports = AuthHandler;