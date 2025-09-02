# Auth Handler - Token Format Support

This document explains the token formats supported by the Auth Handler to fix 400 errors in the onboarding flow.

## Problem Fixed

The Auth Handler was causing 400 errors during onboarding due to incompatibility with legacy token formats. This fix adds comprehensive legacy token support while maintaining compatibility with modern JWT tokens.

## Supported Token Formats

### 1. JWT Bearer Tokens (New Format)
- **Format**: `Bearer <jwt-token>`
- **Example**: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c`
- **Validation**: JWT structure validation (header.payload.signature)
- **Use case**: Modern applications and new user registrations

### 2. Legacy Tokens with Prefix
- **Format**: `legacy_<token>`
- **Example**: `legacy_abcd1234567890abcdef1234567890ab`
- **Validation**: Prefix + 32+ alphanumeric characters
- **Use case**: Existing users with explicitly prefixed legacy tokens

### 3. Legacy Tokens (Fallback)
- **Format**: `<token>` (raw token, no prefix)
- **Example**: `abcd1234567890abcdef1234567890ab`
- **Validation**: 32+ alphanumeric characters only
- **Use case**: Legacy users without token prefix (backward compatibility)

## Authentication Flow

1. **Token Validation**: The handler first validates the token format
2. **Format Detection**: Automatically detects which format is being used
3. **Processing**: Routes to appropriate processor based on detected format
4. **Response**: Returns standardized response with token type information

## Usage Example

```javascript
const AuthHandler = require('./auth-handler.js');
const auth = new AuthHandler();

// Authenticate with any supported token format
const result = auth.authenticate(authHeader);

if (result.success) {
    console.log('Authenticated user:', result.user);
    console.log('Token type:', result.user.tokenType);
} else {
    console.log('Authentication failed:', result.error);
    console.log('Status code:', result.statusCode);
}
```

## Error Handling

- **401**: Missing or invalid credentials
- **400**: Invalid token format
- Returns descriptive error messages for debugging

## Benefits of This Fix

1. **Backward Compatibility**: Supports all existing legacy token formats
2. **Forward Compatibility**: Fully supports modern JWT tokens
3. **Automatic Detection**: No configuration needed - automatically detects token type
4. **Graceful Degradation**: Fallback support ensures legacy users can still authenticate
5. **Clear Error Messages**: Helps with debugging authentication issues

This solution eliminates 400 errors in the onboarding flow by ensuring all token formats are properly supported.