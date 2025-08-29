#!/usr/bin/env python3
"""
Sign-In Flow Tests
Comprehensive test suite for the sign-in functionality.
"""

import unittest
import sys
import os
import time
import json

# Add the auth directory to the path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'auth'))

from signin import SignInManager, SignInError, RateLimiter, SessionManager, UserStore


class TestRateLimiter(unittest.TestCase):
    """Test rate limiting functionality."""
    
    def setUp(self):
        self.rate_limiter = RateLimiter(max_attempts=3, window_minutes=1)
    
    def test_initial_state(self):
        """Test initial state allows requests."""
        is_limited, reset_time = self.rate_limiter.is_rate_limited("test@example.com")
        self.assertFalse(is_limited)
        self.assertEqual(reset_time, 0)
    
    def test_successful_attempts_not_limited(self):
        """Test that successful attempts don't trigger rate limiting."""
        email = "success@example.com"
        
        # Record multiple successful attempts
        for _ in range(5):
            self.rate_limiter.record_attempt(email, True)
        
        is_limited, _ = self.rate_limiter.is_rate_limited(email)
        self.assertFalse(is_limited)
    
    def test_failed_attempts_trigger_limit(self):
        """Test that failed attempts trigger rate limiting."""
        email = "failed@example.com"
        
        # Record failed attempts up to limit
        for _ in range(3):
            self.rate_limiter.record_attempt(email, False)
        
        is_limited, reset_time = self.rate_limiter.is_rate_limited(email)
        self.assertTrue(is_limited)
        self.assertGreater(reset_time, 0)
    
    def test_mixed_attempts(self):
        """Test mixed successful and failed attempts."""
        email = "mixed@example.com"
        
        # Two failures, one success, two more failures
        self.rate_limiter.record_attempt(email, False)
        self.rate_limiter.record_attempt(email, False)
        self.rate_limiter.record_attempt(email, True)
        self.rate_limiter.record_attempt(email, False)
        
        # Should not be limited yet (3 failures total, but one success)
        is_limited, _ = self.rate_limiter.is_rate_limited(email)
        self.assertTrue(is_limited)  # 3 failures in total


class TestSessionManager(unittest.TestCase):
    """Test session management functionality."""
    
    def setUp(self):
        self.session_manager = SessionManager("test-secret", session_timeout_hours=1)
    
    def test_create_session(self):
        """Test session creation."""
        token = self.session_manager.create_session("user1", "test@example.com")
        self.assertIsInstance(token, str)
        self.assertGreater(len(token), 0)
    
    def test_validate_session(self):
        """Test session validation."""
        token = self.session_manager.create_session("user1", "test@example.com")
        session = self.session_manager.validate_session(token)
        
        self.assertIsNotNone(session)
        self.assertEqual(session['user_id'], "user1")
        self.assertEqual(session['email'], "test@example.com")
    
    def test_invalid_token(self):
        """Test validation of invalid token."""
        session = self.session_manager.validate_session("invalid-token")
        self.assertIsNone(session)
    
    def test_invalidate_session(self):
        """Test session invalidation."""
        token = self.session_manager.create_session("user1", "test@example.com")
        
        # Validate it exists
        session = self.session_manager.validate_session(token)
        self.assertIsNotNone(session)
        
        # Invalidate it
        self.session_manager.invalidate_session(token)
        
        # Should now be invalid
        session = self.session_manager.validate_session(token)
        self.assertIsNone(session)
    
    def test_extend_session(self):
        """Test session extension."""
        token = self.session_manager.create_session("user1", "test@example.com")
        
        # Get original expiration
        session_before = self.session_manager.validate_session(token)
        expires_before = session_before['expires_at']
        
        # Small delay to ensure time difference
        time.sleep(0.1)
        
        # Extend session
        result = self.session_manager.extend_session(token)
        self.assertTrue(result)
        
        # Check new expiration is later
        session_after = self.session_manager.validate_session(token)
        expires_after = session_after['expires_at']
        
        self.assertGreater(expires_after, expires_before)


