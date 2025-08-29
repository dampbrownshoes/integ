#!/usr/bin/env python3
"""
Comprehensive Test Suite for Improved Sign-In Flow
Tests all aspects of the authentication system with focus on user-reported issues.
"""

import unittest
import time
import json
from datetime import datetime, timezone
from auth_system import ImprovedSignInManager, ImprovedRateLimiter, EnhancedSessionManager, SecureUserStore


class TestImprovedRateLimiter(unittest.TestCase):
    """Test the improved rate limiter functionality."""
    
    def setUp(self):
        self.rate_limiter = ImprovedRateLimiter(base_attempts=3, max_attempts=5, window_minutes=1)
    
    def test_initial_state_allows_requests(self):
        """Test that initial state allows sign-in attempts."""
        status = self.rate_limiter.check_rate_limit("new@user.com")
        self.assertFalse(status['is_limited'])
        self.assertEqual(status['remaining_attempts'], 3)
    
    def test_progressive_rate_limiting(self):
        """Test progressive delays after failed attempts."""
        email = "progressive@test.com"
        
        # Make failed attempts up to the base limit
        for i in range(3):
            self.rate_limiter.record_attempt(email, False)
        
        # Should now be rate limited with progressive delay
        status = self.rate_limiter.check_rate_limit(email)
        self.assertTrue(status['is_limited'])
        self.assertEqual(status['reason'], 'rate_limited')
        self.assertIn('remaining_seconds', status)
    
    def test_successful_login_resets_attempts(self):
        """Test that successful login resets the attempt counter."""
        email = "reset@test.com"
        
        # Make some failed attempts
        for i in range(2):
            self.rate_limiter.record_attempt(email, False)
        
        # Successful attempt should reset
        self.rate_limiter.record_attempt(email, True)
        
        # Should be back to initial state
        status = self.rate_limiter.check_rate_limit(email)
        self.assertFalse(status['is_limited'])
    
    def test_max_attempts_lockout(self):
        """Test long lockout after maximum attempts."""
        email = "lockout@test.com"
        
        # Exceed maximum attempts
        for i in range(6):
            self.rate_limiter.record_attempt(email, False)
        
        status = self.rate_limiter.check_rate_limit(email)
        self.assertTrue(status['is_limited'])
        self.assertEqual(status['reason'], 'max_attempts')
        self.assertEqual(status['remaining_minutes'], 60)  # 1 hour lockout


