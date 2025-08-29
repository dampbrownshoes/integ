#!/usr/bin/env python3
"""
Improved Sign-In Web Interface
Flask-based web interface with enhanced error handling and user experience.
"""

from flask import Flask, request, jsonify, render_template_string, session, redirect, url_for, flash
import os
import sys
from datetime import datetime

# Import our improved auth system
from auth_system import ImprovedSignInManager

app = Flask(__name__)
app.secret_key = 'improved-flask-secret-key-change-in-production'

# Initialize the improved sign-in manager
auth_manager = ImprovedSignInManager("improved-signin-secret-2025")

# Enhanced HTML templates with better UX
SIGNIN_TEMPLATE = """
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sign In - Improved Authentication</title>
    <style>
        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        
        .container {
            background: white;
            border-radius: 12px;
            box-shadow: 0 8px 32px rgba(0,0,0,0.1);
            padding: 40px;
            width: 100%;
            max-width: 420px;
        }
        
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        
        .header h1 {
            color: #333;
            font-size: 28px;
            font-weight: 600;
            margin-bottom: 8px;
        }
        
        .header p {
            color: #666;
            font-size: 14px;
        }
        
        .demo-info {
            background: #e3f2fd;
            border: 1px solid #bbdefb;
            border-radius: 8px;
            padding: 16px;
            margin-bottom: 24px;
            font-size: 14px;
        }
        
        .demo-info h3 {
            color: #1565c0;
            margin-bottom: 8px;
            font-size: 16px;
        }
        
        .demo-creds {
            display: grid;
            gap: 8px;
        }
        
        .demo-cred {
            display: flex;
            justify-content: space-between;
            align-items: center;
            background: white;
            padding: 8px 12px;
            border-radius: 4px;
            border: 1px solid #e1f5fe;
        }
        
        .demo-cred .label {
            font-weight: 500;
            color: #1565c0;
        }
        
        .demo-cred .value {
            font-family: monospace;
            color: #333;
            font-size: 13px;
        }
        
        .alert {
            padding: 16px;
            border-radius: 8px;
            margin-bottom: 20px;
            font-size: 14px;
            line-height: 1.4;
        }
        
        .alert.error {
            background: #ffebee;
            border: 1px solid #ffcdd2;
            color: #c62828;
        }
        
        .alert.success {
            background: #e8f5e8;
            border: 1px solid #c8e6c8;
            color: #2e7d32;
        }
        
        .alert.warning {
            background: #fff8e1;
            border: 1px solid #ffecb3;
            color: #f57c00;
        }
        
        .alert-title {
            font-weight: 600;
            margin-bottom: 4px;
        }
        
        .alert-guidance {
            font-size: 13px;
            margin-top: 8px;
            opacity: 0.9;
        }
        
        .form-group {
            margin-bottom: 20px;
        }
        
        .form-group label {
            display: block;
            margin-bottom: 8px;
            color: #333;
            font-weight: 500;
            font-size: 14px;
        }
        
        .form-group input {
            width: 100%;
            padding: 14px 16px;
            border: 2px solid #e0e0e0;
            border-radius: 8px;
            font-size: 16px;
            transition: all 0.2s ease;
            background: #fafafa;
        }
        
        .form-group input:focus {
            outline: none;
            border-color: #667eea;
            background: white;
            box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }
        
        .form-group input.error {
            border-color: #f44336;
            background: #ffebee;
        }
        
        .password-req {
            font-size: 12px;
            color: #666;
            margin-top: 4px;
            line-height: 1.3;
        }
        
        .btn {
            width: 100%;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            padding: 16px;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s ease;
            position: relative;
            overflow: hidden;
        }
        
        .btn:hover:not(:disabled) {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
        }
        
        .btn:active {
            transform: translateY(0);
        }
        
        .btn:disabled {
            opacity: 0.7;
            cursor: not-allowed;
            transform: none;
        }
        
        .btn.loading::after {
            content: '';
            position: absolute;
            top: 50%;
            left: 50%;
            width: 20px;
            height: 20px;
            margin-left: -10px;
            margin-top: -10px;
            border: 2px solid transparent;
            border-top: 2px solid white;
            border-radius: 50%;
            animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        
        .footer {
            text-align: center;
            margin-top: 24px;
            padding-top: 24px;
            border-top: 1px solid #eee;
            color: #666;
            font-size: 12px;
        }
        
        .rate-limit-info {
            background: #fff3e0;
            border: 1px solid #ffcc02;
            border-radius: 8px;
            padding: 12px;
            margin-bottom: 16px;
            font-size: 13px;
        }
        
        .rate-limit-timer {
            font-weight: 600;
            color: #f57c00;
        }
        
        @media (max-width: 480px) {
            .container {
                padding: 30px 20px;
                margin: 10px;
            }
            
            .header h1 {
                font-size: 24px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Welcome Back</h1>
            <p>Sign in to your account</p>
        </div>
        
        <div class="demo-info">
            <h3>Demo Accounts</h3>
            <div class="demo-creds">
                <div class="demo-cred">
                    <span class="label">User:</span>
                    <span class="value">test@demo.com / Test123!</span>
                </div>
                <div class="demo-cred">
                    <span class="label">Admin:</span>
                    <span class="value">admin@example.com / admin123</span>
                </div>
                <div class="demo-cred">
                    <span class="label">Basic:</span>
                    <span class="value">user@example.com / password123</span>
                </div>
            </div>
        </div>
        
        {% if error %}
        <div class="alert error">
            <div class="alert-title">{{ error.message }}</div>
            {% if error.user_guidance %}
            <div class="alert-guidance">{{ error.user_guidance }}</div>
            {% endif %}
            {% if error.code and error.code.startswith('RATE_LIMITED') %}
            <div class="rate-limit-info">
                {% if error.details.remaining_minutes %}
                <div class="rate-limit-timer">
                    Please wait {{ error.details.remaining_minutes }} minutes before trying again
                </div>
                {% endif %}
            </div>
            {% endif %}
        </div>
        {% endif %}
        
        {% if success %}
        <div class="alert success">
            <div class="alert-title">{{ success }}</div>
        </div>
        {% endif %}
        
        <form method="POST" action="/signin" id="signinForm">
            <div class="form-group">
                <label for="email">Email Address</label>
                <input type="email" 
                       id="email" 
                       name="email" 
                       value="{{ email or '' }}" 
                       required 
                       autocomplete="email"
                       {% if error and error.details.field == 'email' %}class="error"{% endif %}>
            </div>
            
            <div class="form-group">
                <label for="password">Password</label>
                <input type="password" 
                       id="password" 
                       name="password" 
                       required 
                       autocomplete="current-password"
                       {% if error and error.details.field == 'password' %}class="error"{% endif %}>
                {% if password_requirements %}
                <div class="password-req">
                    {{ password_requirements.description }}
                </div>
                {% endif %}
            </div>
            
            <button type="submit" class="btn" id="submitBtn">Sign In</button>
        </form>
        
        <div class="footer">
            <p>Improved Sign-In Flow v2.0 - Enhanced Security & User Experience</p>
        </div>
    </div>
    
    <script>
        document.getElementById('signinForm').addEventListener('submit', function(e) {
            const submitBtn = document.getElementById('submitBtn');
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            
            // Basic client-side validation
            if (!email || !password) {
                e.preventDefault();
                alert('Please fill in both email and password');
                return;
            }
            
            // Show loading state
            submitBtn.disabled = true;
            submitBtn.classList.add('loading');
            submitBtn.textContent = 'Signing In...';
            
            // Re-enable after timeout to prevent permanent lockup
            setTimeout(() => {
                submitBtn.disabled = false;
                submitBtn.classList.remove('loading');
                submitBtn.textContent = 'Sign In';
            }, 15000);
        });
        
        // Auto-focus first empty field
        window.addEventListener('load', function() {
            const email = document.getElementById('email');
            const password = document.getElementById('password');
            
            if (!email.value) {
                email.focus();
            } else if (!password.value) {
                password.focus();
            }
        });
    </script>
</body>
</html>
"""

