document.addEventListener('DOMContentLoaded', function() {
    const MIN_PASSWORD_LENGTH = 6;
    const SUCCESS_MESSAGE_TIMEOUT = 3000;
    
    const form = document.getElementById('signinForm');
    const messageDiv = document.getElementById('message');

    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value;

        // Clear previous messages
        messageDiv.className = 'message';
        messageDiv.textContent = '';

        // Basic validation
        if (username === '') {
            showMessage('Please enter a username', 'error');
            return;
        }

        if (password === '') {
            showMessage('Please enter a password', 'error');
            return;
        }

        if (password.length < MIN_PASSWORD_LENGTH) {
            showMessage('Password must be at least ' + MIN_PASSWORD_LENGTH + ' characters long', 'error');
            return;
        }

        // Simulate signin (in a real app, this would make an API call)
        messageDiv.className = 'message success';
        messageDiv.textContent = 'Sign in successful! Welcome, ';
        const usernameSpan = document.createElement('span');
        usernameSpan.textContent = username;
        messageDiv.appendChild(usernameSpan);
        messageDiv.appendChild(document.createTextNode('!'));
        
        // Clear form after successful signin
        setTimeout(() => {
            form.reset();
            messageDiv.className = 'message';
            messageDiv.textContent = '';
        }, SUCCESS_MESSAGE_TIMEOUT);
    });

    function showMessage(text, type) {
        messageDiv.textContent = text;
        messageDiv.className = 'message ' + type;
    }
});