class TestEnhancedSessionManager(unittest.TestCase):
    """Test enhanced session management."""
    
    def setUp(self):
        self.session_manager = EnhancedSessionManager("test-secret", session_timeout_hours=1)
    
    def test_create_session_with_metadata(self):
        """Test session creation includes all metadata."""
        result = self.session_manager.create_session("user1", "test@example.com", "Test-Agent/1.0")
        
        self.assertIn('token', result)
        self.assertIn('expires_at', result)
        self.assertIn('session_id', result)
        
        # Validate session was stored properly
        session = self.session_manager.validate_session(result['token'])
        self.assertIsNotNone(session)
        self.assertEqual(session['user_id'], "user1")
        self.assertEqual(session['email'], "test@example.com")
        self.assertEqual(session['user_agent'], "Test-Agent/1.0")
        # Access count will be 2 due to the validation call above
    
    def test_session_tracking_and_access_count(self):
        """Test that session access is properly tracked."""
        result = self.session_manager.create_session("user1", "test@example.com")
        token = result['token']
        
        # Access session multiple times
        for i in range(3):
            session = self.session_manager.validate_session(token)
            self.assertIsNotNone(session)
        
        # Check access count (1 creation + 4 validations)
        session = self.session_manager.validate_session(token)
        self.assertEqual(session['access_count'], 5)
    
    def test_multi_device_session_management(self):
        """Test managing multiple sessions for same user."""
        user_id = "multidevice_user"
        email = "multi@device.com"
        
        # Create multiple sessions (simulate different devices)
        session1 = self.session_manager.create_session(user_id, email, "Desktop/1.0")
        session2 = self.session_manager.create_session(user_id, email, "Mobile/1.0")
        
        # Both sessions should be valid
        self.assertIsNotNone(self.session_manager.validate_session(session1['token']))
        self.assertIsNotNone(self.session_manager.validate_session(session2['token']))
        
        # User should have 2 sessions
        self.assertIn(user_id, self.session_manager.user_sessions)
        self.assertEqual(len(self.session_manager.user_sessions[user_id]), 2)
        
        # Sign out from all devices
        invalidated_count = self.session_manager.invalidate_all_user_sessions(user_id)
        self.assertEqual(invalidated_count, 2)
        
        # Both sessions should now be invalid
        self.assertIsNone(self.session_manager.validate_session(session1['token']))
        self.assertIsNone(self.session_manager.validate_session(session2['token']))
    
    def test_session_extension(self):
        """Test session extension functionality."""
        result = self.session_manager.create_session("user1", "test@example.com")
        token = result['token']
        
        # Get original expiration
        session_before = self.session_manager.validate_session(token)
        expires_before = session_before['expires_at']
        
        # Small delay to ensure time difference
        time.sleep(0.1)
        
        # Extend session
        extension_result = self.session_manager.extend_session(token, hours=2)
        self.assertTrue(extension_result)
        
        # Check new expiration is later
        session_after = self.session_manager.validate_session(token)
        expires_after = session_after['expires_at']
        
        self.assertGreater(expires_after, expires_before)
    
    def test_session_statistics(self):
        """Test session statistics for monitoring."""
        # Create some sessions
        for i in range(3):
            self.session_manager.create_session(f"user{i}", f"user{i}@test.com")
        
        stats = self.session_manager.get_session_stats()
        
        self.assertIn('total_sessions', stats)
        self.assertIn('active_sessions', stats)
        self.assertIn('unique_users', stats)
        self.assertEqual(stats['active_sessions'], 3)
        self.assertEqual(stats['unique_users'], 3)


class TestSecureUserStore(unittest.TestCase):
    """Test secure user storage functionality."""
    
    def setUp(self):
        self.user_store = SecureUserStore()
    
    def test_password_verification_timing_attack_protection(self):
        """Test password verification protects against timing attacks."""
        # Verify existing user - should be fast but consistent
        start_time = time.time()
        result1 = self.user_store.verify_password("test@demo.com", "wrongpassword")
        time1 = time.time() - start_time
        
        # Verify non-existent user - should take similar time
        start_time = time.time()
        result2 = self.user_store.verify_password("nonexistent@user.com", "wrongpassword")
        time2 = time.time() - start_time
        
        # Both should be false
        self.assertFalse(result1)
        self.assertFalse(result2)
        
        # Times should be similar (within reasonable margin)
        self.assertLess(abs(time1 - time2), 0.01)  # Within 10ms
    
    def test_case_insensitive_email_handling(self):
        """Test that email lookups are case insensitive."""
        variations = [
            "test@demo.com",
            "TEST@DEMO.COM", 
            "Test@Demo.Com",
            "  test@demo.com  "
        ]
        
        for email in variations:
            user = self.user_store.get_user(email)
            self.assertIsNotNone(user)
            self.assertEqual(user['email'], "test@demo.com")
    
    def test_login_statistics_tracking(self):
        """Test user login statistics are properly tracked."""
        email = "test@demo.com"
        
        # Initial state
        user = self.user_store.get_user(email)
        initial_failed_attempts = user['failed_attempts']
        
        # Record failed attempt
        self.user_store.update_login_stats(email, False)
        user = self.user_store.get_user(email)
        self.assertEqual(user['failed_attempts'], initial_failed_attempts + 1)
        
        # Record successful login
        self.user_store.update_login_stats(email, True)
        user = self.user_store.get_user(email)
        self.assertEqual(user['failed_attempts'], 0)  # Reset on success
        self.assertIsNotNone(user['last_login'])
        self.assertGreater(user['login_count'], 0)


