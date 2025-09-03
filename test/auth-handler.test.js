/**
 * Test file for AuthHandler
 * Demonstrates the 400 error issue with legacy tokens
 */

const AuthHandler = require('../auth-handler');

function runTests() {
  const authHandler = new AuthHandler();
  let testsPassed = 0;
  let testsFailed = 0;

  console.log('🧪 Testing Auth Handler\n');

  // Test 1: New v2 token should work
  try {
    const result = authHandler.processOnboardingRequest('Bearer mob_v2_abcd1234567890123456789012345678');
    if (result.status === 200) {
      console.log('✅ Test 1 PASSED: New v2 token works');
      testsPassed++;
    } else {
      console.log('❌ Test 1 FAILED: New v2 token should work');
      testsFailed++;
    }
  } catch (error) {
    console.log('❌ Test 1 FAILED: New v2 token should work - ' + error.message);
    testsFailed++;
  }

  // Test 2: Legacy token should now work (fix implemented!)
  try {
    const result = authHandler.processOnboardingRequest('Bearer mob_abcd1234567890123456789012345678');
    if (result.status === 200 && result.tokenType === 'legacy') {
      console.log('✅ Test 2 PASSED: Legacy token now works with fallback!');
      testsPassed++;
    } else {
      console.log('❌ Test 2 FAILED: Legacy token should work with fallback');
      console.log('   Result:', result);
      testsFailed++;
    }
  } catch (error) {
    console.log('❌ Test 2 FAILED: Legacy token should work with fallback - ' + error.message);
    testsFailed++;
  }

  // Test 3: No token should fail
  try {
    const result = authHandler.processOnboardingRequest('Bearer ');
    if (result.status === 400) {
      console.log('✅ Test 3 PASSED: Empty token fails');
      testsPassed++;
    } else {
      console.log('❌ Test 3 FAILED: Empty token should fail');
      testsFailed++;
    }
  } catch (error) {
    console.log('✅ Test 3 PASSED: Empty token fails - ' + error.message);
    testsPassed++;
  }

  // Test 4: Invalid header should fail
  try {
    const result = authHandler.processOnboardingRequest('InvalidHeader');
    if (result.status === 400) {
      console.log('✅ Test 4 PASSED: Invalid header fails');
      testsPassed++;
    } else {
      console.log('❌ Test 4 FAILED: Invalid header should fail');
      testsFailed++;
    }
  } catch (error) {
    console.log('✅ Test 4 PASSED: Invalid header fails - ' + error.message);
    testsPassed++;
  }

  // Test 5: Short legacy token should fail
  try {
    const result = authHandler.processOnboardingRequest('Bearer mob_short');
    if (result.status === 400) {
      console.log('✅ Test 5 PASSED: Short legacy token fails');
      testsPassed++;
    } else {
      console.log('❌ Test 5 FAILED: Short legacy token should fail');
      testsFailed++;
    }
  } catch (error) {
    console.log('✅ Test 5 PASSED: Short legacy token fails - ' + error.message);
    testsPassed++;
  }

  // Test 6: Invalid token format should fail
  try {
    const result = authHandler.processOnboardingRequest('Bearer invalid_format_123456789012345678');
    if (result.status === 400) {
      console.log('✅ Test 6 PASSED: Invalid format token fails');
      testsPassed++;
    } else {
      console.log('❌ Test 6 FAILED: Invalid format token should fail');
      testsFailed++;
    }
  } catch (error) {
    console.log('✅ Test 6 PASSED: Invalid format token fails - ' + error.message);
    testsPassed++;
  }

  console.log(`\n📊 Test Results: ${testsPassed} passed, ${testsFailed} failed`);
  
  if (testsFailed === 0) {
    console.log('\n🎉 SUCCESS: All tests passed!');
    console.log('📱 Mobile onboarding now supports both v2 and legacy tokens');
    console.log('🔧 Fallback implemented - 400 errors should be resolved');
  } else {
    console.log('\n🚨 Some tests failed - need to investigate');
  }

  return testsFailed === 0;
}

if (require.main === module) {
  runTests();
}

module.exports = { runTests };