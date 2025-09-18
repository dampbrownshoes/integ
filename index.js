// Integration App - GitHub Text Styling Demo

const chalk = require('chalk');

// Function to colorize GitHub mentions
function colorizeGitHub(text) {
  // Add color to GitHub mentions - make them cyan/blue
  return text.replace(/GitHub/g, chalk.cyan.bold('GitHub'));
}

// Function to add yellow text styling
function yellowText(text) {
  return chalk.yellow(text);
}

// Demo function
function demo() {
  console.log('🚀 Integration App Demo');
  console.log('');
  
  // Regular text with GitHub mentions
  const text1 = 'This app integrates with GitHub to provide seamless workflows.';
  console.log('Original:', text1);
  console.log('Colored: ', colorizeGitHub(text1));
  console.log('');
  
  // Yellow text example
  console.log('Yellow text example:');
  console.log(yellowText('This text is displayed in yellow!'));
  console.log('');
  
  // Combined example
  const text2 = 'Welcome to GitHub integration! This feature highlights GitHub in color.';
  console.log('Combined styling:');
  console.log(yellowText(colorizeGitHub(text2)));
}

// Export functions for use in other modules
module.exports = {
  colorizeGitHub,
  yellowText,
  demo
};

// Run demo if this file is executed directly
if (require.main === module) {
  demo();
}