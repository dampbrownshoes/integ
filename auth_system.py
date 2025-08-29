#!/usr/bin/env python3
"""
Improved Sign-In Flow Implementation
Addresses user-reported sign-in errors with enhanced error handling and user experience.
"""

import hashlib
import hmac
import json
import re
import time
import uuid
from datetime import datetime, timedelta, timezone
from typing import Dict, Any, Optional, List, Tuple
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


class AuthError(Exception):
    """Custom exception for authentication related errors."""
    
    def __init__(self, message: str, error_code: str = "AUTH_ERROR", details: Dict = None, user_guidance: str = None):
        super().__init__(message)
        self.error_code = error_code
        self.details = details or {}
        self.user_guidance = user_guidance or ""
        self.timestamp = datetime.now(timezone.utc)


class ImprovedRateLimiter:
    """Enhanced rate limiter with progressive delays and recovery mechanisms."""
    
    def __init__(self, base_attempts: int = 3, max_attempts: int = 10, window_minutes: int = 30):
        self.base_attempts = base_attempts  # Initial attempts before rate limiting
        self.max_attempts = max_attempts    # Maximum attempts before long lockout
        self.window_seconds = window_minutes * 60
        self.attempts = {}  # email -> [(timestamp, success, attempt_count), ...]
        self.lockouts = {}  # email -> lockout_until_timestamp
    
    def _clean_old_attempts(self, email: str):
        """Clean attempts older than the window."""
        current_time = time.time()
        cutoff_time = current_time - self.window_seconds
        
        if email in self.attempts:
            self.attempts[email] = [
                (timestamp, success, count) for timestamp, success, count in self.attempts[email]
                if timestamp > cutoff_time
            ]
    
    def check_rate_limit(self, email: str) -> Dict[str, Any]:
        """Check if user is rate limited and return detailed status."""
        current_time = time.time()
        
        # Check for active lockout
        if email in self.lockouts and current_time < self.lockouts[email]:
            remaining_lockout = int(self.lockouts[email] - current_time)
            return {
                'is_limited': True,
                'reason': 'lockout',
                'remaining_seconds': remaining_lockout,
                'remaining_minutes': remaining_lockout // 60 + 1,
                'can_try_at': datetime.fromtimestamp(self.lockouts[email], timezone.utc).isoformat(),
                'message': f"Account temporarily locked. Please try again in {remaining_lockout // 60 + 1} minutes."
            }
        
        # Clean old attempts and check current state
        self._clean_old_attempts(email)
        
        failed_attempts = 0
        if email in self.attempts:
            failed_attempts = sum(1 for _, success, _ in self.attempts[email] if not success)
        
        # Progressive rate limiting
        if failed_attempts >= self.base_attempts:
            delay_seconds = min(60 * (2 ** (failed_attempts - self.base_attempts)), 900)  # Max 15 min
            
            if failed_attempts >= self.max_attempts:
                # Long lockout for persistent attempts
                lockout_until = current_time + (3600)  # 1 hour lockout
                self.lockouts[email] = lockout_until
                return {
                    'is_limited': True,
                    'reason': 'max_attempts',
                    'remaining_seconds': 3600,
                    'remaining_minutes': 60,
                    'can_try_at': datetime.fromtimestamp(lockout_until, timezone.utc).isoformat(),
                    'message': "Too many failed attempts. Account locked for 1 hour for security."
                }
            
            return {
                'is_limited': True,
                'reason': 'rate_limited',
                'remaining_seconds': delay_seconds,
                'remaining_minutes': delay_seconds // 60 + 1,
                'failed_attempts': failed_attempts,
                'message': f"Too many failed attempts. Please wait {delay_seconds // 60 + 1} minutes before trying again."
            }
        
        return {
            'is_limited': False,
            'failed_attempts': failed_attempts,
            'remaining_attempts': self.base_attempts - failed_attempts
        }
    
    def record_attempt(self, email: str, success: bool):
        """Record a sign-in attempt with progressive counting."""
        current_time = time.time()
        
        if email not in self.attempts:
            self.attempts[email] = []
        
        # Get current attempt count
        attempt_count = len(self.attempts[email]) + 1
        self.attempts[email].append((current_time, success, attempt_count))
        
        # If successful, clear lockouts and reduce penalty
        if success:
            if email in self.lockouts:
                del self.lockouts[email]
            # Keep only the last successful attempt to reset the counter
            self.attempts[email] = [(current_time, True, 1)]
        
        logger.info(f"Recorded {'successful' if success else 'failed'} attempt for {email[:3]}***")


