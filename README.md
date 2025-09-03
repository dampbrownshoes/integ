# integ

Mobile Onboarding Authentication Integration

## Issue Resolution

This repository addresses the 400 errors in the mobile onboarding flow caused by strict v2.0 token format requirements.

### Problem
- Mobile onboarding flow was returning 400 errors
- Issue was caused by recent changes that only accepted v2.0 token format (`bearer.version.payload.signature`)
- Legacy v1.0 tokens (`legacy.version.payload`) were being rejected

### Solution
- Added fallback support for legacy v1.0 tokens
- Maintained backward compatibility while supporting new v2.0 format
- Both token formats are now accepted for authentication

### Token Formats Supported

#### v2.0 Format (New)
```
bearer.2.{base64-payload}.signature
```

#### v1.0 Format (Legacy) 
```
legacy.1.{base64-payload}
```

### Usage

```javascript
const AuthHandler = require('./auth-handler');

const authHandler = new AuthHandler();

// Test token validation
const result = authHandler.validateToken(token);

// Use as Express middleware
app.use('/api/mobile', authHandler.middleware());
```

### Testing

```bash
npm test          # Run comprehensive tests
npm run test:basic # Run basic tests
```