DASHBOARD_TEMPLATE = """
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dashboard - Secure Access</title>
    <style>
        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
            background: #f8f9fa;
            min-height: 100vh;
        }
        
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px 0;
            margin-bottom: 30px;
        }
        
        .header-content {
            max-width: 800px;
            margin: 0 auto;
            padding: 0 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .header h1 {
            font-size: 24px;
            font-weight: 600;
        }
        
        .user-info {
            text-align: right;
            font-size: 14px;
            opacity: 0.9;
        }
        
        .container {
            max-width: 800px;
            margin: 0 auto;
            padding: 0 20px;
        }
        
        .card {
            background: white;
            border-radius: 12px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            padding: 30px;
            margin-bottom: 20px;
        }
        
        .card h2 {
            color: #333;
            margin-bottom: 20px;
            font-size: 20px;
        }
        
        .welcome-message {
            background: linear-gradient(135deg, #e8f5e8 0%, #d4edda 100%);
            border: 1px solid #c3e6cb;
            color: #155724;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 20px;
            text-align: center;
        }
        
        .info-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-bottom: 20px;
        }
        
        .info-item {
            background: #f8f9fa;
            padding: 16px;
            border-radius: 8px;
            border-left: 4px solid #667eea;
        }
        
        .info-label {
            font-size: 12px;
            color: #666;
            text-transform: uppercase;
            font-weight: 600;
            margin-bottom: 4px;
        }
        
        .info-value {
            font-size: 14px;
            color: #333;
            font-family: monospace;
        }
        
        .actions {
            display: flex;
            gap: 12px;
            flex-wrap: wrap;
            justify-content: center;
            margin-top: 30px;
        }
        
        .btn {
            padding: 12px 24px;
            border: none;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            text-decoration: none;
            display: inline-block;
            transition: all 0.2s ease;
        }
        
        .btn-primary {
            background: #667eea;
            color: white;
        }
        
        .btn-secondary {
            background: #6c757d;
            color: white;
        }
        
        .btn-danger {
            background: #dc3545;
            color: white;
        }
        
        .btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }
        
        .session-details {
            background: #f1f3f4;
            border-radius: 8px;
            padding: 20px;
            margin-top: 20px;
        }
        
        .session-details h3 {
            margin-bottom: 16px;
            color: #333;
            font-size: 16px;
        }
        
        .session-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 12px;
        }
        
        @media (max-width: 480px) {
            .header-content {
                flex-direction: column;
                gap: 10px;
                text-align: center;
            }
            
            .actions {
                flex-direction: column;
            }
            
            .btn {
                text-align: center;
            }
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="header-content">
            <h1>Dashboard</h1>
            <div class="user-info">
                <div>{{ user.name }}</div>
                <div>{{ user.email }}</div>
            </div>
        </div>
    </div>
    
    <div class="container">
        <div class="welcome-message">
            <h2>🎉 Welcome back, {{ user.name }}!</h2>
            <p>Your sign-in was successful. The authentication system is working correctly.</p>
        </div>
        
        <div class="card">
            <h2>Account Information</h2>
            <div class="info-grid">
                <div class="info-item">
                    <div class="info-label">User ID</div>
                    <div class="info-value">{{ user.id }}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Email Address</div>
                    <div class="info-value">{{ user.email }}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Account Name</div>
                    <div class="info-value">{{ user.name }}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Sign-In Time</div>
                    <div class="info-value">{{ signin_time }}</div>
                </div>
            </div>
        </div>
        
        <div class="card">
            <h2>Session Information</h2>
            <div class="session-details">
                <h3>Current Session</h3>
                <div class="session-grid">
                    <div class="info-item">
                        <div class="info-label">Session ID</div>
                        <div class="info-value">{{ session.session_id }}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Token (First 20 chars)</div>
                        <div class="info-value">{{ token[:20] }}...</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Expires At</div>
                        <div class="info-value">{{ session.expires_at }}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Last Accessed</div>
                        <div class="info-value">{{ session.last_accessed }}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Access Count</div>
                        <div class="info-value">{{ session.access_count }}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Session Duration</div>
                        <div class="info-value">{{ session_duration }}</div>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="actions">
            <a href="/extend-session" class="btn btn-primary">Extend Session</a>
            <a href="/signout" class="btn btn-secondary">Sign Out</a>
            <a href="/signout?all=true" class="btn btn-danger">Sign Out All Devices</a>
        </div>
    </div>
    
    <script>
        // Show session expiry countdown
        const expiresAt = new Date('{{ session.expires_at }}');
        
        function updateCountdown() {
            const now = new Date();
            const remaining = expiresAt - now;
            
            if (remaining <= 0) {
                document.body.innerHTML = '<div style="text-align:center; margin-top:100px; color:#666;">Session expired. Please <a href="/signin">sign in again</a>.</div>';
                return;
            }
            
            const hours = Math.floor(remaining / (1000 * 60 * 60));
            const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
            
            document.title = `Dashboard (${hours}h ${minutes}m remaining)`;
        }
        
        // Update countdown every minute
        setInterval(updateCountdown, 60000);
        updateCountdown();
    </script>
</body>
</html>
"""

