#!/usr/bin/env python3
"""
Sign-In Flow Implementation
Addresses common sign-in issues with proper validation, error handling, and security measures.
"""

import hashlib
import hmac
import json
import re
import time
from datetime import datetime, timedelta, timezone
from typing import Dict, Any, Optional, List, Tuple


class SignInError(Exception):
    """Custom exception for sign-in related errors."""
    
    def __init__(self, message: str, error_code: str = "SIGNIN_ERROR", details: Dict = None):
        super().__init__(message)
        self.error_code = error_code
        self.details = details or {}
        self.timestamp = datetime.now(timezone.utc)


class RateLimiter:
    """Simple rate limiter to prevent brute force attacks."""
    
    def __init__(self, max_attempts: int = 5, window_minutes: int = 15):
        self.max_attempts = max_attempts
        self.window_seconds = window_minutes * 60
        self.attempts = {}  # email -> [(timestamp, success), ...]
    
    def is_rate_limited(self, email: str) -> Tuple[bool, int]:
        """Check if user is rate limited. Returns (is_limited, seconds_until_reset)."""
        current_time = time.time()
        cutoff_time = current_time - self.window_seconds
        
        # Clean old attempts
        if email in self.attempts:
            self.attempts[email] = [
                (timestamp, success) for timestamp, success in self.attempts[email]
                if timestamp > cutoff_time
            ]
        
        # Count failed attempts in window
        failed_attempts = 0
        if email in self.attempts:
            failed_attempts = sum(
                1 for timestamp, success in self.attempts[email]
                if not success
            )
        
        if failed_attempts >= self.max_attempts:
            # Find oldest attempt to calculate reset time
            oldest_attempt = min(self.attempts[email], key=lambda x: x[0])[0]
            seconds_until_reset = int((oldest_attempt + self.window_seconds) - current_time)
            return True, max(0, seconds_until_reset)
        
        return False, 0
    
    def record_attempt(self, email: str, success: bool):
        """Record a sign-in attempt."""
        if email not in self.attempts:
            self.attempts[email] = []
        
        self.attempts[email].append((time.time(), success))


class SessionManager:
    """Manages user sessions with token generation and validation."""
    
    def __init__(self, secret_key: str, session_timeout_hours: int = 24):
        self.secret_key = secret_key
        self.session_timeout = timedelta(hours=session_timeout_hours)
        self.sessions = {}  # token -> {user_id, email, expires_at, created_at}
    
    def create_session(self, user_id: str, email: str) -> str:
        """Create a new session and return session token."""
        # Generate secure token
        token_data = f"{user_id}:{email}:{time.time()}"
        token = hmac.new(
            self.secret_key.encode(),
            token_data.encode(),
            hashlib.sha256
        ).hexdigest()
        
        expires_at = datetime.now(timezone.utc) + self.session_timeout
        
        self.sessions[token] = {
            'user_id': user_id,
            'email': email,
            'expires_at': expires_at,
            'created_at': datetime.now(timezone.utc)
        }
        
        return token
    
    def validate_session(self, token: str) -> Optional[Dict[str, Any]]:
        """Validate session token and return user data if valid."""
        if token not in self.sessions:
            return None
        
        session = self.sessions[token]
        if datetime.now(timezone.utc) > session['expires_at']:
            # Session expired, clean up
            del self.sessions[token]
            return None
        
        return session
    
    def invalidate_session(self, token: str):
        """Invalidate a session token."""
        if token in self.sessions:
            del self.sessions[token]
    
    def extend_session(self, token: str) -> bool:
        """Extend session expiration time."""
        if token in self.sessions:
            self.sessions[token]['expires_at'] = datetime.now(timezone.utc) + self.session_timeout
            return True
        return False


