/**
 * Tests for AuthHandler
 */

const AuthHandler = require('../auth-handler');
const jwt = require('jsonwebtoken');

describe('AuthHandler', () => {
    let authHandler;

    beforeEach(() => {
        authHandler = new AuthHandler();
    });

    describe('generateToken', () => {
        it('should generate a valid JWT token', () => {
            const userId = 'user123';
            const token = authHandler.generateToken(userId);
            
            expect(token).toBeDefined();
            expect(typeof token).toBe('string');
            
            const decoded = jwt.verify(token, authHandler.secret);
            expect(decoded.userId).toBe(userId);
            expect(decoded.type).toBe('mobile-onboarding');
        });
    });

    describe('validateToken', () => {
        it('should validate a valid legacy token', () => {
            const userId = 'user123';
            const token = authHandler.generateToken(userId);
            
            const result = authHandler.validateToken(token);
            
            expect(result).toBeDefined();
            expect(result.userId).toBe(userId);
            expect(result.type).toBe('mobile-onboarding');
            expect(result.isLegacy).toBe(true);
        });

        it('should return null for invalid token', () => {
            const result = authHandler.validateToken('invalid-token');
            expect(result).toBeNull();
        });

        it('should return null for token with wrong signature', () => {
            const fakeToken = jwt.sign({ userId: 'user123' }, 'wrong-secret');
            const result = authHandler.validateToken(fakeToken);
            expect(result).toBeNull();
        });
    });

    describe('authenticateRequest', () => {
        let req, res, next;

        beforeEach(() => {
            req = { headers: {} };
            res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };
            next = jest.fn();
        });

        it('should authenticate valid request with Bearer token', () => {
            const userId = 'user123';
            const token = authHandler.generateToken(userId);
            req.headers.authorization = `Bearer ${token}`;
            
            authHandler.authenticateRequest(req, res, next);
            
            expect(next).toHaveBeenCalled();
            expect(req.user).toBeDefined();
            expect(req.user.userId).toBe(userId);
        });

        it('should return 401 for request without authorization header', () => {
            authHandler.authenticateRequest(req, res, next);
            
            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({ error: 'No authorization header provided' });
            expect(next).not.toHaveBeenCalled();
        });

        it('should return 401 for invalid token', () => {
            req.headers.authorization = 'Bearer invalid-token';
            
            authHandler.authenticateRequest(req, res, next);
            
            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({ error: 'Invalid or expired token' });
            expect(next).not.toHaveBeenCalled();
        });
    });
});