@app.route('/')
def home():
    """Home page - redirect appropriately based on authentication status."""
    token = session.get('token')
    if token:
        validation = auth_manager.validate_token(token)
        if validation['valid']:
            return redirect(url_for('dashboard'))
        else:
            # Invalid token, clear session
            session.clear()
    
    return redirect(url_for('signin'))

@app.route('/signin', methods=['GET', 'POST'])
def signin():
    """Enhanced sign-in page with better error handling."""
    if request.method == 'GET':
        # Check if already authenticated
        token = session.get('token')
        if token:
            validation = auth_manager.validate_token(token)
            if validation['valid']:
                return redirect(url_for('dashboard'))
        
        return render_template_string(SIGNIN_TEMPLATE)
    
    # POST - handle sign-in attempt
    email = request.form.get('email', '').strip()
    password = request.form.get('password', '')
    user_agent = request.headers.get('User-Agent', '')
    
    result = auth_manager.sign_in(email, password, user_agent)
    
    if result['success']:
        # Store session information
        session['token'] = result['token']
        session['user'] = result['user']
        session['signin_time'] = datetime.now().isoformat()
        
        flash(result['message'], 'success')
        return redirect(url_for('dashboard'))
    else:
        # Render error with user guidance
        return render_template_string(
            SIGNIN_TEMPLATE,
            error=result['error'],
            email=email,
            password_requirements=result.get('password_requirements')
        )