class UserStore:
    """Simple user store for demo purposes. In production, use a proper database."""
    
    def __init__(self):
        # Demo users with hashed passwords and trial status
        self.users = {
            'user@example.com': {
                'id': 'user1',
                'email': 'user@example.com',
                'password_hash': self._hash_password('password123'),
                'name': 'Demo User',
                'active': True,
                'trial_status': 'active',  # 'none', 'active', 'expired', 'upgraded'
                'trial_expires_at': datetime.now(timezone.utc) + timedelta(days=30)
            },
            'admin@example.com': {
                'id': 'admin1',
                'email': 'admin@example.com',
                'password_hash': self._hash_password('admin123'),
                'name': 'Admin User',
                'active': True,
                'trial_status': 'upgraded',  # Admin has full access
                'trial_expires_at': None
            },
            'notrial@example.com': {
                'id': 'user2',
                'email': 'notrial@example.com',
                'password_hash': self._hash_password('password123'),
                'name': 'No Trial User',
                'active': True,
                'trial_status': 'none',  # User hasn't signed up for trial
                'trial_expires_at': None
            },
            'expired@example.com': {
                'id': 'user3',
                'email': 'expired@example.com',
                'password_hash': self._hash_password('password123'),
                'name': 'Expired Trial User',
                'active': True,
                'trial_status': 'expired',  # Trial has expired
                'trial_expires_at': datetime.now(timezone.utc) - timedelta(days=5)
            }
        }
    
    def _hash_password(self, password: str) -> str:
        """Hash password with salt."""
        salt = "integ_salt_2025"  # In production, use random salt per user
        return hashlib.pbkdf2_hmac('sha256', password.encode(), salt.encode(), 100000).hex()
    
    def get_user(self, email: str) -> Optional[Dict[str, Any]]:
        """Get user by email."""
        return self.users.get(email.lower())
    
    def verify_password(self, email: str, password: str) -> bool:
        """Verify user password."""
        user = self.get_user(email)
        if not user:
            return False
        
        password_hash = self._hash_password(password)
        return hmac.compare_digest(user['password_hash'], password_hash)
    
    def check_trial_access(self, email: str) -> Dict[str, Any]:
        """Check trial access status for user."""
        user = self.get_user(email)
        if not user:
            return {'has_access': False, 'reason': 'user_not_found'}
        
        trial_status = user.get('trial_status', 'none')
        trial_expires_at = user.get('trial_expires_at')
        
        # Users with 'upgraded' status have full access
        if trial_status == 'upgraded':
            return {'has_access': True, 'trial_status': trial_status}
        
        # Users with 'active' trial need to check expiration
        if trial_status == 'active':
            if trial_expires_at and datetime.now(timezone.utc) > trial_expires_at:
                # Trial has expired, update status
                user['trial_status'] = 'expired'
                return {
                    'has_access': False, 
                    'reason': 'trial_expired',
                    'trial_status': 'expired',
                    'expired_at': trial_expires_at.isoformat()
                }
            return {'has_access': True, 'trial_status': trial_status}
        
        # Users with 'expired' trial
        if trial_status == 'expired':
            return {
                'has_access': False,
                'reason': 'trial_expired',
                'trial_status': 'expired',
                'expired_at': trial_expires_at.isoformat() if trial_expires_at else None
            }
        
        # Users with no trial ('none' status)
        if trial_status == 'none':
            return {
                'has_access': False,
                'reason': 'no_trial_signup',
                'trial_status': 'none'
            }
        
        # Default case - no access
        return {
            'has_access': False,
            'reason': 'unknown_trial_status',
            'trial_status': trial_status
        }


