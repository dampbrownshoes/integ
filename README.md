# integ

Integration service for mobile onboarding with backward-compatible authentication.

## Overview

This service provides JWT-based authentication for mobile onboarding flows with support for both legacy and enhanced token formats.

## Features

- **Backward Compatible**: Supports legacy tokens from existing mobile clients
- **Enhanced Security**: New token format with device and session tracking
- **Automatic Fallback**: Seamlessly handles both token formats
- **RESTful API**: Simple HTTP endpoints for token generation and mobile onboarding

## API Endpoints

### Generate Authentication Token
```
POST /api/auth/token
```

**Legacy Format (backward compatible):**
```json
{
  "userId": "user123"
}
```
Response: `{"token": "...", "format": "legacy"}`

**Enhanced Format (new clients):**
```json
{
  "userId": "user123",
  "deviceId": "device456", 
  "sessionId": "session789"
}
```
Response: `{"token": "...", "format": "enhanced"}`

### Mobile Onboarding
```
POST /api/mobile/onboard
Authorization: Bearer <token>
```

```json
{
  "userId": "user123",
  "deviceInfo": {
    "platform": "ios",
    "version": "15.0"
  }
}
```

Both legacy and enhanced tokens are accepted.

## Running the Service

```bash
npm install
npm start
```

## Testing

```bash
npm test
```

## Solution Summary

This implementation fixes the reported 400 errors in mobile onboarding by:

1. **Reverting breaking changes** that rejected legacy tokens
2. **Adding fallback mechanism** that validates both token formats
3. **Maintaining enhanced security** for new clients while preserving backward compatibility
4. **Comprehensive testing** to ensure both formats work correctly

The solution ensures existing mobile clients continue working without updates while new clients can use enhanced security features.