@app.route('/dashboard')
def dashboard():
    """Enhanced dashboard with session information."""
    token = session.get('token')
    if not token:
        return redirect(url_for('signin'))
    
    # Validate token and get detailed session info
    validation = auth_manager.validate_token(token)
    if not validation['valid']:
        session.clear()
        flash('Session expired. Please sign in again.', 'warning')
        return redirect(url_for('signin'))
    
    # Calculate session duration
    signin_time = session.get('signin_time', datetime.now().isoformat())
    signin_dt = datetime.fromisoformat(signin_time)
    duration = datetime.now() - signin_dt
    hours, remainder = divmod(int(duration.total_seconds()), 3600)
    minutes, _ = divmod(remainder, 60)
    session_duration = f"{hours}h {minutes}m"
    
    return render_template_string(
        DASHBOARD_TEMPLATE,
        user=session['user'],
        token=token,
        session=validation['session'],
        signin_time=signin_time,
        session_duration=session_duration
    )

@app.route('/extend-session')
def extend_session():
    """Extend current session."""
    token = session.get('token')
    if not token:
        return redirect(url_for('signin'))
    
    result = auth_manager.extend_session(token)
    if result['success']:
        flash('Session extended successfully!', 'success')
    else:
        flash('Failed to extend session. Please sign in again.', 'error')
        return redirect(url_for('signin'))
    
    return redirect(url_for('dashboard'))

@app.route('/signout')
def signout():
    """Enhanced sign out with multi-device option."""
    token = session.get('token')
    all_devices = request.args.get('all') == 'true'
    
    if token:
        result = auth_manager.sign_out(token, all_devices)
        if result['success']:
            flash(result['message'], 'success')
        else:
            flash('Sign out failed', 'error')
    
    session.clear()
    return render_template_string(
        SIGNIN_TEMPLATE,
        success="You have been signed out successfully."
    )

