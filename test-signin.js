/**
 * Test suite for SigninValidator with irrational character handling
 */

const SigninValidator = require('./signin');

// Simple test runner
function runTests() {
    const validator = new SigninValidator();
    let passed = 0;
    let failed = 0;

    function test(description, testFn) {
        try {
            testFn();
            console.log(`✓ ${description}`);
            passed++;
        } catch (error) {
            console.error(`✗ ${description}: ${error.message}`);
            failed++;
        }
    }

    function assertEqual(actual, expected, message) {
        if (JSON.stringify(actual) !== JSON.stringify(expected)) {
            throw new Error(`${message}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
        }
    }

    console.log('Running SigninValidator tests...\n');

    // Username validation tests
    test('Valid username should pass', () => {
        const result = validator.validateUsername('validuser123');
        assertEqual(result.valid, true, 'Valid username should be accepted');
    });

    test('Username with irrational characters should fail', () => {
        const result = validator.validateUsername('user\x00name'); // null character
        assertEqual(result.valid, false, 'Username with null character should be rejected');
    });

    test('Username with special symbols should fail', () => {
        const result = validator.validateUsername('user<script>');
        assertEqual(result.valid, false, 'Username with HTML tags should be rejected');
    });

    test('Username with emoji should fail', () => {
        const result = validator.validateUsername('user🚀name');
        assertEqual(result.valid, false, 'Username with emoji should be rejected');
    });

    test('Empty username should fail', () => {
        const result = validator.validateUsername('');
        assertEqual(result.valid, false, 'Empty username should be rejected');
    });

    test('Too short username should fail', () => {
        const result = validator.validateUsername('ab');
        assertEqual(result.valid, false, 'Too short username should be rejected');
    });

    // Password validation tests
    test('Valid password should pass', () => {
        const result = validator.validatePassword('ValidPass123!');
        assertEqual(result.valid, true, 'Valid password should be accepted');
    });

    test('Password with control characters should fail', () => {
        const result = validator.validatePassword('pass\x07word'); // bell character
        assertEqual(result.valid, false, 'Password with control characters should be rejected');
    });

    test('Password with non-ASCII should fail', () => {
        const result = validator.validatePassword('pässwörd123');
        assertEqual(result.valid, false, 'Password with non-ASCII should be rejected');
    });

    test('Too short password should fail', () => {
        const result = validator.validatePassword('short');
        assertEqual(result.valid, false, 'Too short password should be rejected');
    });

    // Full signin validation tests
    test('Valid signin should pass', () => {
        const result = validator.validateSignin('validuser', 'ValidPass123!');
        assertEqual(result.success, true, 'Valid signin should succeed');
    });

    test('Signin with irrational username should fail', () => {
        const result = validator.validateSignin('user\x1B[31m', 'ValidPass123!');
        assertEqual(result.success, false, 'Signin with irrational username should fail');
    });

    test('Signin with irrational password should fail', () => {
        const result = validator.validateSignin('validuser', 'pass\x00word');
        assertEqual(result.success, false, 'Signin with irrational password should fail');
    });

    // NEW CLAUSE: Irrational character analysis tests
    test('Irrational character analysis should detect control characters', () => {
        const result = validator.analyzeIrrationalCharacters('user\x00name');
        assertEqual(result.hasIrrationalChars, true, 'Should detect control characters');
        assertEqual(result.categories.includes('CONTROL_CHARACTERS'), true, 'Should categorize control characters');
    });

    test('Irrational character analysis should detect HTML injection risk', () => {
        const result = validator.analyzeIrrationalCharacters('user<script>');
        assertEqual(result.hasIrrationalChars, true, 'Should detect HTML characters');
        assertEqual(result.categories.includes('HTML_INJECTION_RISK'), true, 'Should categorize HTML injection risk');
    });

    test('Irrational character analysis should detect multiple categories', () => {
        const result = validator.analyzeIrrationalCharacters('user<>"test\x00');
        assertEqual(result.hasIrrationalChars, true, 'Should detect multiple irrational character types');
        assertEqual(result.categories.length >= 2, true, 'Should detect multiple categories');
    });

    test('Signin validation should include irrational character analysis', () => {
        const result = validator.validateSignin('user<test>', 'ValidPass123!');
        assertEqual(result.success, false, 'Signin should fail with irrational characters');
        assertEqual(typeof result.irrationalCharacterAnalysis, 'object', 'Should include analysis object');
        assertEqual(result.irrationalCharacterAnalysis.username.hasIrrationalChars, true, 'Should detect username irrational chars');
    });

    // Sanitization tests
    test('Input sanitization should remove irrational characters', () => {
        const result = validator.sanitizeInput('hello\x00world<script>');
        assertEqual(result, 'helloworldscript', 'Sanitization should remove control and unsafe characters');
    });

    test('Input sanitization should handle null input', () => {
        const result = validator.sanitizeInput(null);
        assertEqual(result, '', 'Sanitization should handle null input');
    });

    console.log(`\nTest Results: ${passed} passed, ${failed} failed`);
    
    if (failed === 0) {
        console.log('🎉 All tests passed!');
        return true;
    } else {
        console.log('❌ Some tests failed!');
        return false;
    }
}

// Run tests if this file is executed directly
if (require.main === module) {
    runTests();
}

module.exports = { runTests };