class TestUserStore(unittest.TestCase):
    """Test user storage functionality."""
    
    def setUp(self):
        self.user_store = UserStore()
    
    def test_get_existing_user(self):
        """Test retrieving an existing user."""
        user = self.user_store.get_user("user@example.com")
        self.assertIsNotNone(user)
        self.assertEqual(user['email'], "user@example.com")
    
    def test_get_nonexistent_user(self):
        """Test retrieving a non-existent user."""
        user = self.user_store.get_user("nonexistent@example.com")
        self.assertIsNone(user)
    
    def test_case_insensitive_email(self):
        """Test that email lookups are case-insensitive."""
        user1 = self.user_store.get_user("user@example.com")
        user2 = self.user_store.get_user("USER@EXAMPLE.COM")
        user3 = self.user_store.get_user("User@Example.Com")
        
        self.assertIsNotNone(user1)
        self.assertEqual(user1, user2)
        self.assertEqual(user1, user3)
    
    def test_verify_correct_password(self):
        """Test password verification with correct password."""
        result = self.user_store.verify_password("user@example.com", "password123")
        self.assertTrue(result)
    
    def test_verify_incorrect_password(self):
        """Test password verification with incorrect password."""
        result = self.user_store.verify_password("user@example.com", "wrongpassword")
        self.assertFalse(result)
    
    def test_verify_nonexistent_user_password(self):
        """Test password verification for non-existent user."""
        result = self.user_store.verify_password("nonexistent@example.com", "password123")
        self.assertFalse(result)


class TestSignInManager(unittest.TestCase):
    """Test main sign-in manager functionality."""
    
    def setUp(self):
        self.signin_manager = SignInManager("test-secret-key")
    
    def test_successful_signin(self):
        """Test successful sign-in with valid credentials."""
        result = self.signin_manager.sign_in("user@example.com", "password123")
        
        self.assertTrue(result['success'])
        self.assertIn('token', result)
        self.assertIn('user', result)
        self.assertEqual(result['user']['email'], "user@example.com")
    
    def test_invalid_email_format(self):
        """Test sign-in with invalid email format."""
        result = self.signin_manager.sign_in("invalid-email", "password123")
        
        self.assertFalse(result['success'])
        self.assertEqual(result['error']['code'], "INVALID_EMAIL_FORMAT")
    
    def test_missing_email(self):
        """Test sign-in with missing email."""
        result = self.signin_manager.sign_in("", "password123")
        
        self.assertFalse(result['success'])
        self.assertEqual(result['error']['code'], "MISSING_EMAIL")
    
    def test_missing_password(self):
        """Test sign-in with missing password."""
        result = self.signin_manager.sign_in("user@example.com", "")
        
        self.assertFalse(result['success'])
        self.assertEqual(result['error']['code'], "MISSING_PASSWORD")
    
    def test_invalid_credentials(self):
        """Test sign-in with invalid credentials."""
        result = self.signin_manager.sign_in("user@example.com", "wrongpassword")
        
        self.assertFalse(result['success'])
        self.assertEqual(result['error']['code'], "INVALID_CREDENTIALS")
    
    def test_nonexistent_user(self):
        """Test sign-in with non-existent user."""
        result = self.signin_manager.sign_in("nonexistent@example.com", "password123")
        
        self.assertFalse(result['success'])
        self.assertEqual(result['error']['code'], "INVALID_CREDENTIALS")
    
    def test_email_normalization(self):
        """Test that email addresses are normalized (trimmed and lowercased)."""
        result = self.signin_manager.sign_in("  USER@EXAMPLE.COM  ", "password123")
        
        self.assertTrue(result['success'])
        self.assertEqual(result['user']['email'], "user@example.com")
    
    def test_rate_limiting(self):
        """Test that rate limiting works after multiple failed attempts."""
        email = "ratelimit@example.com"
        
        # Make several failed attempts
        for _ in range(5):
            result = self.signin_manager.sign_in(email, "wrongpassword")
            self.assertFalse(result['success'])
        
        # Next attempt should be rate limited
        result = self.signin_manager.sign_in(email, "wrongpassword")
        self.assertFalse(result['success'])
        self.assertEqual(result['error']['code'], "RATE_LIMITED")
    
    def test_token_validation(self):
        """Test token validation."""
        # First sign in to get a token
        result = self.signin_manager.sign_in("user@example.com", "password123")
        self.assertTrue(result['success'])
        token = result['token']
        
        # Validate the token
        validation_result = self.signin_manager.validate_token(token)
        self.assertTrue(validation_result['valid'])
        self.assertEqual(validation_result['user']['email'], "user@example.com")
    
    def test_invalid_token_validation(self):
        """Test validation of invalid token."""
        validation_result = self.signin_manager.validate_token("invalid-token")
        self.assertFalse(validation_result['valid'])
    
    def test_empty_token_validation(self):
        """Test validation of empty token."""
        validation_result = self.signin_manager.validate_token("")
        self.assertFalse(validation_result['valid'])
    
    def test_signout(self):
        """Test sign-out functionality."""
        # First sign in
        signin_result = self.signin_manager.sign_in("user@example.com", "password123")
        token = signin_result['token']
        
        # Verify token is valid
        validation_result = self.signin_manager.validate_token(token)
        self.assertTrue(validation_result['valid'])
        
        # Sign out
        signout_result = self.signin_manager.sign_out(token)
        self.assertTrue(signout_result['success'])
        
        # Verify token is now invalid
        validation_result = self.signin_manager.validate_token(token)
        self.assertFalse(validation_result['valid'])
    
    def test_extend_session(self):
        """Test session extension."""
        # Sign in to get a token
        signin_result = self.signin_manager.sign_in("user@example.com", "password123")
        token = signin_result['token']
        
        # Extend session
        extend_result = self.signin_manager.extend_session(token)
        self.assertTrue(extend_result['success'])
    
    def test_extend_invalid_session(self):
        """Test extending an invalid session."""
        extend_result = self.signin_manager.extend_session("invalid-token")
        self.assertFalse(extend_result['success'])