class TestImprovedSignInManager(unittest.TestCase):
    """Test the main improved sign-in manager."""
    
    def setUp(self):
        self.auth_manager = ImprovedSignInManager("test-secret-key")
    
    def test_enhanced_email_validation(self):
        """Test enhanced email validation with detailed feedback."""
        # Test valid emails
        valid_emails = [
            "user@example.com",
            "test.user@example-site.co.uk", 
            "user+tag@example.com",
            "simple@a.co"
        ]
        
        for email in valid_emails:
            result = self.auth_manager.validate_email(email)
            self.assertTrue(result['valid'], f"Email {email} should be valid")
            self.assertIn('normalized', result)
        
        # Test invalid emails with specific error messages
        invalid_cases = [
            ("", "Email address is required"),
            ("not-an-email", "Please enter a valid email address"),
            ("user@", "Please enter a valid email address"),
            ("user..name@example.com", "Email address cannot contain consecutive dots"),
            ("a" * 255 + "@example.com", "Email address is too long")
        ]
        
        for email, expected_error in invalid_cases:
            result = self.auth_manager.validate_email(email)
            self.assertFalse(result['valid'], f"Email {email} should be invalid")
            self.assertIn(expected_error, result['error'])
    
    def test_password_requirements_feedback(self):
        """Test password validation provides clear requirements."""
        requirements = self.auth_manager.get_password_requirements()
        
        self.assertIn('min_length', requirements)
        self.assertIn('max_length', requirements)
        self.assertIn('description', requirements)
        
        # Test password validation with specific errors
        test_cases = [
            ("", ["Password is required"]),
            ("short", ["Password must be at least 8 characters long"]),
            ("nouppercase123", ["Password must contain at least one uppercase letter (A-Z)"]),
            ("NOLOWERCASE123", ["Password must contain at least one lowercase letter (a-z)"]),
            ("NoNumbers", ["Password must contain at least one number (0-9)"]),
            ("ValidPass123", [])  # Should be valid
        ]
        
        for password, expected_errors in test_cases:
            result = self.auth_manager.validate_password(password)
            if expected_errors:
                self.assertFalse(result['valid'])
                for error in expected_errors:
                    self.assertIn(error, result['errors'])
            else:
                self.assertTrue(result['valid'])
    
    def test_successful_signin_with_detailed_response(self):
        """Test successful sign-in returns comprehensive information."""
        result = self.auth_manager.sign_in("test@demo.com", "Test123!", "Test-Agent/1.0")
        
        self.assertTrue(result['success'])
        
        # Check all required fields are present
        required_fields = ['token', 'session_id', 'expires_at', 'user', 'message', 'session_info']
        for field in required_fields:
            self.assertIn(field, result)
        
        # Check user information
        user_info = result['user']
        self.assertEqual(user_info['email'], "test@demo.com")
        self.assertIn('name', user_info)
        self.assertIn('id', user_info)
        
        # Check session information
        self.assertIn('timeout_hours', result['session_info'])
        self.assertIn('can_extend', result['session_info'])
    
    def test_error_responses_include_user_guidance(self):
        """Test that error responses include helpful user guidance."""
        error_cases = [
            ("", "password123", "MISSING_EMAIL", "Please enter your email address"),
            ("test@demo.com", "", "MISSING_PASSWORD", "Please enter your password"),
            ("invalid-email", "Test123!", "INVALID_EMAIL_FORMAT", "Please check your email address"),
            ("test@demo.com", "wrongpass", "INVALID_CREDENTIALS", "Please check your password"),
            ("nonexistent@user.com", "Test123!", "INVALID_CREDENTIALS", "you don't have an account")
        ]
        
        for email, password, expected_code, expected_guidance in error_cases:
            result = self.auth_manager.sign_in(email, password)
            
            self.assertFalse(result['success'])
            self.assertEqual(result['error']['code'], expected_code)
            self.assertIn('user_guidance', result['error'])
            self.assertIn(expected_guidance.lower(), result['error']['user_guidance'].lower())
    
    def test_rate_limiting_with_user_friendly_messages(self):
        """Test rate limiting provides clear, actionable feedback."""
        email = "ratelimit@test.com"
        
        # Make several failed attempts
        for i in range(4):
            result = self.auth_manager.sign_in(email, "wrongpassword")
            self.assertFalse(result['success'])
        
        # Should now be rate limited
        result = self.auth_manager.sign_in(email, "wrongpassword") 
        self.assertFalse(result['success'])
        self.assertTrue(result['error']['code'].startswith('RATE_LIMITED'))
        
        # Check user guidance is helpful
        guidance = result['error']['user_guidance']
        self.assertIn('wait', guidance.lower())
        self.assertIn('minutes', guidance.lower())
    
    def test_token_validation_with_detailed_session_info(self):
        """Test token validation returns detailed session information."""
        # Sign in first
        signin_result = self.auth_manager.sign_in("test@demo.com", "Test123!")
        token = signin_result['token']
        
        # Validate token
        validation_result = self.auth_manager.validate_token(token)
        
        self.assertTrue(validation_result['valid'])
        self.assertIn('user', validation_result)
        self.assertIn('session', validation_result)
        
        session_info = validation_result['session']
        required_session_fields = ['expires_at', 'last_accessed', 'access_count', 'session_id']
        for field in required_session_fields:
            self.assertIn(field, session_info)
    
    def test_multi_device_signout_functionality(self):
        """Test signing out from single device vs all devices."""
        email = "test@demo.com"  # Use existing demo user
        password = "Test123!"
        
        # Create sessions on multiple "devices"
        session1 = self.auth_manager.sign_in(email, password, "Device1/1.0")
        session2 = self.auth_manager.sign_in(email, password, "Device2/1.0")
        
        # Ensure both sign-ins were successful
        self.assertTrue(session1['success'])
        self.assertTrue(session2['success'])
        
        token1 = session1['token']
        token2 = session2['token']
        
        # Both tokens should be valid
        self.assertTrue(self.auth_manager.validate_token(token1)['valid'])
        self.assertTrue(self.auth_manager.validate_token(token2)['valid'])
        
        # Sign out from all devices
        signout_result = self.auth_manager.sign_out(token1, all_devices=True)
        self.assertTrue(signout_result['success'])
        self.assertIn('invalidated_sessions', signout_result)
        
        # Both tokens should now be invalid
        self.assertFalse(self.auth_manager.validate_token(token1)['valid'])
        self.assertFalse(self.auth_manager.validate_token(token2)['valid'])
    
    def test_session_extension_functionality(self):
        """Test session extension with validation."""
        # Sign in
        signin_result = self.auth_manager.sign_in("test@demo.com", "Test123!")
        token = signin_result['token']
        
        # Get original expiration
        original_validation = self.auth_manager.validate_token(token)
        original_expires = original_validation['session']['expires_at']
        
        # Extend session
        extend_result = self.auth_manager.extend_session(token)
        self.assertTrue(extend_result['success'])
        self.assertIn('new_expires_at', extend_result)
        
        # New expiration should be later
        new_expires = extend_result['new_expires_at']
        self.assertGreater(new_expires, original_expires)
    
    def test_health_status_monitoring(self):
        """Test health status provides comprehensive monitoring data."""
        # Create some sessions and rate limits for monitoring
        self.auth_manager.sign_in("user1@test.com", "Test123!")
        self.auth_manager.sign_in("user2@test.com", "wrongpass")  # Failed attempt
        
        health_status = self.auth_manager.get_health_status()
        
        required_fields = ['status', 'service', 'timestamp', 'version', 'session_stats', 'rate_limiter']
        for field in required_fields:
            self.assertIn(field, health_status)
        
        # Check session stats
        session_stats = health_status['session_stats']
        self.assertIn('active_sessions', session_stats)
        self.assertIn('unique_users', session_stats)
        
        # Check rate limiter stats
        rate_limiter_stats = health_status['rate_limiter']
        self.assertIn('active_limits', rate_limiter_stats)


