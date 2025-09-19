// Simple test runner
const { greet, add, multiply } = require('../src/index.js');

function runTests() {
  let passed = 0;
  let failed = 0;

  function test(description, fn) {
    try {
      fn();
      console.log(`✓ ${description}`);
      passed++;
    } catch (error) {
      console.log(`✗ ${description}: ${error.message}`);
      failed++;
    }
  }

  function assertEqual(actual, expected) {
    if (actual !== expected) {
      throw new Error(`Expected ${expected}, but got ${actual}`);
    }
  }

  // Test cases
  test('greet should return greeting message', () => {
    assertEqual(greet('Test'), 'Hello, Test!');
  });

  test('add should correctly add two numbers', () => {
    assertEqual(add(2, 3), 5);
  });

  test('multiply should correctly multiply two numbers', () => {
    assertEqual(multiply(4, 5), 20);
  });

  console.log(`\nTest Results: ${passed} passed, ${failed} failed`);
  
  if (failed > 0) {
    process.exit(1);
  }
}

if (require.main === module) {
  runTests();
}