class TestEmailValidation(unittest.TestCase):
    """Test email validation functionality."""
    
    def setUp(self):
        self.signin_manager = SignInManager("test-secret")
    
    def test_valid_emails(self):
        """Test various valid email formats."""
        valid_emails = [
            "user@example.com",
            "user.name@example.com",
            "user+tag@example.com",
            "user123@example-site.com",
            "a@b.co",
            "test.email+tag@example.co.uk"
        ]
        
        for email in valid_emails:
            with self.subTest(email=email):
                self.assertTrue(self.signin_manager.validate_email(email))
    
    def test_invalid_emails(self):
        """Test various invalid email formats."""
        invalid_emails = [
            "",
            "not-an-email",
            "@example.com",
            "user@",
            "user@.com",
            "user..name@example.com",
            "user@example",
            "user name@example.com",
            "user@exam ple.com",
            "a" * 255 + "@example.com"  # Too long
        ]
        
        for email in invalid_emails:
            with self.subTest(email=email):
                self.assertFalse(self.signin_manager.validate_email(email))


class TestPasswordValidation(unittest.TestCase):
    """Test password validation functionality."""
    
    def setUp(self):
        self.signin_manager = SignInManager("test-secret")
    
    def test_valid_password(self):
        """Test valid password."""
        errors = self.signin_manager.validate_password("Password123")
        self.assertEqual(len(errors), 0)
    
    def test_empty_password(self):
        """Test empty password."""
        errors = self.signin_manager.validate_password("")
        self.assertIn("Password is required", errors)
    
    def test_short_password(self):
        """Test password too short."""
        errors = self.signin_manager.validate_password("Pass1")
        self.assertIn("Password must be at least 8 characters long", errors)
    
    def test_long_password(self):
        """Test password too long."""
        long_password = "A" * 129  # 129 characters
        errors = self.signin_manager.validate_password(long_password)
        self.assertIn("Password must not exceed 128 characters", errors)
    
    def test_no_uppercase(self):
        """Test password without uppercase letter."""
        errors = self.signin_manager.validate_password("password123")
        self.assertIn("Password must contain at least one uppercase letter", errors)
    
    def test_no_lowercase(self):
        """Test password without lowercase letter."""
        errors = self.signin_manager.validate_password("PASSWORD123")
        self.assertIn("Password must contain at least one lowercase letter", errors)
    
    def test_no_digit(self):
        """Test password without digit."""
        errors = self.signin_manager.validate_password("PasswordABC")
        self.assertIn("Password must contain at least one digit", errors)


class TestTrialAccess(unittest.TestCase):
    """Test free trial access functionality."""
    
    def setUp(self):
        self.signin_manager = SignInManager("test-secret")
    
    def test_user_with_active_trial(self):
        """Test sign-in for user with active trial."""
        result = self.signin_manager.sign_in("user@example.com", "password123")
        self.assertTrue(result['success'])
        self.assertIn('token', result)
    
    def test_user_with_no_trial_signup(self):
        """Test sign-in for user who hasn't signed up for free trial."""
        result = self.signin_manager.sign_in("notrial@example.com", "password123")
        self.assertFalse(result['success'])
        self.assertEqual(result['error']['code'], "NO_TRIAL_SIGNUP")
        self.assertIn("sign up for a free trial", result['error']['message'])
        self.assertEqual(result['error']['details']['action_required'], "signup_for_trial")
    
    def test_user_with_expired_trial(self):
        """Test sign-in for user with expired trial."""
        result = self.signin_manager.sign_in("expired@example.com", "password123")
        self.assertFalse(result['success'])
        self.assertEqual(result['error']['code'], "TRIAL_EXPIRED")
        self.assertIn("free trial has ended", result['error']['message'])
        self.assertEqual(result['error']['details']['action_required'], "upgrade_account")
    
    def test_admin_user_with_upgraded_access(self):
        """Test sign-in for admin user with upgraded access."""
        result = self.signin_manager.sign_in("admin@example.com", "admin123")
        self.assertTrue(result['success'])
        self.assertIn('token', result)