class EnhancedSessionManager:
    """Enhanced session management with better security and monitoring."""
    
    def __init__(self, secret_key: str, session_timeout_hours: int = 8):
        self.secret_key = secret_key
        self.session_timeout = timedelta(hours=session_timeout_hours)
        self.sessions = {}  # token -> session_data
        self.user_sessions = {}  # user_id -> [tokens] for multi-device support
        self.last_cleanup = time.time()
    
    def _cleanup_expired_sessions(self):
        """Remove expired sessions periodically."""
        current_time = time.time()
        
        # Only cleanup every 5 minutes
        if current_time - self.last_cleanup < 300:
            return
        
        self.last_cleanup = current_time
        current_dt = datetime.now(timezone.utc)
        
        expired_tokens = []
        for token, session in self.sessions.items():
            if current_dt > session['expires_at']:
                expired_tokens.append(token)
        
        for token in expired_tokens:
            self._remove_session(token)
        
        logger.info(f"Cleaned up {len(expired_tokens)} expired sessions")
    
    def _remove_session(self, token: str):
        """Remove a session and update user session tracking."""
        if token in self.sessions:
            session = self.sessions[token]
            user_id = session['user_id']
            
            del self.sessions[token]
            
            if user_id in self.user_sessions:
                self.user_sessions[user_id] = [
                    t for t in self.user_sessions[user_id] if t != token
                ]
                if not self.user_sessions[user_id]:
                    del self.user_sessions[user_id]
    
    def create_session(self, user_id: str, email: str, user_agent: str = None) -> Dict[str, Any]:
        """Create a new session with enhanced tracking."""
        self._cleanup_expired_sessions()
        
        # Generate secure token
        session_id = str(uuid.uuid4())
        token_data = f"{user_id}:{email}:{session_id}:{time.time()}"
        token = hmac.new(
            self.secret_key.encode(),
            token_data.encode(),
            hashlib.sha256
        ).hexdigest()
        
        expires_at = datetime.now(timezone.utc) + self.session_timeout
        
        session_data = {
            'session_id': session_id,
            'user_id': user_id,
            'email': email,
            'created_at': datetime.now(timezone.utc),
            'expires_at': expires_at,
            'last_accessed': datetime.now(timezone.utc),
            'user_agent': user_agent,
            'access_count': 1
        }
        
        self.sessions[token] = session_data
        
        # Track user sessions for multi-device management
        if user_id not in self.user_sessions:
            self.user_sessions[user_id] = []
        self.user_sessions[user_id].append(token)
        
        logger.info(f"Created session for user {user_id}")
        
        return {
            'token': token,
            'expires_at': expires_at.isoformat(),
            'session_id': session_id
        }
    
    def validate_session(self, token: str) -> Optional[Dict[str, Any]]:
        """Validate and refresh session."""
        self._cleanup_expired_sessions()
        
        if not token or token not in self.sessions:
            return None
        
        session = self.sessions[token]
        current_time = datetime.now(timezone.utc)
        
        if current_time > session['expires_at']:
            self._remove_session(token)
            return None
        
        # Update last accessed time and count
        session['last_accessed'] = current_time
        session['access_count'] += 1
        
        return session
    
    def extend_session(self, token: str, hours: int = None) -> bool:
        """Extend session expiration time."""
        session = self.validate_session(token)
        if not session:
            return False
        
        extension_hours = hours or self.session_timeout.total_seconds() / 3600
        session['expires_at'] = datetime.now(timezone.utc) + timedelta(hours=extension_hours)
        return True
    
    def invalidate_session(self, token: str) -> bool:
        """Invalidate a specific session."""
        if token in self.sessions:
            self._remove_session(token)
            return True
        return False
    
    def invalidate_all_user_sessions(self, user_id: str) -> int:
        """Invalidate all sessions for a user."""
        if user_id not in self.user_sessions:
            return 0
        
        tokens_to_remove = list(self.user_sessions[user_id])
        for token in tokens_to_remove:
            self._remove_session(token)
        
        logger.info(f"Invalidated {len(tokens_to_remove)} sessions for user {user_id}")
        return len(tokens_to_remove)
    
    def get_session_stats(self) -> Dict[str, Any]:
        """Get session statistics for monitoring."""
        current_time = datetime.now(timezone.utc)
        active_sessions = 0
        expiring_soon = 0
        
        for session in self.sessions.values():
            if current_time < session['expires_at']:
                active_sessions += 1
                if (session['expires_at'] - current_time).total_seconds() < 3600:
                    expiring_soon += 1
        
        return {
            'total_sessions': len(self.sessions),
            'active_sessions': active_sessions,
            'expiring_soon': expiring_soon,
            'unique_users': len(self.user_sessions)
        }


