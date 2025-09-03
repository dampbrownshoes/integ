/**
 * Integration tests for mobile onboarding API
 */

const request = require('supertest');
const app = require('../index');
const AuthHandler = require('../auth-handler');

describe('Mobile Onboarding API', () => {
    let authHandler;

    beforeEach(() => {
        authHandler = new AuthHandler();
    });

    describe('POST /api/mobile/onboard', () => {
        it('should successfully onboard with legacy token', async () => {
            const userId = 'user123';
            const token = authHandler.generateToken(userId);
            
            const response = await request(app)
                .post('/api/mobile/onboard')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    userId: userId,
                    deviceInfo: { platform: 'ios', version: '15.0' }
                });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.userId).toBe(userId);
            expect(response.body.tokenType).toBe('legacy');
        });

        it('should successfully onboard with enhanced token', async () => {
            const userId = 'user123';
            const deviceId = 'device456';
            const sessionId = 'session789';
            const token = authHandler.generateToken(userId, deviceId, sessionId);
            
            const response = await request(app)
                .post('/api/mobile/onboard')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    userId: userId,
                    deviceInfo: { platform: 'android', version: '12.0' }
                });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.userId).toBe(userId);
            expect(response.body.tokenType).toBe('enhanced');
        });

        it('should return 401 without authorization header', async () => {
            const response = await request(app)
                .post('/api/mobile/onboard')
                .send({
                    userId: 'user123',
                    deviceInfo: { platform: 'ios', version: '15.0' }
                });

            expect(response.status).toBe(401);
            expect(response.body.error).toBe('No authorization header provided');
        });
    });

    describe('POST /api/auth/token', () => {
        it('should generate legacy token for userId only', async () => {
            const response = await request(app)
                .post('/api/auth/token')
                .send({ userId: 'user123' });

            expect(response.status).toBe(200);
            expect(response.body.token).toBeDefined();
            expect(response.body.format).toBe('legacy');
        });

        it('should generate enhanced token with deviceId and sessionId', async () => {
            const response = await request(app)
                .post('/api/auth/token')
                .send({ 
                    userId: 'user123',
                    deviceId: 'device456',
                    sessionId: 'session789'
                });

            expect(response.status).toBe(200);
            expect(response.body.token).toBeDefined();
            expect(response.body.format).toBe('enhanced');
        });

        it('should generate legacy token when deviceId provided but not sessionId', async () => {
            const response = await request(app)
                .post('/api/auth/token')
                .send({ 
                    userId: 'user123',
                    deviceId: 'device456'
                });

            expect(response.status).toBe(200);
            expect(response.body.token).toBeDefined();
            expect(response.body.format).toBe('legacy');
        });

        it('should return 400 without userId', async () => {
            const response = await request(app)
                .post('/api/auth/token')
                .send({});

            expect(response.status).toBe(400);
            expect(response.body.error).toBe('userId is required');
        });
    });
});