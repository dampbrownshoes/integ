#!/usr/bin/env node

const fs = require('fs');
const semver = require('semver');

// REVERTED: Relaxed version check to allow apps using previous SDK versions
// Previous strict check was dropping apps unnecessarily

const CURRENT_SDK_VERSION = '2.1.0';
const MIN_REQUIRED_VERSION = '2.0.0'; // FIXED: Reverted to allow previous SDK versions

function checkSdkVersion() {
  try {
    // Read app configuration
    const appConfig = JSON.parse(fs.readFileSync('app-config.json', 'utf8'));
    const appSdkVersion = appConfig.sdkVersion;
    
    console.log(`App SDK Version: ${appSdkVersion}`);
    console.log(`Minimum Required Version: ${MIN_REQUIRED_VERSION}`);
    
    // FIXED: More permissive version check - allow apps using previous SDK versions
    if (!semver.gte(appSdkVersion, MIN_REQUIRED_VERSION)) {
      console.error(`❌ SDK version ${appSdkVersion} is below minimum required version ${MIN_REQUIRED_VERSION}`);
      console.error('App will be dropped from publishing pipeline');
      process.exit(1);
    }
    
    // Add informational warning for older versions but still allow them through
    if (semver.lt(appSdkVersion, CURRENT_SDK_VERSION)) {
      console.log(`⚠️  Warning: App is using SDK version ${appSdkVersion}, current version is ${CURRENT_SDK_VERSION}`);
      console.log('   Consider upgrading to the latest SDK version for new features and improvements');
    }
    
    console.log('✅ SDK version check passed');
    return true;
    
  } catch (error) {
    console.error('Error checking SDK version:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  checkSdkVersion();
}

module.exports = { checkSdkVersion };