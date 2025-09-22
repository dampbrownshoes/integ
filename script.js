// Simple authentication system with demo credentials
const DEMO_USERS = [
    { email: 'user@example.com', password: 'password123' },
    { email: 'admin@integ.com', password: 'admin123' },
    { email: 'demo@demo.com', password: 'demo' }
];

class SignInManager {
    constructor() {
        this.init();
    }

    init() {
        // Check if user is already signed in
        if (this.isSignedIn()) {
            this.showSuccessPage();
            return;
        }

        // Set up event listeners
        this.setupEventListeners();
    }

    setupEventListeners() {
        const form = document.getElementById('signinForm');
        const signupLink = document.getElementById('signupLink');

        if (form) {
            form.addEventListener('submit', (e) => this.handleSignIn(e));
        }

        if (signupLink) {
            signupLink.addEventListener('click', (e) => this.handleSignUp(e));
        }
    }

    handleSignIn(event) {
        event.preventDefault();
        
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;

        // Clear previous error messages
        this.hideError();

        // Validate inputs
        if (!this.validateEmail(email)) {
            this.showError('Please enter a valid email address.');
            return;
        }

        if (password.length < 3) {
            this.showError('Password must be at least 3 characters long.');
            return;
        }

        // Authenticate user
        if (this.authenticateUser(email, password)) {
            this.signInUser(email);
            this.showSuccessPage();
        } else {
            this.showError('Invalid email or password. Try: user@example.com / password123');
        }
    }

    handleSignUp(event) {
        event.preventDefault();
        this.showError('Sign up functionality not implemented yet. Use demo credentials: user@example.com / password123');
    }

    validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    authenticateUser(email, password) {
        return DEMO_USERS.some(user => 
            user.email === email && user.password === password
        );
    }

    signInUser(email) {
        // Store user session (in real app, this would be handled securely on the server)
        localStorage.setItem('isSignedIn', 'true');
        localStorage.setItem('userEmail', email);
        localStorage.setItem('signInTime', new Date().toISOString());
    }

    isSignedIn() {
        return localStorage.getItem('isSignedIn') === 'true';
    }

    signOut() {
        localStorage.removeItem('isSignedIn');
        localStorage.removeItem('userEmail');
        localStorage.removeItem('signInTime');
        location.reload();
    }

    showError(message) {
        const errorElement = document.getElementById('error-message');
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.classList.remove('hidden');
        }
    }

    hideError() {
        const errorElement = document.getElementById('error-message');
        if (errorElement) {
            errorElement.classList.add('hidden');
        }
    }

    showSuccessPage() {
        const userEmail = localStorage.getItem('userEmail');
        const signInTime = localStorage.getItem('signInTime');
        const formattedTime = signInTime ? new Date(signInTime).toLocaleString() : 'Unknown';

        document.body.innerHTML = `
            <div class="container">
                <div class="success-page">
                    <h1>Welcome!</h1>
                    <p>You have successfully signed in as <strong>${userEmail}</strong></p>
                    <p>Sign-in time: ${formattedTime}</p>
                    <button class="logout-btn" onclick="signInManager.signOut()">Sign Out</button>
                </div>
            </div>
        `;
    }
}

// Initialize the sign-in manager when the page loads
const signInManager = new SignInManager();

// Make signInManager globally accessible for the logout button
window.signInManager = signInManager;