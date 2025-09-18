#!/usr/bin/env node

const fs = require('fs');

function validateApp() {
  try {
    // Check if app-config.json exists
    if (!fs.existsSync('app-config.json')) {
      console.error('❌ app-config.json not found');
      process.exit(1);
    }
    
    // Validate app configuration
    const appConfig = JSON.parse(fs.readFileSync('app-config.json', 'utf8'));
    
    const requiredFields = ['name', 'version', 'sdkVersion', 'description'];
    for (const field of requiredFields) {
      if (!appConfig[field]) {
        console.error(`❌ Missing required field: ${field}`);
        process.exit(1);
      }
    }
    
    console.log('✅ App configuration is valid');
    return true;
    
  } catch (error) {
    console.error('Error validating app:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  validateApp();
}

module.exports = { validateApp };