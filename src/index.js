// Simple integration example
function greet(name) {
  return `Hello, ${name}!`;
}

function add(a, b) {
  return a + b;
}

function multiply(a, b) {
  return a * b;
}

// Export functions for testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { greet, add, multiply };
}

// Simple CLI interface
if (require.main === module) {
  console.log(greet('World'));
  console.log('2 + 3 =', add(2, 3));
  console.log('4 * 5 =', multiply(4, 5));
}