class SecureUserStore:
    """Enhanced user store with better password handling."""
    
    def __init__(self):
        # Demo users with improved password storage
        self.users = {
            'user@example.com': {
                'id': 'user_001',
                'email': 'user@example.com',
                'password_hash': self._hash_password('password123'),
                'name': 'Demo User',
                'active': True,
                'created_at': datetime.now(timezone.utc),
                'last_login': None,
                'login_count': 0,
                'failed_attempts': 0
            },
            'admin@example.com': {
                'id': 'admin_001',
                'email': 'admin@example.com',
                'password_hash': self._hash_password('admin123'),
                'name': 'Admin User',
                'active': True,
                'created_at': datetime.now(timezone.utc),
                'last_login': None,
                'login_count': 0,
                'failed_attempts': 0
            },
            'test@demo.com': {
                'id': 'test_001',
                'email': 'test@demo.com',
                'password_hash': self._hash_password('Test123!'),
                'name': 'Test User',
                'active': True,
                'created_at': datetime.now(timezone.utc),
                'last_login': None,
                'login_count': 0,
                'failed_attempts': 0
            }
        }
    
    def _hash_password(self, password: str, salt: str = None) -> str:
        """Hash password with salt using PBKDF2."""
        if not salt:
            salt = "integ_secure_salt_2025"  # In production, use random salt per user
        return hashlib.pbkdf2_hmac('sha256', password.encode(), salt.encode(), 100000).hex()
    
    def get_user(self, email: str) -> Optional[Dict[str, Any]]:
        """Get user by email (case-insensitive)."""
        return self.users.get(email.lower().strip())
    
    def verify_password(self, email: str, password: str) -> bool:
        """Verify user password with timing attack protection."""
        user = self.get_user(email)
        if not user:
            # Perform dummy hash to prevent timing attacks
            self._hash_password("dummy_password")
            return False
        
        expected_hash = user['password_hash']
        provided_hash = self._hash_password(password)
        
        # Use constant-time comparison
        return hmac.compare_digest(expected_hash, provided_hash)
    
    def update_login_stats(self, email: str, success: bool):
        """Update user login statistics."""
        user = self.get_user(email)
        if not user:
            return
        
        if success:
            user['last_login'] = datetime.now(timezone.utc)
            user['login_count'] += 1
            user['failed_attempts'] = 0  # Reset failed attempts on success
        else:
            user['failed_attempts'] += 1