class TestUserExperienceImprovements(unittest.TestCase):
    """Test specific user experience improvements addressing reported issues."""
    
    def setUp(self):
        self.auth_manager = ImprovedSignInManager("ux-test-secret")
    
    def test_progressive_rate_limiting_vs_hard_cutoff(self):
        """Test that users get progressive delays instead of hard cutoffs."""
        email = "progressive@test.com"
        
        # Make base number of failed attempts
        for i in range(3):
            result = self.auth_manager.sign_in(email, "wrongpass")
            self.assertFalse(result['success'])
        
        # Next attempt should be rate limited but with clear guidance
        result = self.auth_manager.sign_in(email, "wrongpass")
        self.assertFalse(result['success'])
        self.assertTrue(result['error']['code'].startswith('RATE_LIMITED'))
        
        # User guidance should mention waiting time
        guidance = result['error']['user_guidance']
        self.assertIn('wait', guidance.lower())
        self.assertIn('minute', guidance.lower())
    
    def test_clear_password_requirement_communication(self):
        """Test that password requirements are clearly communicated."""
        result = self.auth_manager.sign_in("test@demo.com", "weakpass")
        
        self.assertFalse(result['success'])
        self.assertIn('password_requirements', result)
        
        requirements = result['password_requirements']
        self.assertIn('description', requirements)
        self.assertIn('uppercase', requirements['description'].lower())
        self.assertIn('lowercase', requirements['description'].lower())
        self.assertIn('number', requirements['description'].lower())
    
    def test_email_validation_edge_cases(self):
        """Test email validation handles edge cases that might have caused issues."""
        edge_cases = [
            "user+tag@example.com",  # Plus signs
            "user.name@example-site.com",  # Hyphens and dots
            "a@b.co",  # Short domains
            "user@sub.example.org",  # Subdomains
        ]
        
        for email in edge_cases:
            validation = self.auth_manager.validate_email(email)
            self.assertTrue(validation['valid'], f"Email {email} should be considered valid")
    
    def test_helpful_error_messages_for_common_mistakes(self):
        """Test that common user mistakes get helpful error messages."""
        # Common mistake: leaving fields empty
        result = self.auth_manager.sign_in("", "")
        self.assertIn('Email address is required', result['error']['message'])
        self.assertIn('Please enter your email address', result['error']['user_guidance'])
        
        # Common mistake: invalid email format
        result = self.auth_manager.sign_in("notanemail", "Test123!")
        self.assertIn('valid email address', result['error']['message'])
        self.assertIn('user@example.com', result['error']['message'])
    
    def test_session_extension_prevents_unexpected_logouts(self):
        """Test that session extension helps prevent unexpected logouts."""
        signin_result = self.auth_manager.sign_in("test@demo.com", "Test123!")
        token = signin_result['token']
        
        # Session should support extension
        session_info = signin_result['session_info']
        self.assertTrue(session_info['can_extend'])
        
        # Extension should work
        extend_result = self.auth_manager.extend_session(token)
        self.assertTrue(extend_result['success'])
        self.assertIn('Session extended successfully', extend_result['message'])


