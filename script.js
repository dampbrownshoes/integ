// Application state
let currentUser = null;
let userSettings = {
    displayName: '',
    email: '',
    theme: 'light',
    notifications: false
};

// DOM elements
const signinSection = document.getElementById('signin-section');
const settingsSection = document.getElementById('settings-section');
const navLinks = document.querySelector('.nav-links');
const messageDiv = document.getElementById('message');
const signinForm = document.getElementById('signin-form');
const settingsForm = document.getElementById('settings-form');

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    // Load saved settings from localStorage
    loadSavedSettings();
    
    // Add form event listeners
    signinForm.addEventListener('submit', handleSignin);
    settingsForm.addEventListener('submit', handleSettingsSave);
    
    // Apply saved theme
    applyTheme(userSettings.theme);
});

// Sign in functionality
function handleSignin(event) {
    event.preventDefault();
    
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    
    // Basic validation
    if (!username || !password) {
        showMessage('Please enter both username and password', 'error');
        return;
    }
    
    // Simple authentication (in real app, this would be server-side)
    if (username.length >= 3 && password.length >= 6) {
        currentUser = {
            username: username,
            id: Date.now()
        };
        
        // Set default display name if not set
        if (!userSettings.displayName) {
            userSettings.displayName = username;
            document.getElementById('display-name').value = username;
        }
        
        showMessage('Successfully signed in!', 'success');
        setTimeout(() => {
            showMainApp();
        }, 1000);
    } else {
        showMessage('Username must be at least 3 characters and password at least 6 characters', 'error');
    }
}

// Show main app (settings page)
function showMainApp() {
    signinSection.style.display = 'none';
    settingsSection.style.display = 'block';
    navLinks.style.display = 'flex';
    
    // Populate settings form with current values
    populateSettingsForm();
}

// Show signin page
function showSignin() {
    signinSection.style.display = 'block';
    settingsSection.style.display = 'none';
    navLinks.style.display = 'none';
    
    // Clear signin form
    signinForm.reset();
    clearMessage();
}

// Show settings page
function showSettings() {
    populateSettingsForm();
}

// Sign out functionality
function signOut() {
    currentUser = null;
    showMessage('You have been signed out', 'success');
    setTimeout(() => {
        showSignin();
    }, 1000);
}

// Settings functionality
function handleSettingsSave(event) {
    event.preventDefault();
    
    // Get form values
    userSettings.displayName = document.getElementById('display-name').value.trim();
    userSettings.email = document.getElementById('email').value.trim();
    userSettings.theme = document.getElementById('theme').value;
    userSettings.notifications = document.getElementById('notifications').checked;
    
    // Validate email if provided
    if (userSettings.email && !isValidEmail(userSettings.email)) {
        showMessage('Please enter a valid email address', 'error');
        return;
    }
    
    // Save settings to localStorage
    saveSettings();
    
    // Apply theme change
    applyTheme(userSettings.theme);
    
    showMessage('Settings saved successfully!', 'success');
}

// Populate settings form with current values
function populateSettingsForm() {
    document.getElementById('display-name').value = userSettings.displayName;
    document.getElementById('email').value = userSettings.email;
    document.getElementById('theme').value = userSettings.theme;
    document.getElementById('notifications').checked = userSettings.notifications;
}

// Theme management
function applyTheme(theme) {
    if (theme === 'dark') {
        document.body.classList.add('dark-theme');
    } else {
        document.body.classList.remove('dark-theme');
    }
}

// Local storage functions
function saveSettings() {
    try {
        localStorage.setItem('integ-settings', JSON.stringify(userSettings));
    } catch (error) {
        console.warn('Could not save settings to localStorage:', error);
    }
}

function loadSavedSettings() {
    try {
        const saved = localStorage.getItem('integ-settings');
        if (saved) {
            userSettings = { ...userSettings, ...JSON.parse(saved) };
        }
    } catch (error) {
        console.warn('Could not load settings from localStorage:', error);
    }
}

// Utility functions
function showMessage(text, type = 'info') {
    messageDiv.textContent = text;
    messageDiv.className = `message ${type}`;
    
    // Auto-hide success messages
    if (type === 'success') {
        setTimeout(clearMessage, 3000);
    }
}

function clearMessage() {
    messageDiv.textContent = '';
    messageDiv.className = 'message';
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Keyboard shortcuts
document.addEventListener('keydown', function(event) {
    // Alt + S for settings (when signed in)
    if (event.altKey && event.key === 's' && currentUser) {
        event.preventDefault();
        showSettings();
    }
    
    // Alt + Q for sign out (when signed in)
    if (event.altKey && event.key === 'q' && currentUser) {
        event.preventDefault();
        signOut();
    }
});