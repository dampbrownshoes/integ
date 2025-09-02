/**
 * Test suite for AuthHandler
 * Tests both new JWT format and legacy token formats
 */

const AuthHandler = require('./auth-handler');

class TestRunner {
    constructor() {
        this.authHandler = new AuthHandler();
        this.tests = [];
        this.passed = 0;
        this.failed = 0;
    }

    test(name, testFn) {
        this.tests.push({ name, testFn });
    }

    assert(condition, message) {
        if (!condition) {
            throw new Error(message);
        }
    }

    assertEqual(actual, expected, message) {
        if (actual !== expected) {
            throw new Error(`${message}: expected ${expected}, got ${actual}`);
        }
    }

    async run() {
        console.log('Running AuthHandler Tests...\n');

        for (const test of this.tests) {
            try {
                console.log(`Testing: ${test.name}`);
                await test.testFn();
                console.log(`✅ PASSED: ${test.name}\n`);
                this.passed++;
            } catch (error) {
                console.log(`❌ FAILED: ${test.name}`);
                console.log(`   Error: ${error.message}\n`);
                this.failed++;
            }
        }

        console.log(`\n=== TEST RESULTS ===`);
        console.log(`Passed: ${this.passed}`);
        console.log(`Failed: ${this.failed}`);
        console.log(`Total: ${this.tests.length}`);
        
        if (this.failed > 0) {
            process.exit(1);
        }
    }
}

const runner = new TestRunner();

// Test JWT token format (new format)
runner.test('JWT Token Validation - Valid Token', () => {
    // Create a mock JWT token (header.payload.signature)
    const payload = { sub: 'user123', exp: Date.now() + 3600000 };
    const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64');
    const mockJWT = `header.${payloadB64}.signature`;
    
    const result = runner.authHandler.validateToken(`Bearer ${mockJWT}`);
    runner.assert(result.valid, 'JWT token should be valid');
    runner.assertEqual(result.format, 'jwt', 'Should identify as JWT format');
    runner.assertEqual(result.userId, 'user123', 'Should extract correct user ID');
});

runner.test('JWT Token Validation - Invalid JWT Structure', () => {
    const result = runner.authHandler.validateToken('Bearer invalidjwt');
    runner.assert(!result.valid, 'Invalid JWT should be rejected');
    runner.assert(result.error.includes('Invalid JWT') || result.error.includes('format'), 'Should indicate JWT error');
});

// Test Basic auth format (legacy format)
runner.test('Legacy Basic Auth - Valid Credentials', () => {
    const credentials = Buffer.from('user123:password123').toString('base64');
    const result = runner.authHandler.validateToken(`Basic ${credentials}`);
    runner.assert(result.valid, 'Basic auth should be valid');
    runner.assertEqual(result.format, 'basic', 'Should identify as basic format');
    runner.assertEqual(result.userId, 'user123', 'Should extract correct username');
});

runner.test('Legacy Basic Auth - Invalid Base64', () => {
    const result = runner.authHandler.validateToken('Basic invalid_base64!@#');
    runner.assert(!result.valid, 'Invalid base64 should be rejected');
});

// Test API Token format (legacy format)
runner.test('Legacy API Token - Valid Token', () => {
    const result = runner.authHandler.validateToken('Token abcdef123456789');
    runner.assert(result.valid, 'API token should be valid');
    runner.assertEqual(result.format, 'token', 'Should identify as token format');
    runner.assert(result.userId.includes('user_'), 'Should generate user ID from token');
});

runner.test('Legacy API Key - Valid Key', () => {
    const result = runner.authHandler.validateToken('ApiKey xyz789456123abc');
    runner.assert(result.valid, 'API key should be valid');
    runner.assertEqual(result.format, 'apikey', 'Should identify as apikey format');
    runner.assert(result.userId.includes('user_'), 'Should generate user ID from key');
});

// Test fallback behavior
runner.test('Token Fallback - JWT fails, falls back to legacy', () => {
    // This would be a malformed JWT that fails validation
    const result = runner.authHandler.validateToken('Bearer malformed_jwt');
    // Since it's not a valid JWT, it should try legacy formats and fail
    runner.assert(!result.valid, 'Malformed JWT should be rejected');
});

// Test no auth header
runner.test('No Auth Header - Should Fail', () => {
    const result = runner.authHandler.validateToken('');
    runner.assert(!result.valid, 'Empty auth header should be rejected');
    runner.assert(result.error.includes('No authorization header'), 'Should indicate missing header');
});

// Test unsupported format
runner.test('Unsupported Format - Should Fail', () => {
    const result = runner.authHandler.validateToken('Digest username="test"');
    runner.assert(!result.valid, 'Unsupported format should be rejected');
});

// Test image download authentication
runner.test('Image Download Auth - Valid JWT', () => {
    const payload = { sub: 'user123', exp: Date.now() + 3600000 };
    const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64');
    const mockJWT = `header.${payloadB64}.signature`;
    
    const result = runner.authHandler.authenticateImageDownload(`Bearer ${mockJWT}`, 'album123');
    runner.assert(result.success, 'Image download should be allowed with valid JWT');
    runner.assertEqual(result.statusCode, 200, 'Should return 200 status');
    runner.assertEqual(result.tokenFormat, 'jwt', 'Should identify JWT format');
});

runner.test('Image Download Auth - Valid Legacy Token', () => {
    const result = runner.authHandler.authenticateImageDownload('Token abcdef123456789', 'album123');
    runner.assert(result.success, 'Image download should be allowed with valid legacy token');
    runner.assertEqual(result.statusCode, 200, 'Should return 200 status');
    runner.assertEqual(result.tokenFormat, 'token', 'Should identify token format');
});

runner.test('Image Download Auth - Invalid Token', () => {
    const result = runner.authHandler.authenticateImageDownload('Invalid token', 'album123');
    runner.assert(!result.success, 'Image download should be denied with invalid token');
    runner.assertEqual(result.statusCode, 401, 'Should return 401 status');
});

runner.test('Image Download Auth - Valid Legacy Basic Auth', () => {
    const credentials = Buffer.from('user123:password123').toString('base64');
    const result = runner.authHandler.authenticateImageDownload(`Basic ${credentials}`, 'album123');
    runner.assert(result.success, 'Image download should be allowed with valid basic auth');
    runner.assertEqual(result.statusCode, 200, 'Should return 200 status');
    runner.assertEqual(result.tokenFormat, 'basic', 'Should identify basic format');
});

// Run all tests
runner.run().catch(console.error);