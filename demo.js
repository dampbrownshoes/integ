/**
 * Demo script showing enhanced authentication with free trial edge case handling
 */

const AuthHandler = require('./auth-handler.js');

console.log('🔐 Enhanced Authentication Demo - Free Trial Edge Cases\n');

const authHandler = new AuthHandler();

// Demo scenarios
const scenarios = [
  {
    name: 'Valid JWT Bearer Token',
    token: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U',
    description: 'Regular user with valid JWT token'
  },
  {
    name: 'Incomplete Signup User',
    token: 'legacy_incomplete123456789012345678901234',
    description: 'User who hasn\'t completed the signup process'
  },
  {
    name: 'Expired Trial User',
    token: 'Bearer expired_trial.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U',
    description: 'User whose free trial has expired'
  },
  {
    name: 'No Trial Signup User',
    token: 'legacy_no_trial123456789012345678901234567890',
    description: 'User who hasn\'t signed up for a free trial'
  },
  {
    name: 'Invalid Token Format',
    token: 'invalid_token_123',
    description: 'Malformed authentication token'
  },
  {
    name: 'Missing Token',
    token: '',
    description: 'Empty authentication header'
  }
];

scenarios.forEach((scenario, index) => {
  console.log(`\n${index + 1}. ${scenario.name}`);
  console.log(`   Description: ${scenario.description}`);
  console.log(`   Token: ${scenario.token || '(empty)'}`);
  
  const result = authHandler.authenticate(scenario.token);
  
  if (result.success) {
    console.log('   ✅ Status: SUCCESS');
    console.log(`   📝 User Type: ${result.user.tokenType}`);
    console.log(`   🔄 Registration: ${result.user.registrationStatus?.reason || 'active'}`);
  } else {
    console.log(`   ❌ Status: FAILED (${result.statusCode})`);
    console.log(`   💬 User Message: "${result.error}"`);
    
    if (result.userFriendly && result.details) {
      console.log(`   🎯 Suggested Action: ${result.details.suggestedAction}`);
      console.log(`   🔗 Help URL: ${result.details.helpUrl}`);
      
      if (result.details.registrationStatus) {
        console.log(`   👤 Registration Status: ${JSON.stringify(result.details.registrationStatus)}`);
      }
    }
  }
});

// Show enhanced statistics
console.log('\n📊 Enhanced Statistics with Free Trial Tracking:');
const status = authHandler.getStatus();
console.log(`   Total Requests: ${status.statistics.totalRequests}`);
console.log(`   Successful Auth: ${status.statistics.successfulAuth}`);
console.log(`   Failed Auth: ${status.statistics.failedAuth}`);
console.log(`   Free Trial Errors: ${status.statistics.freeTrialErrors}`);
console.log(`   Success Rate: ${status.statistics.successRate}`);

// Show health check
console.log('\n💚 Health Check with Free Trial Metrics:');
const health = authHandler.healthCheck();
console.log(`   Service: ${health.service} v${health.version}`);
console.log(`   Status: ${health.status}`);
console.log(`   Uptime: ${health.uptime}`);
console.log(`   Error Rate: ${health.metrics.errorRate}`);
console.log(`   Free Trial Errors: ${health.metrics.freeTrialErrors}`);

console.log('\n🎉 Demo completed! Enhanced authentication now provides:');
console.log('   • Graceful handling of free trial edge cases');
console.log('   • User-friendly error messages with clear next steps');
console.log('   • Detailed troubleshooting information');
console.log('   • Enhanced monitoring and analytics');
console.log('   • Improved user experience for sign-in issues');