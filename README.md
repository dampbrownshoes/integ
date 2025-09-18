# integ

## Signin Validator with Irrational Character Handling

This repository provides a robust signin validation system that specifically handles "irrational characters" - characters that are invalid, unsafe, or problematic in authentication contexts.

### Features

- **Username Validation**: Ensures usernames contain only rational characters (letters, numbers, underscores, dots, hyphens)
- **Password Validation**: Validates passwords for safe, printable ASCII characters
- **Irrational Character Detection**: Identifies and rejects:
  - Control characters (null, escape sequences, etc.)
  - Non-printable characters
  - Potentially unsafe characters for XSS prevention
  - Non-ASCII characters that may cause encoding issues
- **Input Sanitization**: Provides utilities to clean user input

### What are "Irrational Characters"?

In this context, "irrational characters" refer to:
- Control characters (ASCII 0-31, 127)
- Non-printable characters
- Characters that can cause security issues (`<`, `>`, `"`, `'`, `&`)
- Non-ASCII characters that may cause encoding problems
- Emoji and other Unicode characters in usernames

### Usage

```javascript
const SigninValidator = require('./signin');

const validator = new SigninValidator();

// Validate a signin attempt
const result = validator.validateSignin('username', 'password123!');
if (result.success) {
    console.log('Signin valid!');
} else {
    console.log('Signin failed:', result.errors);
}

// Sanitize user input
const clean = validator.sanitizeInput('user<script>input');
```

### Files

- `signin.js` - Main validation class
- `test-signin.js` - Test suite for validation functionality
- `example.js` - Usage examples and demonstrations

### Running Tests

```bash
node test-signin.js
```

### Running Examples

```bash
node example.js
```