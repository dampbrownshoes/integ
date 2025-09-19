/**
 * Example usage of SigninValidator with irrational character handling
 */

const SigninValidator = require('./signin');

function demonstrateSigninValidation() {
    const validator = new SigninValidator();
    
    console.log('=== Signin Validator Demo: Handling Irrational Characters ===\n');

    // Test cases with various inputs
    const testCases = [
        {
            username: 'normaluser',
            password: 'GoodPassword123!',
            description: 'Normal valid credentials'
        },
        {
            username: 'user\x00name',
            password: 'GoodPassword123!',
            description: 'Username with null character (irrational)'
        },
        {
            username: 'user<script>',
            password: 'GoodPassword123!',
            description: 'Username with HTML injection attempt (irrational)'
        },
        {
            username: 'validuser',
            password: 'pass\x1B[31mword',
            description: 'Password with ANSI escape sequence (irrational)'
        },
        {
            username: 'user🚀name',
            password: 'GoodPassword123!',
            description: 'Username with emoji (irrational)'
        },
        {
            username: 'validuser',
            password: 'pässwörd123',
            description: 'Password with non-ASCII characters (irrational)'
        }
    ];

    testCases.forEach((testCase, index) => {
        console.log(`Test ${index + 1}: ${testCase.description}`);
        console.log(`Username: "${testCase.username}"`);
        console.log(`Password: "${testCase.password.replace(/./g, '*')}"  (masked for security)`);
        
        const result = validator.validateSignin(testCase.username, testCase.password);
        
        if (result.success) {
            console.log('✅ Result: VALID - Signin would be allowed');
        } else {
            console.log('❌ Result: INVALID - Signin rejected');
            if (result.errors.username) {
                console.log(`   Username error: ${result.errors.username}`);
            }
            if (result.errors.password) {
                console.log(`   Password error: ${result.errors.password}`);
            }
        }
        
        // NEW CLAUSE: Show detailed irrational character analysis
        if (result.irrationalCharacterAnalysis) {
            const usernameAnalysis = result.irrationalCharacterAnalysis.username;
            const passwordAnalysis = result.irrationalCharacterAnalysis.password;
            
            if (usernameAnalysis.hasIrrationalChars) {
                console.log(`   🔍 Username irrational chars: ${usernameAnalysis.categories.join(', ')}`);
                console.log(`      Details: ${usernameAnalysis.details}`);
            }
            if (passwordAnalysis.hasIrrationalChars) {
                console.log(`   🔍 Password irrational chars: ${passwordAnalysis.categories.join(', ')}`);
                console.log(`      Details: ${passwordAnalysis.details}`);
            }
        }
        console.log('');
    });

    // Demonstrate sanitization
    console.log('=== Input Sanitization Demo ===\n');
    
    const unsafeInputs = [
        'hello\x00world',
        'user<script>alert("xss")</script>',
        'data\x1B[31mwith\x1B[0mcolors',
        'normal text'
    ];

    unsafeInputs.forEach((input, index) => {
        const sanitized = validator.sanitizeInput(input);
        console.log(`Input ${index + 1}: "${input}"`);
        console.log(`Sanitized: "${sanitized}"`);
        console.log('');
    });

    // NEW CLAUSE: Demonstrate detailed irrational character analysis
    console.log('=== NEW CLAUSE: Detailed Irrational Character Analysis ===\n');
    
    const analysisInputs = [
        'normal_user123',
        'user\x00\x1Fwith_control',
        'user<script>alert("xss")</script>',
        'user"with\'quotes&ampersand',
        'user🚀with🎉emoji',
        'üser_with_ñon_ascii',
        'user\u200Bwith\uFEFFinvisible'
    ];

    analysisInputs.forEach((input, index) => {
        const analysis = validator.analyzeIrrationalCharacters(input);
        console.log(`Analysis ${index + 1}: "${input}"`);
        console.log(`Has irrational chars: ${analysis.hasIrrationalChars}`);
        if (analysis.hasIrrationalChars) {
            console.log(`Categories: ${analysis.categories.join(', ')}`);
            console.log(`Details: ${analysis.details}`);
        }
        console.log('');
    });
}

// Run the demonstration
if (require.main === module) {
    demonstrateSigninValidation();
}