/**
 * Tests for AuthHandler - validates token processing, fallback support, and status reporting
 */

const AuthHandler = require('../auth-handler.js');

class TestRunner {
  constructor() {
    this.tests = [];
    this.passed = 0;
    this.failed = 0;
  }

  test(name, testFn) {
    this.tests.push({ name, testFn });
  }

  assert(condition, message) {
    if (!condition) {
      throw new Error(message || 'Assertion failed');
    }
  }

  assertEqual(actual, expected, message) {
    if (actual !== expected) {
      throw new Error(message || `Expected ${expected}, got ${actual}`);
    }
  }

  assertNotEqual(actual, unexpected, message) {
    if (actual === unexpected) {
      throw new Error(message || `Expected not to be ${unexpected}, but got ${actual}`);
    }
  }

  assertTrue(condition, message) {
    if (!condition) {
      throw new Error(message || 'Expected condition to be true');
    }
  }

  run() {
    console.log('🧪 Running Enhanced AuthHandler tests...\n');

    for (const { name, testFn } of this.tests) {
      try {
        testFn();
        console.log(`✅ ${name}`);
        this.passed++;
      } catch (error) {
        console.log(`❌ ${name}: ${error.message}`);
        this.failed++;
      }
    }

    console.log(`\n📊 Results: ${this.passed} passed, ${this.failed} failed`);
    
    if (this.failed > 0) {
      process.exit(1);
    }
  }
}

// Initialize test runner and auth handler
const test = new TestRunner();
let authHandler;

// Reset handler before each test group
function resetAuthHandler() {
  authHandler = new AuthHandler();
}

// Test new JWT token format
test.test('Should validate new JWT Bearer token', () => {
  resetAuthHandler();
  const token = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U';
  const result = authHandler.validateToken(token);
  
  test.assert(result.success, 'Should successfully validate JWT token');
  test.assertEqual(result.tokenType, 'jwt', 'Should identify as JWT token type');
  test.assertEqual(result.statusCode, 200, 'Should return 200 status code');
  test.assert(result.timestamp, 'Should include timestamp');
  test.assert(result.metadata, 'Should include metadata');
});

// Test legacy token format with prefix
test.test('Should validate legacy token with prefix', () => {
  resetAuthHandler();
  const token = 'legacy_abcdef1234567890abcdef1234567890';
  const result = authHandler.validateToken(token);
  
  test.assert(result.success, 'Should successfully validate legacy token');
  test.assertEqual(result.tokenType, 'legacy', 'Should identify as legacy token type');
  test.assertEqual(result.statusCode, 200, 'Should return 200 status code');
  test.assert(result.metadata.hasPrefix, 'Should indicate has prefix');
});

// Test legacy token fallback (without prefix)
test.test('Should validate legacy token fallback', () => {
  resetAuthHandler();
  const token = 'abcdef1234567890abcdef1234567890';
  const result = authHandler.validateToken(token);
  
  test.assert(result.success, 'Should successfully validate legacy token fallback');
  test.assertEqual(result.tokenType, 'legacy_fallback', 'Should identify as legacy fallback token type');
  test.assertEqual(result.statusCode, 200, 'Should return 200 status code');
  test.assert(!result.metadata.hasPrefix, 'Should indicate no prefix');
});

// Test invalid token format
test.test('Should reject invalid token format', () => {
  resetAuthHandler();
  const token = 'invalid_token_123';
  const result = authHandler.validateToken(token);
  
  test.assert(!result.success, 'Should reject invalid token');
  test.assertEqual(result.statusCode, 400, 'Should return 400 status code');
  test.assert(result.statusText, 'Should include status text');
  test.assert(result.timestamp, 'Should include timestamp');
});

// Test empty token
test.test('Should reject empty token', () => {
  resetAuthHandler();
  const result = authHandler.validateToken('');
  
  test.assert(!result.success, 'Should reject empty token');
  test.assertEqual(result.statusCode, 401, 'Should return 401 status code');
  test.assert(result.statusText, 'Should include status text');
});

// Test null token
test.test('Should reject null token', () => {
  resetAuthHandler();
  const result = authHandler.validateToken(null);
  
  test.assert(!result.success, 'Should reject null token');
  test.assertEqual(result.statusCode, 401, 'Should return 401 status code');
});

// Test authentication with valid Bearer token
test.test('Should authenticate with valid Bearer token', () => {
  resetAuthHandler();
  const authHeader = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U';
  const result = authHandler.authenticate(authHeader);
  
  test.assert(result.success, 'Should authenticate successfully');
  test.assert(result.user.authenticated, 'User should be authenticated');
  test.assert(result.user.authTime, 'Should include auth time');
  test.assertEqual(result.statusCode, 200, 'Should return 200 status code');
});

