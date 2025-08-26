# integ

Integration CLI Tool - A simple command-line application providing signin and help functionality.

## Features

- **Signin/Signout**: User authentication with session persistence
- **Status**: Check current signin status  
- **Help**: Comprehensive help system with usage examples

## Installation

No installation required. Simply clone this repository and run the Python script.

## Usage

```bash
python integ.py <command> [options]
```

### Commands

- `signin [username]` - Sign in with username and password
- `signout` - Sign out current user
- `status` - Show current signin status
- `help` - Show help message

### Examples

```bash
# Sign in (will prompt for username and password)
python integ.py signin

# Sign in with specific username (will prompt for password)
python integ.py signin myuser

# Check current status
python integ.py status

# Sign out
python integ.py signout

# Show help
python integ.py help
```

## Authentication Requirements

- Username must be at least 3 characters
- Password must be at least 4 characters
- User session is saved locally in `~/.integ_config.json`

## Testing

Run the test suite:

```bash
python test_integ.py
```

## Files

- `integ.py` - Main CLI application
- `test_integ.py` - Unit tests
- `README.md` - This documentation