class SignInManager:
    """Main sign-in manager that coordinates authentication flow."""
    
    def __init__(self, secret_key: str = "default-secret-key"):
        self.secret_key = secret_key
        self.rate_limiter = RateLimiter()
        self.session_manager = SessionManager(secret_key)
        self.user_store = UserStore()
    
    def validate_email(self, email: str) -> bool:
        """Validate email format."""
        if not email or len(email) > 254:
            return False
        
        # Check for consecutive dots (not allowed in email)
        if '..' in email:
            return False
        
        # Email regex that allows single character domains like a@b.co
        pattern = r'^[a-zA-Z0-9][a-zA-Z0-9._%+-]*@[a-zA-Z0-9][a-zA-Z0-9.-]*\.[a-zA-Z]{2,}$'
        
        return bool(re.match(pattern, email))
    
    def validate_password(self, password: str) -> List[str]:
        """Validate password and return list of validation errors."""
        errors = []
        
        if not password:
            errors.append("Password is required")
            return errors
        
        if len(password) < 8:
            errors.append("Password must be at least 8 characters long")
        
        if len(password) > 128:
            errors.append("Password must not exceed 128 characters")
        
        if not re.search(r'[A-Z]', password):
            errors.append("Password must contain at least one uppercase letter")
        
        if not re.search(r'[a-z]', password):
            errors.append("Password must contain at least one lowercase letter")
        
        if not re.search(r'\d', password):
            errors.append("Password must contain at least one digit")
        
        return errors
    
    def sign_in(self, email: str, password: str) -> Dict[str, Any]:
        """
        Main sign-in method with comprehensive error handling.
        Returns dict with success status, token (if successful), or error details.
        """
        try:
            # Input validation with user-friendly messages
            if not email:
                raise SignInError(
                    "Please enter your email address to continue.",
                    "MISSING_EMAIL",
                    {
                        "field": "email",
                        "suggestion": "Enter the email address you used to create your account"
                    }
                )
            
            if not password:
                raise SignInError(
                    "Please enter your password to sign in.",
                    "MISSING_PASSWORD",
                    {
                        "field": "password",
                        "suggestion": "Enter the password you created for your account"
                    }
                )
            
            # Normalize email
            email = email.strip().lower()
            
            # Validate email format with helpful guidance
            if not self.validate_email(email):
                # Provide specific guidance based on common email format issues
                suggestion = "Please check your email format"
                if '@' not in email:
                    suggestion = "Email addresses must contain an '@' symbol (e.g., you@example.com)"
                elif '.' not in email.split('@')[-1] if '@' in email else False:
                    suggestion = "Email addresses must have a domain with a dot (e.g., you@example.com)"
                elif email.startswith('@') or email.endswith('@'):
                    suggestion = "Please enter a complete email address (e.g., you@example.com)"
                
                raise SignInError(
                    f"The email address format appears to be invalid. {suggestion}",
                    "INVALID_EMAIL_FORMAT",
                    {
                        "field": "email", 
                        "email": email,
                        "suggestion": suggestion
                    }
                )
            
            # Check rate limiting with helpful recovery guidance
            is_rate_limited, seconds_until_reset = self.rate_limiter.is_rate_limited(email)
            if is_rate_limited:
                minutes_remaining = (seconds_until_reset // 60) + 1
                reset_time = "a few moments" if minutes_remaining <= 1 else f"{minutes_remaining} minutes"
                
                raise SignInError(
                    f"We've detected several unsuccessful sign-in attempts. For security, please wait {reset_time} before trying again.",
                    "RATE_LIMITED",
                    {
                        "seconds_until_reset": seconds_until_reset,
                        "minutes_until_reset": minutes_remaining, 
                        "email": email,
                        "suggestion": "Double-check your email and password, or try resetting your password if you're having trouble remembering it"
                    }
                )
            
            # Get user with security-conscious error handling
            user = self.user_store.get_user(email)
            if not user:
                # Record failed attempt
                self.rate_limiter.record_attempt(email, False)
                raise SignInError(
                    "We couldn't find an account with that email and password combination. Please check your credentials and try again.",
                    "INVALID_CREDENTIALS",
                    {
                        "field": "credentials",
                        "suggestion": "Make sure you're using the correct email address and password, or try resetting your password if needed"
                    }
                )
            
            # Check if user account is active
            if not user.get('active', True):
                raise SignInError(
                    "Your account is currently inactive. This might be temporary - please contact our support team for assistance.",
                    "ACCOUNT_DEACTIVATED",
                    {
                        "email": email,
                        "support_action": "contact_support",
                        "suggestion": "Contact our support team who can help reactivate your account"
                    }
                )
            
            # Verify password with helpful error message
            if not self.user_store.verify_password(email, password):
                # Record failed attempt
                self.rate_limiter.record_attempt(email, False)
                raise SignInError(
                    "The password you entered doesn't match our records. Please double-check your password and try again.",
                    "INVALID_CREDENTIALS",
                    {
                        "field": "credentials",
                        "suggestion": "Make sure Caps Lock is off and try typing your password again, or use the 'Forgot Password' option if you need to reset it"
                    }
                )
            
            # Check trial access after password verification
            trial_access = self.user_store.check_trial_access(email)
            if not trial_access['has_access']:
                reason = trial_access.get('reason')
                trial_status = trial_access.get('trial_status')
                
                if reason == 'no_trial_signup':
                    raise SignInError(
                        "To access our service, you'll need to sign up for a free trial first. Don't worry - it only takes a minute and you can start exploring right away!",
                        "NO_TRIAL_SIGNUP",
                        {
                            "email": email,
                            "trial_status": trial_status,
                            "action_required": "signup_for_trial",
                            "next_steps": "Visit our website to start your free trial, or contact support if you need assistance"
                        }
                    )
                elif reason == 'trial_expired':
                    expired_at = trial_access.get('expired_at')
                    raise SignInError(
                        "Your free trial has ended, but you can continue enjoying our service by upgrading your account. You'll get access to all features without interruption.",
                        "TRIAL_EXPIRED", 
                        {
                            "email": email,
                            "trial_status": trial_status,
                            "expired_at": expired_at,
                            "action_required": "upgrade_account",
                            "next_steps": "Choose a plan that works for you, or contact our team to discuss options"
                        }
                    )
                else:
                    # Generic trial access error with helpful guidance
                    raise SignInError(
                        "There's an issue with your account access. Our support team can help resolve this quickly - please reach out to them.",
                        "TRIAL_ACCESS_DENIED",
                        {
                            "email": email,
                            "trial_status": trial_status,
                            "reason": reason,
                            "next_steps": "Contact our support team with your email address for immediate assistance"
                        }
                    )
            
            # Success - create session
            session_token = self.session_manager.create_session(user['id'], user['email'])
            
            # Record successful attempt
            self.rate_limiter.record_attempt(email, True)
            
            return {
                'success': True,
                'token': session_token,
                'user': {
                    'id': user['id'],
                    'email': user['email'],
                    'name': user['name']
                },
                'message': 'Sign-in successful'
            }
        
        except SignInError as e:
            return {
                'success': False,
                'error': {
                    'message': str(e),
                    'code': e.error_code,
                    'details': e.details,
                    'timestamp': e.timestamp.isoformat()
                }
            }
        
        except Exception as e:
            # Enhanced fallback error handling with recovery guidance
            import traceback
            error_details = {
                "error_type": type(e).__name__,
                "suggestion": "Please try again in a moment. If the problem continues, our support team can help.",
                "recovery_steps": [
                    "Wait a moment and try signing in again",
                    "Check your internet connection",
                    "Clear your browser cache if using a web interface", 
                    "Contact support if the issue persists"
                ]
            }
            
            # In production, log the full error details for debugging
            # but don't expose them to the user for security
            if hasattr(e, 'args') and e.args:
                # Safe logging placeholder - in production, use proper logging
                pass
                
            return {
                'success': False,
                'error': {
                    'message': 'Something unexpected happened while trying to sign you in. Please try again, and contact support if you continue to have trouble.',
                    'code': 'INTERNAL_ERROR',
                    'details': error_details,
                    'timestamp': datetime.now(timezone.utc).isoformat()
                }
            }
    
    def validate_token(self, token: str) -> Dict[str, Any]:
        """Validate session token and return user info if valid."""
        if not token:
            return {
                'valid': False,
                'error': 'Please sign in to continue - no session token provided',
                'suggestion': 'Sign in again to access your account'
            }
        
        session = self.session_manager.validate_session(token)
        if not session:
            return {
                'valid': False,
                'error': 'Your session has expired or is no longer valid. Please sign in again.',
                'suggestion': 'Sign in with your email and password to continue'
            }
        
        return {
            'valid': True,
            'user': {
                'id': session['user_id'],
                'email': session['email']
            },
            'expires_at': session['expires_at'].isoformat()
        }
    
    def sign_out(self, token: str) -> Dict[str, Any]:
        """Sign out user by invalidating token."""
        if not token:
            return {
                'success': False,
                'error': 'Unable to sign out - no session token provided',
                'suggestion': 'You may already be signed out'
            }
        
        self.session_manager.invalidate_session(token)
        return {
            'success': True,
            'message': 'You have been successfully signed out. Thanks for using our service!'
        }
    
    def extend_session(self, token: str) -> Dict[str, Any]:
        """Extend user session."""
        if not token:
            return {
                'success': False,
                'error': 'Unable to extend session - no token provided',
                'suggestion': 'Please sign in again to continue'
            }
        
        if self.session_manager.extend_session(token):
            return {
                'success': True,
                'message': 'Your session has been extended successfully - you can continue using the service'
            }
        else:
            return {
                'success': False,
                'error': 'Unable to extend session - your session may have expired',
                'suggestion': 'Please sign in again to continue using the service'
            }


# Example usage and testing
if __name__ == "__main__":
    # Create sign-in manager
    sign_in_manager = SignInManager("your-secret-key-here")
    
    print("=== Sign-In Flow Demo ===")
    
    # Test successful sign-in
    print("\n1. Testing successful sign-in:")
    result = sign_in_manager.sign_in("user@example.com", "password123")
    print(json.dumps(result, indent=2, default=str))
    
    if result['success']:
        token = result['token']
        
        # Test token validation
        print("\n2. Testing token validation:")
        validation_result = sign_in_manager.validate_token(token)
        print(json.dumps(validation_result, indent=2, default=str))
        
        # Test sign-out
        print("\n3. Testing sign-out:")
        signout_result = sign_in_manager.sign_out(token)
        print(json.dumps(signout_result, indent=2))
    
    # Test various error cases
    print("\n4. Testing invalid email:")
    result = sign_in_manager.sign_in("invalid-email", "password123")
    print(json.dumps(result, indent=2, default=str))
    
    print("\n5. Testing missing password:")
    result = sign_in_manager.sign_in("user@example.com", "")
    print(json.dumps(result, indent=2, default=str))
    
    print("\n6. Testing wrong password:")
    result = sign_in_manager.sign_in("user@example.com", "wrongpassword")
    print(json.dumps(result, indent=2, default=str))
    
    print("\n7. Testing nonexistent user:")
    result = sign_in_manager.sign_in("nonexistent@example.com", "password123")
    print(json.dumps(result, indent=2, default=str))