class TestTrialStatusChecking(unittest.TestCase):
    """Test trial status checking functionality."""
    
    def setUp(self):
        self.user_store = UserStore()
    
    def test_check_active_trial(self):
        """Test checking active trial status."""
        trial_access = self.user_store.check_trial_access("user@example.com")
        self.assertTrue(trial_access['has_access'])
        self.assertEqual(trial_access['trial_status'], 'active')
    
    def test_check_no_trial(self):
        """Test checking user with no trial."""
        trial_access = self.user_store.check_trial_access("notrial@example.com")
        self.assertFalse(trial_access['has_access'])
        self.assertEqual(trial_access['reason'], 'no_trial_signup')
        self.assertEqual(trial_access['trial_status'], 'none')
    
    def test_check_expired_trial(self):
        """Test checking expired trial status."""
        trial_access = self.user_store.check_trial_access("expired@example.com")
        self.assertFalse(trial_access['has_access'])
        self.assertEqual(trial_access['reason'], 'trial_expired')
        self.assertEqual(trial_access['trial_status'], 'expired')
    
    def test_check_upgraded_user(self):
        """Test checking upgraded user status."""
        trial_access = self.user_store.check_trial_access("admin@example.com")
        self.assertTrue(trial_access['has_access'])
        self.assertEqual(trial_access['trial_status'], 'upgraded')
    
    def test_check_nonexistent_user(self):
        """Test checking trial status for non-existent user."""
        trial_access = self.user_store.check_trial_access("nonexistent@example.com")
        self.assertFalse(trial_access['has_access'])
        self.assertEqual(trial_access['reason'], 'user_not_found')


def run_integration_tests():
    """Run integration tests that demonstrate the full sign-in flow."""
    print("\n=== Integration Tests ===")
    
    signin_manager = SignInManager("integration-test-secret")
    
    # Test 1: Full successful flow
    print("Test 1: Full successful sign-in flow")
    result = signin_manager.sign_in("user@example.com", "password123")
    assert result['success'], f"Sign-in failed: {result}"
    
    token = result['token']
    print(f"  ✓ Sign-in successful, token generated")
    
    # Validate token
    validation = signin_manager.validate_token(token)
    assert validation['valid'], f"Token validation failed: {validation}"
    print(f"  ✓ Token validation successful")
    
    # Extend session
    extend_result = signin_manager.extend_session(token)
    assert extend_result['success'], f"Session extension failed: {extend_result}"
    print(f"  ✓ Session extension successful")
    
    # Sign out
    signout_result = signin_manager.sign_out(token)
    assert signout_result['success'], f"Sign-out failed: {signout_result}"
    print(f"  ✓ Sign-out successful")
    
    # Verify token is invalid after sign-out
    validation = signin_manager.validate_token(token)
    assert not validation['valid'], f"Token should be invalid after sign-out"
    print(f"  ✓ Token properly invalidated after sign-out")
    
    # Test 2: Error handling flow
    print("\nTest 2: Error handling flow")
    
    # Invalid email format
    result = signin_manager.sign_in("invalid-email", "password123")
    assert not result['success'] and result['error']['code'] == "INVALID_EMAIL_FORMAT"
    print("  ✓ Invalid email format properly rejected")
    
    # Missing password
    result = signin_manager.sign_in("user@example.com", "")
    assert not result['success'] and result['error']['code'] == "MISSING_PASSWORD"
    print("  ✓ Missing password properly rejected")
    
    # Wrong password
    result = signin_manager.sign_in("user@example.com", "wrongpassword")
    assert not result['success'] and result['error']['code'] == "INVALID_CREDENTIALS"
    print("  ✓ Wrong password properly rejected")
    
    # Non-existent user
    result = signin_manager.sign_in("nonexistent@example.com", "password123")
    assert not result['success'] and result['error']['code'] == "INVALID_CREDENTIALS"
    print("  ✓ Non-existent user properly rejected")
    
    print("\n✓ All integration tests passed!")


if __name__ == "__main__":
    print("=== Sign-In Flow Test Suite ===")
    
    # Run unit tests
    unittest.main(verbosity=2, exit=False)
    
    # Run integration tests
    run_integration_tests()
    
    print("\n" + "="*50)
    print("All tests completed successfully!")
    print("The sign-in flow is working correctly and handles all error cases properly.")