class ImprovedSignInManager:
    """Enhanced sign-in manager with better error handling and user experience."""
    
    def __init__(self, secret_key: str = "secure-default-key"):
        self.secret_key = secret_key
        self.rate_limiter = ImprovedRateLimiter()
        self.session_manager = EnhancedSessionManager(secret_key)
        self.user_store = SecureUserStore()
    
    def validate_email(self, email: str) -> Dict[str, Any]:
        """Enhanced email validation with detailed feedback."""
        if not email:
            return {'valid': False, 'error': 'Email address is required'}
        
        email = email.strip()
        
        if len(email) > 254:
            return {'valid': False, 'error': 'Email address is too long (maximum 254 characters)'}
        
        # Check for consecutive dots
        if '..' in email:
            return {'valid': False, 'error': 'Email address cannot contain consecutive dots'}
        
        # More permissive email regex that handles edge cases better
        pattern = r'^[a-zA-Z0-9!#$%&\'*+/=?^_`{|}~-]+(?:\.[a-zA-Z0-9!#$%&\'*+/=?^_`{|}~-]+)*@(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?\.)+[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?$'
        
        if not re.match(pattern, email):
            return {
                'valid': False, 
                'error': 'Please enter a valid email address (e.g., user@example.com)'
            }
        
        return {'valid': True, 'normalized': email.lower()}
    
    def get_password_requirements(self) -> Dict[str, Any]:
        """Get password requirements for display to users."""
        return {
            'min_length': 8,
            'max_length': 128,
            'requires_uppercase': True,
            'requires_lowercase': True,
            'requires_digit': True,
            'description': 'Password must be 8-128 characters with uppercase, lowercase, and number'
        }
    
    def validate_password(self, password: str) -> Dict[str, Any]:
        """Enhanced password validation with specific guidance."""
        if not password:
            return {
                'valid': False,
                'errors': ['Password is required'],
                'requirements': self.get_password_requirements()
            }
        
        errors = []
        requirements = self.get_password_requirements()
        
        if len(password) < requirements['min_length']:
            errors.append(f"Password must be at least {requirements['min_length']} characters long")
        
        if len(password) > requirements['max_length']:
            errors.append(f"Password must not exceed {requirements['max_length']} characters")
        
        if requirements['requires_uppercase'] and not re.search(r'[A-Z]', password):
            errors.append("Password must contain at least one uppercase letter (A-Z)")
        
        if requirements['requires_lowercase'] and not re.search(r'[a-z]', password):
            errors.append("Password must contain at least one lowercase letter (a-z)")
        
        if requirements['requires_digit'] and not re.search(r'\d', password):
            errors.append("Password must contain at least one number (0-9)")
        
        return {
            'valid': len(errors) == 0,
            'errors': errors,
            'requirements': requirements
        }
    
    def sign_in(self, email: str, password: str, user_agent: str = None) -> Dict[str, Any]:
        """Enhanced sign-in with comprehensive error handling and user guidance."""
        try:
            # Input validation
            if not email:
                raise AuthError(
                    "Email address is required",
                    "MISSING_EMAIL",
                    {"field": "email"},
                    "Please enter your email address"
                )
            
            if not password:
                raise AuthError(
                    "Password is required",
                    "MISSING_PASSWORD",
                    {"field": "password"},
                    "Please enter your password"
                )
            
            # Validate and normalize email
            email_validation = self.validate_email(email)
            if not email_validation['valid']:
                raise AuthError(
                    email_validation['error'],
                    "INVALID_EMAIL_FORMAT",
                    {"field": "email", "provided_email": email},
                    "Please check your email address and try again"
                )
            
            normalized_email = email_validation['normalized']
            
            # Check rate limiting with detailed feedback
            rate_status = self.rate_limiter.check_rate_limit(normalized_email)
            if rate_status['is_limited']:
                raise AuthError(
                    rate_status['message'],
                    f"RATE_LIMITED_{rate_status['reason'].upper()}",
                    {
                        "remaining_seconds": rate_status['remaining_seconds'],
                        "remaining_minutes": rate_status['remaining_minutes'],
                        "can_try_at": rate_status.get('can_try_at', ''),
                        "email": normalized_email
                    },
                    f"Please wait {rate_status['remaining_minutes']} minutes, then try again. If you've forgotten your password, use the password reset option."
                )
            
            # Get user and validate existence
            user = self.user_store.get_user(normalized_email)
            if not user:
                # Record failed attempt for rate limiting
                self.rate_limiter.record_attempt(normalized_email, False)
                raise AuthError(
                    "Invalid email or password",
                    "INVALID_CREDENTIALS",
                    {"field": "credentials"},
                    "Please check your email and password. If you don't have an account, you may need to sign up first."
                )
            
            # Check if account is active
            if not user.get('active', True):
                raise AuthError(
                    "Your account has been deactivated",
                    "ACCOUNT_DEACTIVATED",
                    {"email": normalized_email},
                    "Please contact support to reactivate your account"
                )
            
            # Verify password
            if not self.user_store.verify_password(normalized_email, password):
                # Record failed attempt
                self.rate_limiter.record_attempt(normalized_email, False)
                self.user_store.update_login_stats(normalized_email, False)
                
                # Get remaining attempts for user guidance
                updated_rate_status = self.rate_limiter.check_rate_limit(normalized_email)
                remaining = updated_rate_status.get('remaining_attempts', 0)
                
                guidance = "Please check your password and try again."
                if remaining > 0:
                    guidance += f" You have {remaining} attempts remaining."
                else:
                    guidance += " Too many failed attempts - you'll need to wait before trying again."
                
                raise AuthError(
                    "Invalid email or password",
                    "INVALID_CREDENTIALS",
                    {
                        "field": "credentials",
                        "remaining_attempts": remaining,
                        "failed_attempts": updated_rate_status.get('failed_attempts', 0)
                    },
                    guidance
                )
            
            # Success - create session
            session_result = self.session_manager.create_session(
                user['id'], 
                user['email'], 
                user_agent
            )
            
            # Record successful attempt and update stats
            self.rate_limiter.record_attempt(normalized_email, True)
            self.user_store.update_login_stats(normalized_email, True)
            
            logger.info(f"Successful sign-in for user {user['id']}")
            
            return {
                'success': True,
                'token': session_result['token'],
                'session_id': session_result['session_id'],
                'expires_at': session_result['expires_at'],
                'user': {
                    'id': user['id'],
                    'email': user['email'],
                    'name': user['name']
                },
                'message': f'Welcome back, {user["name"]}!',
                'session_info': {
                    'timeout_hours': self.session_manager.session_timeout.total_seconds() / 3600,
                    'can_extend': True
                }
            }
        
        except AuthError as e:
            logger.warning(f"Authentication error: {e.error_code} - {str(e)}")
            return {
                'success': False,
                'error': {
                    'message': str(e),
                    'code': e.error_code,
                    'details': e.details,
                    'user_guidance': e.user_guidance,
                    'timestamp': e.timestamp.isoformat()
                },
                'password_requirements': self.get_password_requirements()
            }
        
        except Exception as e:
            logger.error(f"Unexpected error during sign-in: {str(e)}")
            return {
                'success': False,
                'error': {
                    'message': 'An unexpected error occurred. Please try again in a moment.',
                    'code': 'INTERNAL_ERROR',
                    'details': {},
                    'user_guidance': 'If the problem persists, please contact support.',
                    'timestamp': datetime.now(timezone.utc).isoformat()
                },
                'password_requirements': self.get_password_requirements()
            }
    
    def validate_token(self, token: str) -> Dict[str, Any]:
        """Validate session token with detailed response."""
        if not token:
            return {
                'valid': False,
                'error': 'Authentication token is required',
                'code': 'MISSING_TOKEN'
            }
        
        session = self.session_manager.validate_session(token)
        if not session:
            return {
                'valid': False,
                'error': 'Invalid or expired authentication token',
                'code': 'INVALID_TOKEN',
                'user_guidance': 'Please sign in again'
            }
        
        return {
            'valid': True,
            'user': {
                'id': session['user_id'],
                'email': session['email']
            },
            'session': {
                'expires_at': session['expires_at'].isoformat(),
                'last_accessed': session['last_accessed'].isoformat(),
                'access_count': session['access_count'],
                'session_id': session['session_id']
            }
        }
    
    def sign_out(self, token: str, all_devices: bool = False) -> Dict[str, Any]:
        """Sign out with option to sign out from all devices."""
        if not token:
            return {
                'success': False,
                'error': 'Authentication token is required'
            }
        
        # Get session info before invalidating
        session = self.session_manager.validate_session(token)
        if not session:
            return {
                'success': True,  # Already signed out
                'message': 'Already signed out'
            }
        
        if all_devices:
            # Sign out from all devices
            invalidated_count = self.session_manager.invalidate_all_user_sessions(session['user_id'])
            logger.info(f"User {session['user_id']} signed out from {invalidated_count} devices")
            return {
                'success': True,
                'message': f'Signed out from all devices ({invalidated_count} sessions)',
                'invalidated_sessions': invalidated_count
            }
        else:
            # Sign out from current device only
            self.session_manager.invalidate_session(token)
            logger.info(f"User {session['user_id']} signed out from current session")
            return {
                'success': True,
                'message': 'Successfully signed out'
            }
    
    def extend_session(self, token: str, hours: int = None) -> Dict[str, Any]:
        """Extend user session with validation."""
        if not token:
            return {
                'success': False,
                'error': 'Authentication token is required'
            }
        
        if self.session_manager.extend_session(token, hours):
            session = self.session_manager.validate_session(token)
            return {
                'success': True,
                'message': 'Session extended successfully',
                'new_expires_at': session['expires_at'].isoformat() if session else None
            }
        else:
            return {
                'success': False,
                'error': 'Invalid or expired authentication token',
                'user_guidance': 'Please sign in again'
            }
    
    def get_health_status(self) -> Dict[str, Any]:
        """Get system health status for monitoring."""
        return {
            'status': 'healthy',
            'service': 'improved-signin-flow',
            'timestamp': datetime.now(timezone.utc).isoformat(),
            'version': '2.0.0',
            'session_stats': self.session_manager.get_session_stats(),
            'rate_limiter': {
                'active_limits': len(self.rate_limiter.attempts),
                'active_lockouts': len(self.rate_limiter.lockouts)
            }
        }


