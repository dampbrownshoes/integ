# integ

A simple CLI application providing help and signin functionality.

## Features

- **Help System**: Get information about available commands
- **User Authentication**: Sign in and sign out functionality
- **Interactive Mode**: Run commands interactively
- **Command Line Mode**: Execute single commands directly

## Usage

### Interactive Mode
```bash
python main.py
```

### Command Line Mode
```bash
python main.py help      # Show help information
python main.py signin    # Sign in to the application
python main.py status    # Show current user status
python main.py signout   # Sign out current user
```

## Available Commands

- `help` - Display help information and available commands
- `signin` - Sign in with username and password
- `signout` - Sign out the current user
- `status` - Show current user authentication status
- `exit` - Exit the application (interactive mode only)

## Demo Users

For testing purposes, the following demo users are available:
- Username: `admin`, Password: `password123`
- Username: `user`, Password: `pass`
- Username: `test`, Password: `test123`

## Requirements

- Python 3.x
- No external dependencies required