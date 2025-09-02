# integ

Integration service with robust authentication handling and comprehensive status monitoring.

## Auth Handler

The `auth-handler.js` module provides comprehensive token validation with fallback support for legacy tokens, preventing 400 errors on the onboarding flow. Enhanced with detailed status reporting, monitoring, and rate limiting.

### Features

- ✅ JWT Bearer token support (current format)
- ✅ Legacy token support with prefix (`legacy_*`)
- ✅ Fallback support for legacy tokens without prefix
- ✅ Proper error handling (no more 400 crashes)
- ✅ Backward compatibility
- ✅ **Comprehensive status reporting & monitoring**
- ✅ **Rate limiting with client tracking**
- ✅ **Detailed error categorization** 
- ✅ **Performance metrics & analytics**
- ✅ **Health monitoring with uptime tracking**
- ✅ **JWT metadata extraction**
- ✅ **Memory usage monitoring**

### Usage

```javascript
const AuthHandler = require('./auth-handler.js');
const authHandler = new AuthHandler();

// Authenticate with any token format
const result = authHandler.authenticate(authHeader, 'client-id');
if (result.success) {
  console.log(`Authenticated user with ${result.user.tokenType} token`);
  console.log(`Rate limit remaining: ${result.remaining}`);
} else {
  console.log(`Auth failed: ${result.error} (${result.statusCode})`);
}
```

### Status Monitoring

```javascript
// Get health check
const health = authHandler.healthCheck();
console.log(`Service: ${health.service}, Status: ${health.status}`);
console.log(`Uptime: ${health.uptime}, Success Rate: ${health.metrics.successRate}`);

// Get detailed status report
const status = authHandler.getStatus();
console.log('Statistics:', status.statistics);
console.log('Error breakdown:', status.statistics.errors);
console.log('Rate limiting:', status.rateLimiting);
console.log('System health:', status.health);
```

### Scripts

```bash
# Run tests (15 comprehensive test cases)
npm test

# Run basic demo
npm run demo

# Run status monitoring demo
npm run status
```

### Status Features

- **Real-time Metrics**: Track successful/failed authentications, token types used
- **Error Analytics**: Detailed breakdown of error types (400, 401, 403, 429, 500)
- **Rate Limiting**: Built-in rate limiting with configurable windows and client tracking
- **Health Monitoring**: System health metrics including memory usage and uptime
- **Performance Tracking**: Request rates, success rates, and response time analytics
- **JWT Analysis**: Extract and analyze JWT token metadata (algorithm, structure)

### Example

See `example.js` for basic usage and `status-demo.js` for comprehensive status monitoring demonstration.