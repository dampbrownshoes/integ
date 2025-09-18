# integ

A comprehensive CLI application providing help and signin functionality with both interactive and command-line execution modes.

## Overview

The integ CLI application is designed to demonstrate user authentication and help system functionality. It provides a secure, user-friendly interface for managing user sessions and accessing application features.

## Architecture

### Core Components
- **IntegApp Class**: Main application controller handling all commands and user session management
- **Authentication System**: Secure credential validation with session persistence
- **Interactive Mode**: Continuous command execution with user-friendly prompts
- **Command-Line Mode**: Single command execution for automation and scripting

### Security Features
- Password masking during input using Python's `getpass` module
- Session-based authentication with automatic state management
- Input validation and sanitization
- Secure credential verification

## Features

- **Comprehensive Help System**: Detailed command information with examples and usage scenarios
- **User Authentication**: Secure signin/signout with session management
- **Interactive Mode**: Continuous command execution with intuitive prompts
- **Command Line Mode**: Single command execution for automation
- **Status Monitoring**: Real-time authentication state tracking
- **Error Handling**: Graceful error messages and input validation

## Installation & Setup

### Prerequisites
- Python 3.6 or higher
- No external dependencies required (uses only Python standard library)

### Quick Start
1. Clone or download the repository
2. Navigate to the project directory
3. Make the script executable (optional): `chmod +x main.py`
4. Run the application: `python main.py`

## Usage

### Interactive Mode
```bash
python main.py
```
**Features:**
- Continuous command execution
- Session persistence between commands
- User-friendly prompts and feedback
- Type `exit` or use Ctrl+C to quit

**Example Session:**
```
$ python main.py
Welcome to INTEG CLI!
Type 'help' for available commands or 'exit' to quit.

integ> help
[Displays comprehensive help information]

integ> signin
=== SIGN IN ===
Username: admin
Password: [hidden]
Successfully signed in as: admin

integ> status
Current user: admin

integ> signout
Signed out user: admin

integ> exit
Goodbye!
```

### Command Line Mode
```bash
python main.py <command>
```
**Use Cases:**
- Automation and scripting
- System integration
- One-time command execution
- CI/CD pipeline integration

**Examples:**
```bash
python main.py help      # Display comprehensive help
python main.py signin    # Interactive signin prompt
python main.py status    # Show current authentication status
python main.py signout   # Sign out current user
```

## Available Commands

### help
**Purpose**: Display comprehensive help information
**Usage**: `help`
**Description**: Shows detailed information about all available commands, usage modes, examples, and security features.

### signin
**Purpose**: Authenticate user with credentials
**Usage**: `signin`
**Features**:
- Secure password input (masked)
- Credential validation
- Session establishment
- Error handling for invalid credentials
**Security**: Passwords are never displayed or stored in plain text during input.

### signout
**Purpose**: Terminate current user session
**Usage**: `signout`
**Description**: Clears current authentication state and ends user session.

### status
**Purpose**: Display current authentication status
**Usage**: `status`
**Output**: Shows current logged-in user or "No user signed in" message.

### exit
**Purpose**: Exit the application (interactive mode only)
**Usage**: `exit`
**Description**: Gracefully terminates the interactive session.

## Demo Users

For testing and demonstration purposes, the following user accounts are available:

| Username | Password | Description |
|----------|----------|-------------|
| `admin` | `password123` | Administrator account |
| `user` | `pass` | Standard user account |
| `test` | `test123` | Test account for development |

**Note**: These are demo credentials for testing purposes only. In a production environment, implement proper user management and secure credential storage.

## Error Handling

The application includes comprehensive error handling for common scenarios:

- **Empty username**: Prompts user to enter a valid username
- **Invalid credentials**: Clear error message without revealing which part failed
- **Already signed in**: Informs user of current session status
- **Not signed in**: Appropriate messaging for commands requiring authentication
- **Invalid commands**: Helpful error messages with suggestions
- **Keyboard interrupts**: Graceful shutdown with goodbye message

## Technical Details

### Dependencies
- **Python Standard Library Only**:
  - `sys`: Command-line argument handling
  - `getpass`: Secure password input
  - `typing`: Type annotations for code clarity

### Code Structure
```
main.py
├── IntegApp class
│   ├── __init__(): Initialize user database and session state
│   ├── help(): Comprehensive help system
│   ├── signin(): User authentication with security features
│   ├── signout(): Session termination
│   ├── status(): Authentication state display
│   ├── run_command(): Command dispatch and execution
│   └── interactive_mode(): Interactive session management
└── main(): Entry point and mode selection
```

### Session Management
- Session state is maintained in memory during application execution
- User authentication persists throughout the session
- Clean session termination on exit or signout

## Development & Testing

### Running Tests
The application can be tested manually using the provided demo accounts:

```bash
# Test help system
python main.py help

# Test authentication
python main.py signin
# Enter: admin / password123

# Test status checking
python main.py status

# Test interactive mode
python main.py
```

### Code Quality
- Type annotations for better code documentation
- Comprehensive docstrings for all methods
- Error handling for edge cases
- Clean separation of concerns

## Requirements

- Python 3.6+
- No external dependencies required
- Cross-platform compatibility (Windows, macOS, Linux)

## License

This project is provided as-is for demonstration purposes.