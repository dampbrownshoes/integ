const request = require('supertest');
const app = require('../index');
const jwt = require('jsonwebtoken');

describe('Mobile Onboarding API Integration Tests', () => {
  const secret = process.env.JWT_SECRET || 'mobile-onboarding-secret';

  describe('POST /api/mobile/onboard', () => {
    it('should successfully onboard a mobile user', async () => {
      const response = await request(app)
        .post('/api/mobile/onboard')
        .send({
          userId: 'user123',
          deviceId: 'device456'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.authHeaders.Authorization).toMatch(/^Bearer /);
      expect(response.body.authHeaders['X-Device-ID']).toBe('device456');
      expect(response.body.authHeaders['X-Auth-Version']).toBe('2.0');
    });
  });

  describe('GET /api/mobile/profile', () => {
    it('should accept new format tokens', async () => {
      // Generate a new format token
      const newPayload = {
        uid: 'user123',
        did: 'device456',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60),
        v: 2
      };
      const newToken = jwt.sign(newPayload, secret);

      const response = await request(app)
        .get('/api/mobile/profile')
        .set('Authorization', `Bearer ${newToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.user.userId).toBe('user123');
      expect(response.body.user.deviceId).toBe('device456');
      expect(response.body.user.tokenVersion).toBe('v2');
    });

    it('should accept legacy tokens (preventing 400 errors)', async () => {
      // Generate a legacy format token (pre-change format)
      const legacyPayload = {
        user_id: 'user789',  // Old format
        device_id: 'device012',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60)
        // No version field
      };
      const legacyToken = jwt.sign(legacyPayload, secret);

      const response = await request(app)
        .get('/api/mobile/profile')
        .set('Authorization', `Bearer ${legacyToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.user.userId).toBe('user789');
      expect(response.body.user.deviceId).toBe('device012');
      expect(response.body.user.tokenVersion).toBe('legacy');
    });

    it('should reject invalid tokens', async () => {
      const response = await request(app)
        .get('/api/mobile/profile')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(400);
      expect(response.body.error).toMatch(/Token verification failed/);
    });

    it('should reject missing authorization header', async () => {
      const response = await request(app)
        .get('/api/mobile/profile');

      expect(response.status).toBe(400);
      expect(response.body.error).toMatch(/Missing or invalid authorization header/);
    });
  });
});