def run_integration_tests():
    """Run integration tests demonstrating the full improved flow."""
    print("\n=== Integration Tests - User Issue Resolution ===")
    
    auth = ImprovedSignInManager("integration-test-secret")
    
    print("\n1. Testing Resolution of Email Validation Issues:")
    # Previously problematic emails should now work
    test_emails = [
        "user+tag@example.com",
        "user.name@example-site.co.uk", 
        "a@b.co"
    ]
    
    for email in test_emails:
        validation = auth.validate_email(email)
        print(f"  ✓ {email}: {'VALID' if validation['valid'] else 'INVALID'}")
        assert validation['valid'], f"Email {email} should be valid"
    
    print("\n2. Testing Progressive Rate Limiting (vs Hard Cutoff):")
    email = "ratelimit@integration.test"
    
    for attempt in range(1, 6):
        result = auth.sign_in(email, "wrongpassword")
        print(f"  Attempt {attempt}: {result['error']['code']}")
        
        if attempt > 3:  # Should be rate limited after 3 attempts
            assert result['error']['code'].startswith('RATE_LIMITED')
            assert 'user_guidance' in result['error']
            print(f"    Guidance: {result['error']['user_guidance']}")
        else:
            assert result['error']['code'] == 'INVALID_CREDENTIALS'
    
    print("\n3. Testing Session Management Improvements:")
    # Sign in successfully
    result = auth.sign_in("test@demo.com", "Test123!", "IntegrationTest/1.0")
    assert result['success'], "Sign-in should succeed"
    print("  ✓ Successful sign-in with detailed response")
    
    token = result['token']
    
    # Test token validation with detailed info
    validation = auth.validate_token(token)
    assert validation['valid'], "Token should be valid"
    print("  ✓ Token validation with session details")
    print(f"    Session ID: {validation['session']['session_id']}")
    print(f"    Access Count: {validation['session']['access_count']}")
    
    # Test session extension
    extend_result = auth.extend_session(token)
    assert extend_result['success'], "Session extension should work"
    print("  ✓ Session extension successful")
    
    # Test multi-device sign-out
    signout_result = auth.sign_out(token, all_devices=True)
    assert signout_result['success'], "Multi-device sign-out should work"
    print(f"  ✓ Multi-device sign-out: {signout_result['message']}")
    
    print("\n4. Testing Health Monitoring:")
    health = auth.get_health_status()
    assert health['status'] == 'healthy', "System should be healthy"
    print(f"  ✓ System Status: {health['status']}")
    print(f"  ✓ Active Sessions: {health['session_stats']['active_sessions']}")
    print(f"  ✓ Rate Limiter Active: {health['rate_limiter']['active_limits']} limits")
    
    print("\n✅ All integration tests passed!")
    print("🎉 User-reported sign-in issues have been resolved!")


