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
        # Demo users with hashed passwords
        self.users = {
            'user@example.com': {
                'id': 'user1',
                'email': 'user@example.com',
                'password_hash': self._hash_password('password123'),
                'name': 'Demo User',
                'active': True
            },
            'admin@example.com': {
                'id': 'admin1',
                'email': 'admin@example.com',
                'password_hash': self._hash_password('admin123'),
                'name': 'Admin User',
                'active': True
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
            # Input validation
            if not email:
                raise SignInError(
                    "Email address is required",
                    "MISSING_EMAIL",
                    {"field": "email"}
                )
            
            if not password:
                raise SignInError(
                    "Password is required",
                    "MISSING_PASSWORD",
                    {"field": "password"}
                )
            
            # Normalize email
            email = email.strip().lower()
            
            # Validate email format
            if not self.validate_email(email):
                raise SignInError(
                    "Please enter a valid email address",
                    "INVALID_EMAIL_FORMAT",
                    {"field": "email", "email": email}
                )
            
            # Check rate limiting
            is_rate_limited, seconds_until_reset = self.rate_limiter.is_rate_limited(email)
            if is_rate_limited:
                raise SignInError(
                    f"Too many failed attempts. Please try again in {seconds_until_reset // 60 + 1} minutes.",
                    "RATE_LIMITED",
                    {"seconds_until_reset": seconds_until_reset, "email": email}
                )
            
            # Get user
            user = self.user_store.get_user(email)
            if not user:
                # Record failed attempt
                self.rate_limiter.record_attempt(email, False)
                raise SignInError(
                    "Invalid email or password",
                    "INVALID_CREDENTIALS",
                    {"field": "credentials"}
                )
            
            # Check if user is active
            if not user.get('active', True):
                raise SignInError(
                    "Your account has been deactivated. Please contact support.",
                    "ACCOUNT_DEACTIVATED",
                    {"email": email}
                )
            
            # Verify password
            if not self.user_store.verify_password(email, password):
                # Record failed attempt
                self.rate_limiter.record_attempt(email, False)
                raise SignInError(
                    "Invalid email or password",
                    "INVALID_CREDENTIALS",
                    {"field": "credentials"}
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
            # Log unexpected errors (in production, use proper logging)
            return {
                'success': False,
                'error': {
                    'message': 'An unexpected error occurred. Please try again.',
                    'code': 'INTERNAL_ERROR',
                    'details': {},
                    'timestamp': datetime.now(timezone.utc).isoformat()
                }
            }
    
    def validate_token(self, token: str) -> Dict[str, Any]:
        """Validate session token and return user info if valid."""
        if not token:
            return {
                'valid': False,
                'error': 'Token is required'
            }
        
        session = self.session_manager.validate_session(token)
        if not session:
            return {
                'valid': False,
                'error': 'Invalid or expired token'
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
                'error': 'Token is required'
            }
        
        self.session_manager.invalidate_session(token)
        return {
            'success': True,
            'message': 'Sign-out successful'
        }
    
    def extend_session(self, token: str) -> Dict[str, Any]:
        """Extend user session."""
        if not token:
            return {
                'success': False,
                'error': 'Token is required'
            }
        
        if self.session_manager.extend_session(token):
            return {
                'success': True,
                'message': 'Session extended successfully'
            }
        else:
            return {
                'success': False,
                'error': 'Invalid or expired token'
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