# Demo and testing
if __name__ == "__main__":
    print("=== Improved Sign-In Flow Demo ===")
    
    # Create the improved sign-in manager
    auth = ImprovedSignInManager("demo-secret-key-2025")
    
    # Demo successful sign-in
    print("\n1. Testing successful sign-in:")
    result = auth.sign_in("test@demo.com", "Test123!", "Demo-Agent/1.0")
    print(json.dumps(result, indent=2, default=str))
    
    if result['success']:
        token = result['token']
        
        # Test token validation
        print("\n2. Testing token validation:")
        validation = auth.validate_token(token)
        print(json.dumps(validation, indent=2, default=str))
        
        # Test session extension
        print("\n3. Testing session extension:")
        extension = auth.extend_session(token)
        print(json.dumps(extension, indent=2, default=str))
        
        # Test sign out
        print("\n4. Testing sign-out:")
        signout = auth.sign_out(token)
        print(json.dumps(signout, indent=2))
    
    # Test error scenarios
    print("\n5. Testing error scenarios:")
    
    # Invalid email
    result = auth.sign_in("invalid-email", "Test123!")
    print("Invalid email:", result['error']['message'], "|", result['error']['user_guidance'])
    
    # Wrong password
    result = auth.sign_in("test@demo.com", "wrongpassword")
    print("Wrong password:", result['error']['message'], "|", result['error']['user_guidance'])
    
    # Rate limiting demo
    print("\n6. Testing rate limiting:")
    for i in range(4):
        result = auth.sign_in("ratelimit@test.com", "wrongpass")
        if result['success']:
            break
        print(f"Attempt {i+1}: {result['error']['code']} - {result['error']['user_guidance']}")
    
    # Health check
    print("\n7. Health check:")
    health = auth.get_health_status()
    print(json.dumps(health, indent=2, default=str))