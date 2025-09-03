const AuthHandler = require('./auth-handler');

// Test data
const authHandler = new AuthHandler();

console.log('=== Comprehensive Auth Handler Test ===\n');

// Test cases
const testCases = [
  {
    name: 'Legacy v1.0 token (should now work)',
    token: 'legacy.1.eyJ1c2VySWQiOiIxMjM0NSIsImV4cCI6OTk5OTk5OTk5OX0',
    expectedValid: true,
    expectedVersion: '1.0'
  },
  {
    name: 'New v2.0 token (should work)', 
    token: 'bearer.2.eyJ1c2VySWQiOiIxMjM0NSIsImV4cCI6OTk5OTk5OTk5OX0.signature',
    expectedValid: true,
    expectedVersion: '2.0'
  },
  {
    name: 'Empty token',
    token: '',
    expectedValid: false,
    expectedStatusCode: 401
  },
  {
    name: 'Invalid format token',
    token: 'invalid.format',
    expectedValid: false,
    expectedStatusCode: 400
  },
  {
    name: 'Unsupported version token',
    token: 'prefix.3.payload.extra',
    expectedValid: false,
    expectedStatusCode: 400
  },
  {
    name: 'Malformed payload',
    token: 'legacy.1.invalidbase64',
    expectedValid: false,
    expectedStatusCode: 400
  }
];

let passedTests = 0;
let totalTests = testCases.length;

testCases.forEach((testCase, index) => {
  console.log(`${index + 1}. ${testCase.name}:`);
  
  try {
    const result = authHandler.validateToken(testCase.token);
    
    let testPassed = true;
    let issues = [];
    
    if (result.valid !== testCase.expectedValid) {
      testPassed = false;
      issues.push(`Expected valid: ${testCase.expectedValid}, got: ${result.valid}`);
    }
    
    if (testCase.expectedVersion && result.version !== testCase.expectedVersion) {
      testPassed = false;
      issues.push(`Expected version: ${testCase.expectedVersion}, got: ${result.version}`);
    }
    
    if (testCase.expectedStatusCode && result.statusCode !== testCase.expectedStatusCode) {
      testPassed = false;
      issues.push(`Expected status: ${testCase.expectedStatusCode}, got: ${result.statusCode}`);
    }
    
    if (testPassed) {
      console.log('✅ PASS');
      passedTests++;
    } else {
      console.log('❌ FAIL');
      issues.forEach(issue => console.log(`   ${issue}`));
    }
    
    console.log(`   Result: ${JSON.stringify(result)}`);
    
  } catch (error) {
    console.log('❌ ERROR');
    console.log(`   ${error.message}`);
  }
  
  console.log('');
});

console.log(`=== Test Summary ===`);
console.log(`Passed: ${passedTests}/${totalTests}`);
console.log(`${passedTests === totalTests ? '🎉 All tests passed!' : '⚠️ Some tests failed'}`);

// Test middleware integration
console.log('\n=== Middleware Test ===');
const middleware = authHandler.middleware();

// Mock Express request/response
const createMockReq = (authHeader) => ({
  headers: {
    authorization: authHeader
  }
});

const createMockRes = () => {
  const res = {};
  res.status = (code) => {
    res.statusCode = code;
    return res;
  };
  res.json = (data) => {
    res.jsonData = data;
    return res;
  };
  return res;
};

const testMiddleware = (tokenType, token) => {
  const req = createMockReq(`Bearer ${token}`);
  const res = createMockRes();
  let nextCalled = false;
  
  const next = () => {
    nextCalled = true;
  };
  
  middleware(req, res, next);
  
  console.log(`${tokenType}:`);
  if (nextCalled) {
    console.log('✅ Authentication successful');
    console.log(`   User: ${JSON.stringify(req.user)}`);
  } else {
    console.log('❌ Authentication failed');
    console.log(`   Status: ${res.statusCode}`);
    console.log(`   Response: ${JSON.stringify(res.jsonData)}`);
  }
  console.log('');
};

testMiddleware('Legacy Token', 'legacy.1.eyJ1c2VySWQiOiIxMjM0NSIsImV4cCI6OTk5OTk5OTk5OX0');
testMiddleware('New Token', 'bearer.2.eyJ1c2VySWQiOiIxMjM0NSIsImV4cCI6OTk5OTk5OTk5OX0.signature');