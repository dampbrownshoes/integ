/**
 * Status Demo - Demonstrates comprehensive status reporting and monitoring features
 */

const AuthHandler = require('./auth-handler.js');

// Create auth handler instance
const authHandler = new AuthHandler();

console.log('📊 Auth Handler - Status & Monitoring Demo\n');

// Simulate multiple authentication attempts
console.log('1. Simulating authentication requests...\n');

const testTokens = [
  'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U',
  'legacy_abcdef1234567890abcdef1234567890',
  'abcdef1234567890abcdef1234567890',
  'invalid_token',
  '',
  null
];

testTokens.forEach((token, index) => {
  const result = authHandler.authenticate(token, `client_${index}`);
  console.log(`Request ${index + 1}:`);
  console.log(`   Token: ${token ? token.substring(0, 20) + '...' : 'null/empty'}`);
  console.log(`   Status: ${result.success ? '✅ Success' : '❌ Failed'} (${result.statusCode})`);
  console.log(`   Message: ${result.statusText}`);
  if (result.remaining !== undefined) {
    console.log(`   Rate Limit Remaining: ${result.remaining}`);
  }
  console.log('');
});

// Show health check
console.log('2. Health Check:\n');
const health = authHandler.healthCheck();
console.log(`   Service Status: ${health.status}`);
console.log(`   Uptime: ${health.uptime}`);
console.log(`   Total Requests: ${health.metrics.totalRequests}`);
console.log(`   Success Rate: ${health.metrics.successRate}`);
console.log(`   Error Rate: ${health.metrics.errorRate}`);

// Show detailed status
console.log('\n3. Detailed Status Report:\n');
const status = authHandler.getStatus();

console.log('📈 Statistics:');
console.log(`   Total Requests: ${status.statistics.totalRequests}`);
console.log(`   Successful Auth: ${status.statistics.successfulAuth}`);
console.log(`   Failed Auth: ${status.statistics.failedAuth}`);
console.log(`   Success Rate: ${status.statistics.successRate}`);
console.log(`   JWT Tokens: ${status.statistics.jwtTokens}`);
console.log(`   Legacy Tokens: ${status.statistics.legacyTokens}`);
console.log(`   Fallback Tokens: ${status.statistics.fallbackTokens}`);

console.log('\n🚫 Error Breakdown:');
Object.entries(status.statistics.errors).forEach(([code, count]) => {
  if (count > 0) {
    console.log(`   ${code}: ${count} (${status.statusCodes[code]})`);
  }
});

console.log('\n⚡ Rate Limiting:');
console.log(`   Window: ${status.rateLimiting.windowMs}ms (${status.rateLimiting.windowMs/1000}s)`);
console.log(`   Max Requests per Window: ${status.rateLimiting.maxRequests}`);
console.log(`   Active Clients: ${status.rateLimiting.activeClients}`);

console.log('\n🔧 Supported Token Types:');
status.supportedTokenTypes.forEach(type => {
  console.log(`   • ${type}`);
});

console.log('\n📊 System Health:');
if (status.health.memoryUsage) {
  console.log(`   Memory RSS: ${(status.health.memoryUsage.rss / 1024 / 1024).toFixed(2)} MB`);
  console.log(`   Memory Heap Used: ${(status.health.memoryUsage.heapUsed / 1024 / 1024).toFixed(2)} MB`);
}
console.log(`   Node Version: ${status.health.nodeVersion}`);
console.log(`   Platform: ${status.health.platform}`);

console.log('\n✨ Enhanced Features:');
console.log('   ✅ Comprehensive status reporting');
console.log('   ✅ Rate limiting with client tracking');
console.log('   ✅ Detailed error categorization');
console.log('   ✅ Performance metrics');
console.log('   ✅ Health monitoring');
console.log('   ✅ JWT metadata extraction');
console.log('   ✅ Uptime tracking');
console.log('   ✅ Memory usage monitoring');