# API Endpoints
@app.route('/api/signin', methods=['POST'])
def api_signin():
    """Enhanced JSON API for sign-in."""
    data = request.get_json()
    if not data:
        return jsonify({
            'success': False,
            'error': {
                'message': 'JSON data required',
                'code': 'INVALID_REQUEST',
                'user_guidance': 'Please send a valid JSON request with email and password'
            }
        }), 400
    
    email = data.get('email', '').strip()
    password = data.get('password', '')
    user_agent = request.headers.get('User-Agent', '')
    
    result = auth_manager.sign_in(email, password, user_agent)
    
    status_code = 200 if result['success'] else 401
    return jsonify(result), status_code

@app.route('/api/validate', methods=['POST'])
def api_validate():
    """Enhanced token validation API."""
    data = request.get_json()
    if not data or 'token' not in data:
        return jsonify({
            'valid': False,
            'error': 'Authentication token required',
            'code': 'MISSING_TOKEN'
        }), 400
    
    result = auth_manager.validate_token(data['token'])
    status_code = 200 if result['valid'] else 401
    return jsonify(result), status_code

@app.route('/api/extend-session', methods=['POST'])
def api_extend_session():
    """API endpoint to extend session."""
    data = request.get_json()
    if not data or 'token' not in data:
        return jsonify({
            'success': False,
            'error': 'Authentication token required'
        }), 400
    
    hours = data.get('hours')  # Optional custom extension
    result = auth_manager.extend_session(data['token'], hours)
    status_code = 200 if result['success'] else 401
    return jsonify(result), status_code

@app.route('/api/signout', methods=['POST'])
def api_signout():
    """Enhanced sign-out API with multi-device support."""
    data = request.get_json()
    if not data or 'token' not in data:
        return jsonify({
            'success': False,
            'error': 'Authentication token required'
        }), 400
    
    all_devices = data.get('all_devices', False)
    result = auth_manager.sign_out(data['token'], all_devices)
    return jsonify(result), 200

@app.route('/health')
def health_check():
    """Comprehensive health check endpoint."""
    health_status = auth_manager.get_health_status()
    return jsonify(health_status), 200

@app.route('/api/password-requirements')
def api_password_requirements():
    """API endpoint to get password requirements."""
    requirements = auth_manager.get_password_requirements()
    return jsonify(requirements), 200

if __name__ == '__main__':
    print("=== Improved Sign-In Web Interface ===")
    print("🚀 Starting enhanced authentication server...")
    print("\n📍 Server URL: http://localhost:5000")
    
    print("\n🔐 Demo Accounts Available:")
    print("┌─────────────────────────────────────────┐")
    print("│ test@demo.com          │ Test123!       │")
    print("│ admin@example.com      │ admin123       │") 
    print("│ user@example.com       │ password123    │")
    print("└─────────────────────────────────────────┘")
    
    print("\n🌐 Available Endpoints:")
    endpoints = [
        ("GET  /", "Home page (redirects to appropriate location)"),
        ("GET/POST /signin", "Enhanced sign-in form with error handling"),
        ("GET  /dashboard", "User dashboard with session info"),
        ("GET  /extend-session", "Extend current session"),
        ("GET  /signout", "Sign out (add ?all=true for all devices)"),
        ("POST /api/signin", "JSON sign-in API"),
        ("POST /api/validate", "Token validation API"),
        ("POST /api/extend-session", "Session extension API"),
        ("POST /api/signout", "JSON sign-out API"),
        ("GET  /health", "System health check"),
        ("GET  /api/password-requirements", "Get password requirements")
    ]
    
    for method_path, description in endpoints:
        print(f"│ {method_path:<20} │ {description}")
    
    print("\n✨ Improvements in v2.0:")
    improvements = [
        "🛡️  Enhanced rate limiting with progressive delays",
        "💬  Better error messages with user guidance",
        "🔄  Session extension and multi-device sign-out",
        "📊  Comprehensive health monitoring",
        "🎨  Improved UI with better user experience",
        "🔍  Detailed session information and tracking",
        "⚡  Better email validation and password feedback",
        "🚨  Enhanced security with proper token management"
    ]
    
    for improvement in improvements:
        print(f"  {improvement}")
    
    print("\n" + "="*60)
    print("🔥 Ready to handle sign-in requests with improved reliability!")
    
    app.run(host='0.0.0.0', port=5000, debug=True)