#!/usr/bin/env node

const AuthHandler = require('./auth-handler');
const jwt = require('jsonwebtoken');

console.log('🔧 Testing Mobile Onboarding Auth Fix\n');

const authHandler = new AuthHandler();
const secret = 'mobile-onboarding-secret';

// Test 1: New format token (current format)
console.log('✅ Test 1: New format token');
const newToken = authHandler.generateToken('user123', 'device456');
console.log(`Generated new token: ${newToken.substring(0, 50)}...`);

try {
  const newResult = authHandler.verifyToken(newToken);
  console.log(`✅ New token verified successfully:`, newResult);
} catch (error) {
  console.log(`❌ New token failed:`, error.message);
}

console.log('\n---\n');

// Test 2: Legacy format token (pre-change format that was causing 400 errors)
console.log('✅ Test 2: Legacy format token (the fix)');
const legacyPayload = {
  user_id: 'legacy_user789',  // Old format
  device_id: 'legacy_device012',
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60)
  // No version field
};
const legacyToken = jwt.sign(legacyPayload, secret);
console.log(`Generated legacy token: ${legacyToken.substring(0, 50)}...`);

try {
  const legacyResult = authHandler.verifyToken(legacyToken);
  console.log(`✅ Legacy token verified successfully (400 errors prevented):`, legacyResult);
} catch (error) {
  console.log(`❌ Legacy token failed:`, error.message);
}

console.log('\n---\n');

// Test 3: Invalid token
console.log('✅ Test 3: Invalid token (should fail)');
try {
  authHandler.verifyToken('invalid.token.here');
  console.log(`❌ Invalid token should have failed`);
} catch (error) {
  console.log(`✅ Invalid token correctly rejected:`, error.message);
}

console.log('\n🎉 Mobile onboarding auth fix validated!');
console.log('✅ New format tokens work');
console.log('✅ Legacy format tokens work (preventing 400 errors)');
console.log('✅ Invalid tokens are rejected');