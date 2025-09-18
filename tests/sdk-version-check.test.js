const { checkSdkVersion } = require('../scripts/check-sdk-version');
const fs = require('fs');

// Mock console methods
let mockConsoleLog, mockConsoleError, mockProcessExit;

beforeEach(() => {
  mockConsoleLog = jest.spyOn(console, 'log').mockImplementation();
  mockConsoleError = jest.spyOn(console, 'error').mockImplementation();
  mockProcessExit = jest.spyOn(process, 'exit').mockImplementation();
});

afterEach(() => {
  jest.restoreAllMocks();
  // Clean up test files
  if (fs.existsSync('test-app-config.json')) {
    fs.unlinkSync('test-app-config.json');
  }
});

describe('SDK Version Check', () => {
  const createTestConfig = (sdkVersion) => {
    const config = {
      name: 'test-app',
      version: '1.0.0',
      sdkVersion: sdkVersion,
      description: 'Test app'
    };
    fs.writeFileSync('app-config.json', JSON.stringify(config, null, 2));
  };

  test('should NOW PASS apps with previous SDK versions (FIXED behavior)', () => {
    createTestConfig('2.0.5');
    
    const result = checkSdkVersion();
    
    expect(result).toBe(true);
    expect(mockConsoleLog).toHaveBeenCalledWith('✅ SDK version check passed');
    expect(mockConsoleLog).toHaveBeenCalledWith(
      expect.stringContaining('Warning: App is using SDK version 2.0.5')
    );
    expect(mockProcessExit).not.toHaveBeenCalled();
  });

  test('should still FAIL apps with very old SDK versions (below 2.0.0)', () => {
    createTestConfig('1.9.0');
    
    checkSdkVersion();
    
    expect(mockConsoleError).toHaveBeenCalledWith(
      expect.stringContaining('SDK version 1.9.0 is below minimum required version 2.0.0')
    );
    expect(mockProcessExit).toHaveBeenCalledWith(1);
  });

  test('should pass apps with current SDK version without warnings', () => {
    createTestConfig('2.1.0');
    
    const result = checkSdkVersion();
    
    expect(result).toBe(true);
    expect(mockConsoleLog).toHaveBeenCalledWith('✅ SDK version check passed');
    expect(mockConsoleLog).not.toHaveBeenCalledWith(
      expect.stringContaining('Warning')
    );
    expect(mockProcessExit).not.toHaveBeenCalled();
  });

  test('should pass apps with newer SDK version', () => {
    createTestConfig('2.2.0');
    
    const result = checkSdkVersion();
    
    expect(result).toBe(true);
    expect(mockConsoleLog).toHaveBeenCalledWith('✅ SDK version check passed');
    expect(mockProcessExit).not.toHaveBeenCalled();
  });

  test('should show warning for 2.0.x versions but still allow them', () => {
    createTestConfig('2.0.8');
    
    const result = checkSdkVersion();
    
    expect(result).toBe(true);
    expect(mockConsoleLog).toHaveBeenCalledWith(
      expect.stringContaining('Warning: App is using SDK version 2.0.8')
    );
    expect(mockConsoleLog).toHaveBeenCalledWith('✅ SDK version check passed');
    expect(mockProcessExit).not.toHaveBeenCalled();
  });
});