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
     * NEW CLAUSE: Specific irrational character categorization and detection
     * This method provides detailed analysis of what types of irrational characters are present
     * @param {string} input - The input to analyze
     * @returns {object} Detailed irrational character analysis
     */
    analyzeIrrationalCharacters(input) {
        if (!input || typeof input !== 'string') {
            return {
                hasIrrationalChars: false,
                categories: [],
                details: 'Input is empty or not a string'
            };
        }

        const categories = [];
        const details = [];

        // Check for control characters
        if (/[\x00-\x1F\x7F]/.test(input)) {
            categories.push('CONTROL_CHARACTERS');
            details.push('Contains control characters (null, tab, newline, escape sequences)');
        }

        // Check for HTML/XSS characters
        if (/[<>]/.test(input)) {
            categories.push('HTML_INJECTION_RISK');
            details.push('Contains HTML tag characters that pose injection risks');
        }

        // Check for quote characters that can break string contexts
        if (/["']/.test(input)) {
            categories.push('QUOTE_CHARACTERS');
            details.push('Contains quote characters that can break string contexts');
        }

        // Check for ampersand (HTML entity risk)
        if (/&/.test(input)) {
            categories.push('ENTITY_CHARACTERS');
            details.push('Contains ampersand which can form HTML entities');
        }

        // Check for non-ASCII characters
        if (/[^\x00-\x7F]/.test(input)) {
            categories.push('NON_ASCII');
            details.push('Contains non-ASCII characters that may cause encoding issues');
        }

        // Check for Unicode emoji
        if (/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]/u.test(input)) {
            categories.push('EMOJI_UNICODE');
            details.push('Contains emoji or special Unicode characters');
        }

        // Check for invisible characters
        if (/[\u200B-\u200D\uFEFF]/.test(input)) {
            categories.push('INVISIBLE_CHARACTERS');
            details.push('Contains invisible Unicode characters (zero-width spaces, etc.)');
        }

        return {
            hasIrrationalChars: categories.length > 0,
            categories: categories,
            details: details.join('; ')
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

        // NEW CLAUSE: Add detailed irrational character analysis
        const usernameAnalysis = this.analyzeIrrationalCharacters(username);
        const passwordAnalysis = this.analyzeIrrationalCharacters(password);

        if (!usernameValidation.valid || !passwordValidation.valid) {
            return {
                success: false,
                errors: {
                    username: usernameValidation.valid ? null : usernameValidation.reason,
                    password: passwordValidation.valid ? null : passwordValidation.reason
                },
                irrationalCharacterAnalysis: {
                    username: usernameAnalysis,
                    password: passwordAnalysis
                }
            };
        }

        return {
            success: true,
            message: 'Signin credentials are valid',
            irrationalCharacterAnalysis: {
                username: usernameAnalysis,
                password: passwordAnalysis
            }
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
        let sanitized = input.replace(/[\x00-\x1F\x7F]/g, '');
        
        // Remove potentially dangerous characters for XSS prevention
        sanitized = sanitized.replace(/[<>&"']/g, '');
        
        // Remove script tags using indexOf for better performance and security
        const scriptPatterns = ['<script', '</script', 'javascript:', 'onclick=', 'onerror='];
        for (const pattern of scriptPatterns) {
            while (sanitized.toLowerCase().indexOf(pattern) !== -1) {
                const index = sanitized.toLowerCase().indexOf(pattern);
                sanitized = sanitized.substring(0, index) + sanitized.substring(index + pattern.length);
            }
        }
        
        return sanitized.trim();
    }
}

module.exports = SigninValidator;