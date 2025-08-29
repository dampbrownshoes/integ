#!/usr/bin/env python3
"""
Sign-In Web Interface
Provides a Flask-based web interface for the sign-in flow with proper error handling.
"""

from flask import Flask, request, jsonify, render_template_string, session, redirect, url_for
import os
import sys

# Add the auth directory to the path so we can import signin
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'auth'))

from signin import SignInManager

app = Flask(__name__)
app.secret_key = 'your-flask-secret-key-change-in-production'

# Initialize sign-in manager
signin_manager = SignInManager("your-signin-secret-key")

# HTML templates
LOGIN_TEMPLATE = """
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sign In - Integration Demo</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            max-width: 400px;
            margin: 100px auto;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .card {
            background: white;
            padding: 40px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        h1 {
            text-align: center;
            color: #333;
            margin-bottom: 30px;
        }
        .form-group {
            margin-bottom: 20px;
        }
        label {
            display: block;
            margin-bottom: 8px;
            color: #555;
            font-weight: 500;
        }
        input[type="email"], input[type="password"] {
            width: 100%;
            padding: 12px;
            border: 2px solid #ddd;
            border-radius: 4px;
            font-size: 16px;
            transition: border-color 0.3s;
        }
        input[type="email"]:focus, input[type="password"]:focus {
            outline: none;
            border-color: #007bff;
        }
        .btn {
            width: 100%;
            padding: 12px;
            background-color: #007bff;
            color: white;
            border: none;
            border-radius: 4px;
            font-size: 16px;
            cursor: pointer;
            transition: background-color 0.3s;
        }
        .btn:hover {
            background-color: #0056b3;
        }
        .btn:disabled {
            background-color: #ccc;
            cursor: not-allowed;
        }
        .error {
            background-color: #f8d7da;
            color: #721c24;
            padding: 12px;
            border-radius: 4px;
            margin-bottom: 20px;
            border: 1px solid #f5c6cb;
        }
        .error small {
            display: block;
            margin-top: 8px;
            opacity: 0.8;
            font-style: italic;
        }
        .success {
            background-color: #d4edda;
            color: #155724;
            padding: 12px;
            border-radius: 4px;
            margin-bottom: 20px;
            border: 1px solid #c3e6cb;
        }
        .demo-credentials {
            background-color: #fff3cd;
            border: 1px solid #ffeaa7;
            padding: 15px;
            border-radius: 4px;
            margin-bottom: 20px;
            font-size: 14px;
        }
        .demo-credentials h3 {
            margin-top: 0;
            color: #856404;
        }
        .code {
            font-family: monospace;
            background-color: #f8f9fa;
            padding: 2px 4px;
            border-radius: 3px;
        }
    </style>
</head>
<body>
    <div class="card">
        <h1>Sign In</h1>
        
        <div class="demo-credentials">
            <h3>Demo Credentials</h3>
            <p><strong>User:</strong> <span class="code">user@example.com</span> / <span class="code">password123</span> <em>(Active Trial)</em></p>
            <p><strong>Admin:</strong> <span class="code">admin@example.com</span> / <span class="code">admin123</span> <em>(Upgraded)</em></p>
            <p><strong>No Trial:</strong> <span class="code">notrial@example.com</span> / <span class="code">password123</span> <em>(No Trial Signup)</em></p>
            <p><strong>Expired:</strong> <span class="code">expired@example.com</span> / <span class="code">password123</span> <em>(Expired Trial)</em></p>
        </div>
        
        {% if error %}
        <div class="error">
            <strong>Error:</strong> {{ error.message if error.message else error }}
            {% if error.suggestion %}
            <br><small><em>{{ error.suggestion }}</em></small>
            {% endif %}
        </div>
        {% endif %}
        
        {% if success %}
        <div class="success">
            {{ success }}
        </div>
        {% endif %}
        
        <form method="POST" action="/signin">
            <div class="form-group">
                <label for="email">Email Address</label>
                <input type="email" id="email" name="email" value="{{ email or '' }}" required>
            </div>
            
            <div class="form-group">
                <label for="password">Password</label>
                <input type="password" id="password" name="password" required>
            </div>
            
            <button type="submit" class="btn">Sign In</button>
        </form>
    </div>
    
    <script>
        // Add some basic client-side validation
        document.querySelector('form').addEventListener('submit', function(e) {
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            
            if (!email || !password) {
                e.preventDefault();
                alert('Please fill in both email and password');
                return;
            }
            
            // Disable submit button to prevent double-submission
            const submitBtn = document.querySelector('.btn');
            submitBtn.disabled = true;
            submitBtn.textContent = 'Signing in...';
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
    <title>Dashboard - Integration Demo</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            max-width: 600px;
            margin: 50px auto;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .card {
            background: white;
            padding: 40px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            margin-bottom: 20px;
        }
        h1 {
            color: #333;
            margin-bottom: 20px;
        }
        .user-info {
            background-color: #e3f2fd;
            padding: 20px;
            border-radius: 4px;
            margin-bottom: 20px;
        }
        .btn {
            padding: 10px 20px;
            background-color: #dc3545;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            text-decoration: none;
            display: inline-block;
        }
        .btn:hover {
            background-color: #c82333;
        }
        .session-info {
            background-color: #f8f9fa;
            padding: 15px;
            border-radius: 4px;
            font-family: monospace;
            font-size: 14px;
            margin-bottom: 20px;
        }
    </style>
</head>
<body>
    <div class="card">
        <h1>Welcome to the Dashboard!</h1>
        
        <div class="user-info">
            <h3>User Information</h3>
            <p><strong>Name:</strong> {{ user.name }}</p>
            <p><strong>Email:</strong> {{ user.email }}</p>
            <p><strong>User ID:</strong> {{ user.id }}</p>
        </div>
        
        <div class="session-info">
            <strong>Session Info:</strong><br>
            Token: {{ token[:20] }}...<br>
            Expires: {{ expires_at }}
        </div>
        
        <p>You have successfully signed in! This demonstrates that the sign-in flow is working correctly.</p>
        
        <div style="margin-top: 30px;">
            <a href="/signout" class="btn">Sign Out</a>
        </div>
    </div>
</body>
</html>
"""

