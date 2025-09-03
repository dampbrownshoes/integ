const AuthHandler = require('./auth-handler');

// Test data
const authHandler = new AuthHandler();

// Legacy token format (v1.0) - this will cause 400 errors
const legacyToken = 'legacy.1.eyJ1c2VySWQiOiIxMjM0NSIsImV4cCI6OTk5OTk5OTk5OX0';

// New token format (v2.0) - this should work
const newToken = 'bearer.2.eyJ1c2VySWQiOiIxMjM0NSIsImV4cCI6OTk5OTk5OTk5OX0.signature';

console.log('Testing current auth-handler behavior:\n');

console.log('1. Testing legacy token (should cause 400 error):');
const legacyResult = authHandler.validateToken(legacyToken);
console.log(legacyResult);

console.log('\n2. Testing new token format (should work):');
const newResult = authHandler.validateToken(newToken);
console.log(newResult);

console.log('\n3. Testing empty token:');
const emptyResult = authHandler.validateToken('');
console.log(emptyResult);