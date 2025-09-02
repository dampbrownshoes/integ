# integ

Integration service with robust authentication handling.

## Auth Handler

The `auth-handler.js` module provides comprehensive token validation with fallback support for legacy tokens, preventing 400 errors on the onboarding flow.

### Features

- ✅ JWT Bearer token support (current format)
- ✅ Legacy token support with prefix (`legacy_*`)
- ✅ Fallback support for legacy tokens without prefix
- ✅ Proper error handling (no more 400 crashes)
- ✅ Backward compatibility

### Usage

```javascript
const AuthHandler = require('./auth-handler.js');
const authHandler = new AuthHandler();

// Authenticate with any token format
const result = authHandler.authenticate(authHeader);
if (result.success) {
  console.log(`Authenticated user with ${result.user.tokenType} token`);
} else {
  console.log(`Auth failed: ${result.error}`);
}
```

### Testing

Run tests with:
```bash
npm test
```

### Example

See `example.js` for demonstration of all token formats.