@app.route('/')
def home():
    """Home page - redirect to sign-in if not authenticated."""
    if 'token' in session:
        # Validate existing session
        validation_result = signin_manager.validate_token(session['token'])
        if validation_result['valid']:
            return redirect(url_for('dashboard'))
        else:
            # Invalid token, clear session
            session.clear()
    
    return redirect(url_for('signin'))

@app.route('/signin', methods=['GET', 'POST'])
def signin():
    """Sign-in page and handler."""
    if request.method == 'GET':
        # Check if already signed in
        if 'token' in session:
            validation_result = signin_manager.validate_token(session['token'])
            if validation_result['valid']:
                return redirect(url_for('dashboard'))
        
        return render_template_string(LOGIN_TEMPLATE)
    
    # POST - handle sign-in
    email = request.form.get('email', '').strip()
    password = request.form.get('password', '')
    
    result = signin_manager.sign_in(email, password)
    
    if result['success']:
        # Store session token
        session['token'] = result['token']
        session['user'] = result['user']
        return redirect(url_for('dashboard'))
    else:
        # Show enhanced error message with suggestions
        error_info = result['error']
        error_display = {
            'message': error_info.get('message', 'An error occurred'),
        }
        
        # Add suggestion if available
        if 'details' in error_info and error_info['details'].get('suggestion'):
            error_display['suggestion'] = error_info['details']['suggestion']
        
        return render_template_string(
            LOGIN_TEMPLATE,
            error=error_display,
            email=email
        )

@app.route('/dashboard')
def dashboard():
    """Dashboard page for authenticated users."""
    if 'token' not in session:
        return redirect(url_for('signin'))
    
    # Validate token
    validation_result = signin_manager.validate_token(session['token'])
    if not validation_result['valid']:
        session.clear()
        return redirect(url_for('signin'))
    
    return render_template_string(
        DASHBOARD_TEMPLATE,
        user=session['user'],
        token=session['token'],
        expires_at=validation_result['expires_at']
    )

@app.route('/signout')
def signout():
    """Sign out and clear session."""
    if 'token' in session:
        signin_manager.sign_out(session['token'])
    
    session.clear()
    return render_template_string(
        LOGIN_TEMPLATE,
        success="You have been signed out successfully."
    )

@app.route('/api/signin', methods=['POST'])
def api_signin():
    """API endpoint for sign-in (JSON)."""
    data = request.get_json()
    if not data:
        return jsonify({
            'success': False,
            'error': {
                'message': 'JSON data required',
                'code': 'INVALID_REQUEST'
            }
        }), 400
    
    email = data.get('email', '').strip()
    password = data.get('password', '')
    
    result = signin_manager.sign_in(email, password)
    
    if result['success']:
        return jsonify(result), 200
    else:
        return jsonify(result), 401

@app.route('/api/validate', methods=['POST'])
def api_validate():
    """API endpoint to validate session token."""
    data = request.get_json()
    if not data or 'token' not in data:
        return jsonify({
            'valid': False,
            'error': 'Token required'
        }), 400
    
    result = signin_manager.validate_token(data['token'])
    return jsonify(result), 200 if result['valid'] else 401

@app.route('/api/signout', methods=['POST'])
def api_signout():
    """API endpoint for sign-out."""
    data = request.get_json()
    if not data or 'token' not in data:
        return jsonify({
            'success': False,
            'error': 'Token required'
        }), 400
    
    result = signin_manager.sign_out(data['token'])
    return jsonify(result), 200

@app.route('/health')
def health():
    """Health check endpoint."""
    return jsonify({
        'status': 'healthy',
        'service': 'sign-in-flow',
        'timestamp': signin_manager.session_manager.sessions.__len__(),
        'active_sessions': len(signin_manager.session_manager.sessions)
    })

if __name__ == '__main__':
    print("=== Sign-In Flow Web Interface ===")
    print("Starting server on http://localhost:5000")
    print("\nDemo credentials:")
    print("- User: user@example.com / password123")
    print("- Admin: admin@example.com / admin123")
    print("\nEndpoints:")
    print("- GET / - Home page")
    print("- GET/POST /signin - Sign-in form")
    print("- GET /dashboard - User dashboard")
    print("- GET /signout - Sign out")
    print("- POST /api/signin - JSON API sign-in")
    print("- POST /api/validate - Token validation")
    print("- POST /api/signout - JSON API sign-out")
    print("- GET /health - Health check")
    print("\n" + "="*50)
    
    app.run(host='0.0.0.0', port=5000, debug=True)