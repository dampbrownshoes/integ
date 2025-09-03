const AuthHandler = require('../auth-handler');
const jwt = require('jsonwebtoken');

describe('AuthHandler', () => {
  let authHandler;

  beforeEach(() => {
    authHandler = new AuthHandler();
  });

  describe('generateToken', () => {
    it('should generate a valid token with new format', () => {
      const userId = 'user123';
      const deviceId = 'device456';
      
      const token = authHandler.generateToken(userId, deviceId);
      expect(token).toBeDefined();
      
      const decoded = jwt.decode(token);
      expect(decoded.uid).toBe(userId);
      expect(decoded.did).toBe(deviceId);
      expect(decoded.v).toBe(2);
    });
  });

  describe('verifyToken', () => {
    it('should verify new format tokens successfully', () => {
      const userId = 'user123';
      const deviceId = 'device456';
      
      const token = authHandler.generateToken(userId, deviceId);
      const result = authHandler.verifyToken(token);
      
      expect(result.userId).toBe(userId);
      expect(result.deviceId).toBe(deviceId);
      expect(result.tokenVersion).toBe('v2');
    });

    it('should accept legacy tokens (fix for 400 errors)', () => {
      // Simulate legacy token format that worked before the recent change
      const legacyPayload = {
        user_id: 'user123',  // Old format used underscores
        device_id: 'device456',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60)
        // No version field
      };
      
      const legacyToken = jwt.sign(legacyPayload, authHandler.secret);
      
      const result = authHandler.verifyToken(legacyToken);
      expect(result.userId).toBe('user123');
      expect(result.deviceId).toBe('device456');
      expect(result.tokenVersion).toBe('legacy');
    });

    it('should reject tokens without version field', () => {
      const payloadWithoutVersion = {
        uid: 'user123',
        did: 'device456',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60)
        // Missing version field
      };
      
      const token = jwt.sign(payloadWithoutVersion, authHandler.secret);
      
      expect(() => {
        authHandler.verifyToken(token);
      }).toThrow('Invalid token format');
    });
  });

  describe('validateRequest', () => {
    it('should validate requests with new format tokens', () => {
      const userId = 'user123';
      const deviceId = 'device456';
      
      const authHeaders = authHandler.generateAuthHeaders(userId, deviceId);
      const headers = {
        authorization: authHeaders.Authorization
      };
      
      const result = authHandler.validateRequest(headers);
      expect(result.userId).toBe(userId);
      expect(result.deviceId).toBe(deviceId);
    });

    it('should accept requests with legacy tokens (fix for 400 errors)', () => {
      // Legacy token that should now work after the fix
      const legacyPayload = {
        user_id: 'user123',
        device_id: 'device456',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60)
      };
      
      const legacyToken = jwt.sign(legacyPayload, authHandler.secret);
      const headers = {
        authorization: `Bearer ${legacyToken}`
      };
      
      const result = authHandler.validateRequest(headers);
      expect(result.userId).toBe('user123');
      expect(result.deviceId).toBe('device456');
      expect(result.tokenVersion).toBe('legacy');
    });
  });
});