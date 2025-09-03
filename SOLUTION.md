# Mobile Onboarding Auth Fix

## Problem
The mobile onboarding flow was experiencing 400 errors due to a recent change in the auth token format. The updated auth-handler.js only supported the new v2 token format (`mob_v2_*`), causing failures for users with legacy tokens (`mob_*`) who hadn't updated their mobile apps yet.

## Solution
Implemented a fallback mechanism in `auth-handler.js` that:
1. First tries to validate tokens using the new v2 format
2. Falls back to legacy format validation if the v2 format fails
3. Maintains backward compatibility without breaking existing functionality

## Changes Made
- **auth-handler.js**: Added fallback logic for legacy token support
- **test/auth-handler.test.js**: Comprehensive tests for both token formats
- **demo.js**: Demonstration script showing the fix in action
- **package.json**: Node.js project configuration

## Testing
All tests pass, demonstrating that:
- ✅ New v2 tokens continue to work
- ✅ Legacy tokens now work with fallback
- ✅ Invalid tokens are properly rejected
- ✅ Edge cases are handled correctly

## Result
Mobile users with both new and legacy app versions can now successfully complete onboarding without 400 errors.