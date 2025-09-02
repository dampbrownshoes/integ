/**
 * Tests for AuthHandler - validates token processing and fallback support
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

  run() {
    console.log('🧪 Running AuthHandler tests...\n');

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
const authHandler = new AuthHandler();

// Test new JWT token format
test.test('Should validate new JWT Bearer token', () => {
  const token = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U';
  const result = authHandler.validateToken(token);
  
  test.assert(result.success, 'Should successfully validate JWT token');
  test.assertEqual(result.tokenType, 'jwt', 'Should identify as JWT token type');
});

// Test legacy token format with prefix
test.test('Should validate legacy token with prefix', () => {
  const token = 'legacy_abcdef1234567890abcdef1234567890';
  const result = authHandler.validateToken(token);
  
  test.assert(result.success, 'Should successfully validate legacy token');
  test.assertEqual(result.tokenType, 'legacy', 'Should identify as legacy token type');
});

// Test legacy token fallback (without prefix)
test.test('Should validate legacy token fallback', () => {
  const token = 'abcdef1234567890abcdef1234567890';
  const result = authHandler.validateToken(token);
  
  test.assert(result.success, 'Should successfully validate legacy token fallback');
  test.assertEqual(result.tokenType, 'legacy_fallback', 'Should identify as legacy fallback token type');
});

// Test invalid token format
test.test('Should reject invalid token format', () => {
  const token = 'invalid_token_123';
  const result = authHandler.validateToken(token);
  
  test.assert(!result.success, 'Should reject invalid token');
  test.assertEqual(result.statusCode, 400, 'Should return 400 status code');
});

// Test empty token
test.test('Should reject empty token', () => {
  const result = authHandler.validateToken('');
  
  test.assert(!result.success, 'Should reject empty token');
  test.assertEqual(result.statusCode, 401, 'Should return 401 status code');
});

// Test null token
test.test('Should reject null token', () => {
  const result = authHandler.validateToken(null);
  
  test.assert(!result.success, 'Should reject null token');
  test.assertEqual(result.statusCode, 401, 'Should return 401 status code');
});

// Test authentication with valid Bearer token
test.test('Should authenticate with valid Bearer token', () => {
  const authHeader = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U';
  const result = authHandler.authenticate(authHeader);
  
  test.assert(result.success, 'Should authenticate successfully');
  test.assert(result.user.authenticated, 'User should be authenticated');
});

// Test authentication with legacy token
test.test('Should authenticate with legacy token', () => {
  const authHeader = 'legacy_abcdef1234567890abcdef1234567890';
  const result = authHandler.authenticate(authHeader);
  
  test.assert(result.success, 'Should authenticate successfully with legacy token');
  test.assert(result.user.authenticated, 'User should be authenticated');
  test.assertEqual(result.user.tokenType, 'legacy', 'Should identify legacy token type');
});

// Test authentication with fallback legacy token
test.test('Should authenticate with fallback legacy token', () => {
  const authHeader = 'abcdef1234567890abcdef1234567890';
  const result = authHandler.authenticate(authHeader);
  
  test.assert(result.success, 'Should authenticate successfully with fallback legacy token');
  test.assert(result.user.authenticated, 'User should be authenticated');
  test.assertEqual(result.user.tokenType, 'legacy_fallback', 'Should identify legacy fallback token type');
});

// Test authentication with missing header
test.test('Should reject missing auth header', () => {
  const result = authHandler.authenticate('');
  
  test.assert(!result.success, 'Should reject missing auth header');
  test.assertEqual(result.statusCode, 401, 'Should return 401 status code');
});

// Test malformed JWT token
test.test('Should reject malformed JWT token', () => {
  const token = 'Bearer invalid.jwt';
  const result = authHandler.validateToken(token);
  
  test.assert(!result.success, 'Should reject malformed JWT');
  test.assertEqual(result.statusCode, 400, 'Should return 400 status code');
});

// Run all tests
test.run();