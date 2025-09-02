# integ

Authentication handler service with support for both new JWT tokens and legacy token formats.

## Problem Solved

Fixed an issue where users couldn't download images from the new album view due to authentication token format changes. The solution provides backward compatibility by supporting both new JWT tokens and legacy token formats.

## Features

- **New JWT Token Support**: Bearer JWT tokens with payload validation
- **Legacy Token Fallback**: Support for Basic Auth, API tokens, and API keys
- **Seamless Fallback**: Automatically tries new format first, then falls back to legacy
- **Comprehensive Validation**: Proper error handling and validation for all formats
- **Image Download Authentication**: Specific support for album image download permissions

## Token Formats Supported

1. **JWT Bearer Token**: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
2. **Basic Authentication**: `Basic dXNlcjpwYXNzd29yZA==`
3. **API Token**: `Token abc123def456ghi789`
4. **API Key**: `ApiKey xyz789uvw456rst123`

## Usage

```javascript
const AuthHandler = require('./auth-handler');

const authHandler = new AuthHandler();

// Authenticate image download with any supported token format
const result = authHandler.authenticateImageDownload(authHeader, albumId);

if (result.success) {
    console.log(`User ${result.userId} can download from album`);
    // Proceed with image download
} else {
    console.log(`Authentication failed: ${result.error}`);
    // Return appropriate HTTP status code
}
```

## Testing

Run the comprehensive test suite:

```bash
npm test
```

See example usage:

```bash
node example.js
```

## Implementation Details

The AuthHandler class provides a `validateToken()` method that:

1. First tries to validate as a JWT Bearer token
2. If that fails, attempts legacy format validation:
   - Basic Auth (username:password base64 encoded)
   - API Token format
   - API Key format
3. Returns validation results with user info and token format
4. Provides `authenticateImageDownload()` for specific image download authentication

This ensures backward compatibility while supporting the new token format.