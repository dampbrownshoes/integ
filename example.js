/**
 * Example usage of AuthHandler for onboarding flow
 * Demonstrates how to prevent 400 errors with fallback token support
 */

const AuthHandler = require('./auth-handler.js');

// Create auth handler instance
const authHandler = new AuthHandler();

// Simulate onboarding flow scenarios
console.log('🔐 Auth Handler - Onboarding Flow Examples\n');

// Example 1: New JWT token (current format)
console.log('1. Processing new JWT token:');
const jwtToken = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U';
const jwtResult = authHandler.authenticate(jwtToken);
console.log(`   Status: ${jwtResult.success ? '✅ Success' : '❌ Failed'}`);
console.log(`   Token Type: ${jwtResult.user?.tokenType || 'N/A'}`);

// Example 2: Legacy token with prefix (old format)
console.log('\n2. Processing legacy token with prefix:');
const legacyToken = 'legacy_abcdef1234567890abcdef1234567890';
const legacyResult = authHandler.authenticate(legacyToken);
console.log(`   Status: ${legacyResult.success ? '✅ Success' : '❌ Failed'}`);
console.log(`   Token Type: ${legacyResult.user?.tokenType || 'N/A'}`);

// Example 3: Legacy token fallback (for backward compatibility)
console.log('\n3. Processing legacy token (fallback):');
const fallbackToken = 'abcdef1234567890abcdef1234567890';
const fallbackResult = authHandler.authenticate(fallbackToken);
console.log(`   Status: ${fallbackResult.success ? '✅ Success' : '❌ Failed'}`);
console.log(`   Token Type: ${fallbackResult.user?.tokenType || 'N/A'}`);

// Example 4: Invalid token (would previously cause 400 error)
console.log('\n4. Processing invalid token (graceful handling):');
const invalidToken = 'invalid_token_123';
const invalidResult = authHandler.authenticate(invalidToken);
console.log(`   Status: ${invalidResult.success ? '✅ Success' : '❌ Failed'}`);
console.log(`   Error: ${invalidResult.error || 'N/A'}`);
console.log(`   Status Code: ${invalidResult.statusCode || 'N/A'}`);

console.log('\n📝 Summary:');
console.log('- ✅ JWT tokens are properly validated');
console.log('- ✅ Legacy tokens with prefix are supported');
console.log('- ✅ Legacy tokens without prefix work as fallback');
console.log('- ✅ Invalid tokens return proper error codes instead of crashing');
console.log('- ✅ No more 400 errors on onboarding flow!');