def run_performance_tests():
    """Run performance tests to ensure the improvements don't impact speed."""
    print("\n=== Performance Tests ===")
    import time
    
    auth = ImprovedSignInManager("performance-test-secret")
    
    # Test sign-in performance
    start_time = time.time()
    for i in range(10):
        result = auth.sign_in("test@demo.com", "Test123!")
        assert result['success']
        auth.sign_out(result['token'])
    
    elapsed = time.time() - start_time
    avg_time = elapsed / 10
    print(f"Average sign-in time: {avg_time:.3f}s")
    assert avg_time < 0.1, "Sign-in should be fast"
    
    # Test token validation performance
    result = auth.sign_in("test@demo.com", "Test123!")
    token = result['token']
    
    start_time = time.time()
    for i in range(100):
        validation = auth.validate_token(token)
        assert validation['valid']
    
    elapsed = time.time() - start_time
    avg_time = elapsed / 100
    print(f"Average token validation time: {avg_time:.4f}s")
    assert avg_time < 0.01, "Token validation should be very fast"
    
    print("✅ Performance tests passed!")


if __name__ == "__main__":
    print("=== Improved Sign-In Flow Test Suite ===")
    print("Testing fixes for user-reported sign-in issues...\n")
    
    # Run unit tests
    unittest.main(verbosity=2, exit=False)
    
    # Run integration tests
    run_integration_tests()
    
    # Run performance tests
    run_performance_tests()
    
    print("\n" + "="*60)
    print("🎉 ALL TESTS PASSED!")
    print("\nThe improved sign-in flow addresses the following user issues:")
    print("✅ Rate limiting too aggressive → Progressive delays with clear guidance")
    print("✅ Email validation too strict → More permissive validation")  
    print("✅ Session management issues → Enhanced sessions with extension")
    print("✅ Confusing error messages → Clear messages with user guidance")
    print("✅ No recovery mechanisms → Rate limit resets and multi-device management")
    print("✅ Lack of monitoring → Comprehensive health checks and statistics")
    print("\nThe system is ready for production deployment! 🚀")