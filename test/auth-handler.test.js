/**
 * Tests for AuthHandler - validates token processing, fallback support, and status reporting
 * Enhanced tests for free trial edge cases and graceful error handling
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
    console.log('🧪 Running Enhanced AuthHandler tests with Free Trial Edge Cases...\n');

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
  test.assert(result.registrationStatus, 'Should include registration status');
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

// Test incomplete signup edge case
test.test('Should handle incomplete signup gracefully', () => {
  resetAuthHandler();
  const token = 'legacy_incomplete123456789012345678901234'; // Token with 'incomplete' pattern
  const result = authHandler.validateToken(token);
  
  test.assert(!result.success, 'Should reject incomplete signup user');
  test.assertEqual(result.statusCode, 403, 'Should return 403 Forbidden');
  test.assert(result.userFriendly, 'Should be user-friendly error');
  test.assert(result.details, 'Should include error details');
  test.assertEqual(result.details.reason, 'incomplete_signup', 'Should identify incomplete signup');
  test.assertEqual(result.details.suggestedAction, 'redirect_to_signup', 'Should suggest signup redirect');
  test.assert(result.details.helpUrl, 'Should provide help URL');
  test.assert(result.error.includes('complete your account setup'), 'Should provide clear user message');
});

// Test expired trial edge case
test.test('Should handle expired trial gracefully', () => {
  resetAuthHandler();
  const token = 'Bearer expired_trial.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U';
  const result = authHandler.validateToken(token);
  
  test.assert(!result.success, 'Should reject expired trial user');
  test.assertEqual(result.statusCode, 403, 'Should return 403 Forbidden');
  test.assert(result.userFriendly, 'Should be user-friendly error');
  test.assertEqual(result.details.reason, 'expired_trial', 'Should identify expired trial');
  test.assertEqual(result.details.suggestedAction, 'redirect_to_billing', 'Should suggest billing redirect');
  test.assert(result.error.includes('free trial has expired'), 'Should provide clear user message');
});

// Test no trial signup edge case
test.test('Should handle no trial signup gracefully', () => {
  resetAuthHandler();
  const token = 'legacy_no_trial123456789012345678901234567890';
  const result = authHandler.validateToken(token);
  
  test.assert(!result.success, 'Should reject user without trial signup');
  test.assertEqual(result.statusCode, 403, 'Should return 403 Forbidden');
  test.assert(result.userFriendly, 'Should be user-friendly error');
  test.assertEqual(result.details.reason, 'no_trial_signup', 'Should identify no trial signup');
  test.assertEqual(result.details.suggestedAction, 'redirect_to_trial_signup', 'Should suggest trial signup redirect');
  test.assert(result.error.includes('sign up for a free trial'), 'Should provide clear user message');
});

// Test invalid token format with user-friendly error
test.test('Should reject invalid token format with user-friendly error', () => {
  resetAuthHandler();
  const token = 'invalid_token_123';
  const result = authHandler.validateToken(token);
  
  test.assert(!result.success, 'Should reject invalid token');
  test.assertEqual(result.statusCode, 400, 'Should return 400 status code');
  test.assert(result.userFriendly, 'Should be user-friendly error');
  test.assert(result.details, 'Should include error details');
  test.assert(result.details.helpUrl, 'Should provide help URL');
  test.assert(result.error.includes('Invalid token format'), 'Should provide clear user message');
});

// Test empty token with user-friendly error
test.test('Should reject empty token with user-friendly error', () => {
  resetAuthHandler();
  const result = authHandler.validateToken('');
  
  test.assert(!result.success, 'Should reject empty token');
  test.assertEqual(result.statusCode, 401, 'Should return 401 status code');
  test.assert(result.userFriendly, 'Should be user-friendly error');
  test.assert(result.details.suggestedAction, 'Should provide suggested action');
});

// Test authentication with valid Bearer token
test.test('Should authenticate with valid Bearer token', () => {
  resetAuthHandler();
  const authHeader = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U';
  const result = authHandler.authenticate(authHeader);
  
  test.assert(result.success, 'Should authenticate successfully');
  test.assert(result.user.authenticated, 'User should be authenticated');
  test.assert(result.user.authTime, 'Should include auth time');
  test.assert(result.user.registrationStatus, 'Should include registration status');
  test.assertEqual(result.statusCode, 200, 'Should return 200 status code');
});

// Test authentication with incomplete signup user
test.test('Should reject authentication for incomplete signup user', () => {
  resetAuthHandler();
  const authHeader = 'legacy_incomplete123456789012345678901234';
  const result = authHandler.authenticate(authHeader);
  
  test.assert(!result.success, 'Should reject authentication for incomplete signup');
  test.assertEqual(result.statusCode, 403, 'Should return 403 status code');
  test.assert(result.userFriendly, 'Should be user-friendly');
  test.assert(result.details.registrationStatus, 'Should include registration status details');
});

// Test authentication with missing header
test.test('Should reject missing auth header with user-friendly error', () => {
  resetAuthHandler();
  const result = authHandler.authenticate('');
  
  test.assert(!result.success, 'Should reject missing auth header');
  test.assertEqual(result.statusCode, 401, 'Should return 401 status code');
  test.assert(result.userFriendly, 'Should be user-friendly error');
  test.assert(result.error.includes('provide authentication credentials'), 'Should provide clear message');
});

// Test malformed JWT token with user-friendly error
test.test('Should reject malformed JWT token with user-friendly error', () => {
  resetAuthHandler();
  const token = 'Bearer invalid.jwt';
  const result = authHandler.validateToken(token);
  
  test.assert(!result.success, 'Should reject malformed JWT');
  test.assertEqual(result.statusCode, 400, 'Should return 400 status code');
  test.assert(result.userFriendly, 'Should be user-friendly error');
  test.assert(result.details.suggestedAction, 'Should provide suggested action');
});

// Test status reporting with free trial error tracking
test.test('Should track free trial errors in statistics', () => {
  resetAuthHandler();
  
  // Perform some authentication attempts including free trial errors
  authHandler.authenticate('Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U');
  authHandler.authenticate('legacy_abcdef1234567890abcdef1234567890');
  authHandler.authenticate('legacy_incomplete123456789012345678901234'); // Free trial error
  authHandler.authenticate('legacy_no_trial123456789012345678901234567890'); // Another free trial error
  
  const status = authHandler.getStatus();
  
  test.assertEqual(status.statistics.totalRequests, 4, 'Should track total requests');
  test.assertEqual(status.statistics.successfulAuth, 2, 'Should track successful auth');
  test.assertEqual(status.statistics.failedAuth, 2, 'Should track failed auth');
  test.assertEqual(status.statistics.freeTrialErrors, 2, 'Should track free trial errors specifically');
});

// Test health check includes free trial error metrics
test.test('Should include free trial errors in health check', () => {
  resetAuthHandler();
  
  // Generate a free trial error
  authHandler.authenticate('legacy_incomplete123456789012345678901234');
  
  const health = authHandler.healthCheck();
  
  test.assertEqual(health.service, 'auth-handler', 'Should identify service name');
  test.assertEqual(health.version, '1.1.0', 'Should include version');
  test.assert(health.metrics.freeTrialErrors !== undefined, 'Should include free trial errors in metrics');
  test.assertEqual(health.metrics.freeTrialErrors, 1, 'Should track free trial errors');
});

// Test rate limiting with user-friendly error
test.test('Should enforce rate limiting with user-friendly error', () => {
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
  
  // Third request should be rate limited with user-friendly error
  const result3 = authHandler.validateToken(token, clientId);
  test.assert(!result3.success, 'Third request should fail');
  test.assertEqual(result3.statusCode, 429, 'Should return 429 status code');
  test.assert(result3.userFriendly, 'Should be user-friendly error');
  test.assert(result3.error.includes('Too many requests'), 'Should provide clear message');
  test.assert(result3.details.suggestedAction, 'Should provide suggested action');
});

// Test token identifier extraction
test.test('Should extract token identifiers for registration checks', () => {
  resetAuthHandler();
  
  // Test different token types
  const bearerToken = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test';
  const legacyToken = 'legacy_testtoken123456789';
  const fallbackToken = 'testtoken123456789';
  
  const bearerId = authHandler.getTokenIdentifier(bearerToken);
  const legacyId = authHandler.getTokenIdentifier(legacyToken);
  const fallbackId = authHandler.getTokenIdentifier(fallbackToken);
  
  test.assertEqual(bearerId.length, 20, 'Should extract 20-char identifier from Bearer token');
  test.assertEqual(legacyId.length, 18, 'Should extract 18-char identifier from legacy token');
  test.assertEqual(fallbackId.length, 18, 'Should extract identifier from fallback token');
});

// Test registration status simulation
test.test('Should simulate different registration statuses correctly', () => {
  resetAuthHandler();
  
  // Test different patterns
  const incompleteStatus = authHandler.checkUserRegistrationStatus('incomplete_token');
  const expiredStatus = authHandler.checkUserRegistrationStatus('expired_trial_token');
  const noTrialStatus = authHandler.checkUserRegistrationStatus('no_trial_token');
  const activeStatus = authHandler.checkUserRegistrationStatus('active_token');
  
  test.assertEqual(incompleteStatus.reason, 'incomplete_signup', 'Should identify incomplete signup');
  test.assertEqual(expiredStatus.reason, 'expired_trial', 'Should identify expired trial');
  test.assertEqual(noTrialStatus.reason, 'no_trial_signup', 'Should identify no trial signup');
  test.assertEqual(activeStatus.reason, 'active', 'Should identify active user');
  
  test.assert(!incompleteStatus.freeTrialCompleted, 'Incomplete user should not have completed trial');
  test.assert(!expiredStatus.freeTrialCompleted, 'Expired user should not have active trial');
  test.assert(!noTrialStatus.freeTrialCompleted, 'No trial user should not have completed trial');
  test.assert(activeStatus.freeTrialCompleted, 'Active user should have completed trial');
});

// Test error response enhancement
test.test('Should create detailed error responses for registration issues', () => {
  resetAuthHandler();
  
  const registrationStatus = {
    registered: false,
    freeTrialCompleted: false,
    reason: 'incomplete_signup',
    message: 'Test message'
  };
  
  const errorResponse = authHandler.createRegistrationErrorResponse(registrationStatus);
  
  test.assert(!errorResponse.success, 'Should indicate failure');
  test.assertEqual(errorResponse.statusCode, 403, 'Should return 403');
  test.assert(errorResponse.userFriendly, 'Should be user-friendly');
  test.assert(errorResponse.details, 'Should include detailed information');
  test.assert(errorResponse.details.helpUrl, 'Should include help URL');
  test.assert(errorResponse.details.suggestedAction, 'Should include suggested action');
  test.assert(errorResponse.details.registrationStatus, 'Should include registration status details');
});

// Test reset functionality includes new stats
test.test('Should reset all statistics including free trial errors', () => {
  resetAuthHandler();
  
  // Perform operations that generate free trial errors
  authHandler.authenticate('legacy_incomplete123456789012345678901234');
  authHandler.authenticate('legacy_no_trial123456789012345678901234567890');
  
  let status = authHandler.getStatus();
  test.assertNotEqual(status.statistics.freeTrialErrors, 0, 'Should have free trial errors before reset');
  
  // Reset stats
  authHandler.resetStats();
  
  status = authHandler.getStatus();
  test.assertEqual(status.statistics.totalRequests, 0, 'Should reset total requests');
  test.assertEqual(status.statistics.freeTrialErrors, 0, 'Should reset free trial errors');
});

// Run all tests
test.run();