// Test authentication with legacy token
test.test('Should authenticate with legacy token', () => {
  resetAuthHandler();
  const authHeader = 'legacy_abcdef1234567890abcdef1234567890';
  const result = authHandler.authenticate(authHeader);
  
  test.assert(result.success, 'Should authenticate successfully with legacy token');
  test.assert(result.user.authenticated, 'User should be authenticated');
  test.assertEqual(result.user.tokenType, 'legacy', 'Should identify legacy token type');
});

// Test authentication with fallback legacy token
test.test('Should authenticate with fallback legacy token', () => {
  resetAuthHandler();
  const authHeader = 'abcdef1234567890abcdef1234567890';
  const result = authHandler.authenticate(authHeader);
  
  test.assert(result.success, 'Should authenticate successfully with fallback legacy token');
  test.assert(result.user.authenticated, 'User should be authenticated');
  test.assertEqual(result.user.tokenType, 'legacy_fallback', 'Should identify legacy fallback token type');
});

// Test authentication with missing header
test.test('Should reject missing auth header', () => {
  resetAuthHandler();
  const result = authHandler.authenticate('');
  
  test.assert(!result.success, 'Should reject missing auth header');
  test.assertEqual(result.statusCode, 401, 'Should return 401 status code');
});

// Test malformed JWT token
test.test('Should reject malformed JWT token', () => {
  resetAuthHandler();
  const token = 'Bearer invalid.jwt';
  const result = authHandler.validateToken(token);
  
  test.assert(!result.success, 'Should reject malformed JWT');
  test.assertEqual(result.statusCode, 400, 'Should return 400 status code');
});

// Test status reporting
test.test('Should track statistics correctly', () => {
  resetAuthHandler();
  
  // Perform some authentication attempts
  authHandler.authenticate('Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U');
  authHandler.authenticate('legacy_abcdef1234567890abcdef1234567890');
  authHandler.authenticate('invalid_token');
  
  const status = authHandler.getStatus();
  
  test.assertEqual(status.statistics.totalRequests, 3, 'Should track total requests');
  test.assertEqual(status.statistics.successfulAuth, 2, 'Should track successful auth');
  test.assertEqual(status.statistics.failedAuth, 1, 'Should track failed auth');
  test.assert(status.uptime, 'Should include uptime information');
  test.assert(status.supportedTokenTypes, 'Should list supported token types');
});

// Test health check
test.test('Should provide health check information', () => {
  resetAuthHandler();
  
  const health = authHandler.healthCheck();
  
  test.assertEqual(health.service, 'auth-handler', 'Should identify service name');
  test.assertEqual(health.version, '1.1.0', 'Should include version');
  test.assert(health.status, 'Should include status');
  test.assert(health.uptime, 'Should include uptime');
  test.assert(health.metrics, 'Should include metrics');
});

// Test rate limiting
test.test('Should enforce rate limiting', () => {
  resetAuthHandler();
  
  // Set a very low rate limit for testing
  authHandler.rateLimitMax = 2;
  
  const token = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U';
  const clientId = 'test-client';
  
  // First two requests should succeed
  const result1 = authHandler.validateToken(token, clientId);
  const result2 = authHandler.validateToken(token, clientId);
  
  test.assert(result1.success, 'First request should succeed');
  test.assert(result2.success, 'Second request should succeed');
  
  // Third request should be rate limited
  const result3 = authHandler.validateToken(token, clientId);
  test.assert(!result3.success, 'Third request should fail');
  test.assertEqual(result3.statusCode, 429, 'Should return 429 status code');
});

// Test reset functionality
test.test('Should reset statistics correctly', () => {
  resetAuthHandler();
  
  // Perform some operations
  authHandler.authenticate('Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U');
  authHandler.authenticate('invalid_token');
  
  let status = authHandler.getStatus();
  test.assertNotEqual(status.statistics.totalRequests, 0, 'Should have non-zero requests before reset');
  
  // Reset stats
  authHandler.resetStats();
  
  status = authHandler.getStatus();
  test.assertEqual(status.statistics.totalRequests, 0, 'Should reset total requests');
  test.assertEqual(status.statistics.successfulAuth, 0, 'Should reset successful auth');
  test.assertEqual(status.statistics.failedAuth, 0, 'Should reset failed auth');
});

// Run all tests
test.run();