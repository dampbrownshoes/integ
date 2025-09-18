/**
 * Signin validation system with irrational character handling
 */

class SigninValidator {
    constructor() {
        // Define rational character sets for usernames and passwords
        this.rationalUsernameChars = /^[a-zA-Z0-9_.-]+$/;
        this.rationalPasswordChars = /^[\x20-\x7E]+$/; // printable ASCII characters
        
        // Define irrational/problematic characters
        this.irrationalChars = /[^\x20-\x7E]|[\x00-\x1F\x7F]|[<>\"'&]/;
    }

    /**
     * Validate username for irrational characters
     * @param {string} username - The username to validate
     * @returns {object} Validation result
     */
    validateUsername(username) {
        if (!username || typeof username !== 'string') {
            return {
                valid: false,
                reason: 'Username is required and must be a string'
            };
        }

        if (username.length < 3 || username.length > 50) {
            return {
                valid: false,
                reason: 'Username must be between 3 and 50 characters'
            };
        }

        // Check for irrational characters
        if (this.irrationalChars.test(username)) {
            return {
                valid: false,
                reason: 'Username contains irrational characters (special symbols, control characters, or unsafe characters)'
            };
        }

        if (!this.rationalUsernameChars.test(username)) {
            return {
                valid: false,
                reason: 'Username can only contain letters, numbers, underscores, dots, and hyphens'
            };
        }

        return {
            valid: true,
            reason: 'Username is valid'
        };
    }

    /**
     * Validate password for irrational characters
     * @param {string} password - The password to validate
     * @returns {object} Validation result
     */
    validatePassword(password) {
        if (!password || typeof password !== 'string') {
            return {
                valid: false,
                reason: 'Password is required and must be a string'
            };
        }

        if (password.length < 8 || password.length > 128) {
            return {
                valid: false,
                reason: 'Password must be between 8 and 128 characters'
            };
        }

        // Check for irrational characters (non-printable ASCII)
        if (/[\x00-\x1F\x7F]/.test(password)) {
            return {
                valid: false,
                reason: 'Password contains irrational characters (control characters not allowed)'
            };
        }

        // Allow most printable characters but warn about potential encoding issues
        if (!/^[\x20-\x7E]+$/.test(password)) {
            return {
                valid: false,
                reason: 'Password contains irrational characters (non-ASCII characters may cause encoding issues)'
            };
        }

        return {
            valid: true,
            reason: 'Password is valid'
        };
    }

    /**
     * Main signin validation function
     * @param {string} username - The username
     * @param {string} password - The password
     * @returns {object} Signin validation result
     */
    validateSignin(username, password) {
        const usernameValidation = this.validateUsername(username);
        const passwordValidation = this.validatePassword(password);

        if (!usernameValidation.valid || !passwordValidation.valid) {
            return {
                success: false,
                errors: {
                    username: usernameValidation.valid ? null : usernameValidation.reason,
                    password: passwordValidation.valid ? null : passwordValidation.reason
                }
            };
        }

        return {
            success: true,
            message: 'Signin credentials are valid'
        };
    }

    /**
     * Sanitize input by removing or replacing irrational characters
     * @param {string} input - The input to sanitize
     * @returns {string} Sanitized input
     */
    sanitizeInput(input) {
        if (!input || typeof input !== 'string') {
            return '';
        }

        // Remove control characters and non-printable characters
        return input.replace(/[\x00-\x1F\x7F]/g, '')
                   .replace(/<[^>]*>/g, '') // Remove HTML tags
                   .replace(/[\"'&]/g, '') // Remove remaining potential XSS characters
                   .trim();
    }
}

module.exports = SigninValidator;