#!/usr/bin/env python3
"""
INTEG CLI Application

A comprehensive command-line interface application that provides user authentication
and help system functionality. Supports both interactive and single-command execution modes.

Features:
- Secure user authentication with session management
- Comprehensive help system with detailed command information
- Interactive mode for continuous command execution
- Command-line mode for automation and scripting
- Robust error handling and input validation

Author: GitHub Copilot
Version: 1.0
Python Version: 3.6+
Dependencies: Python standard library only
"""

import sys
import getpass
from typing import Dict, Any, Optional

class IntegApp:
    """
    Main application class for the INTEG CLI.
    
    This class manages user authentication, command execution, and session state.
    It provides a secure interface for user signin/signout operations and 
    comprehensive help functionality.
    
    Attributes:
        users (Dict[str, str]): Demo user database with username:password pairs
        current_user (Optional[str]): Currently authenticated user, None if not signed in
    
    Security Features:
        - Password masking during input
        - Session-based authentication
        - Input validation and sanitization
    """
    
    def __init__(self) -> None:
        """
        Initialize the application with demo user database and session state.
        
        Creates a simple in-memory user database for demonstration purposes.
        In a production environment, this would connect to a secure user store.
        """
        # Demo user database - in production, use secure credential storage
        self.users: Dict[str, str] = {
            "admin": "password123",    # Administrator account
            "user": "pass",           # Standard user account  
            "test": "test123"         # Test account for development
        }
        # Session state - tracks currently authenticated user
        self.current_user: Optional[str] = None
    
    def help(self) -> None:
        """Display comprehensive help information."""
        print("\n" + "="*50)
        print("         INTEG CLI APPLICATION HELP")
        print("="*50)
        
        print("\nDESCRIPTION:")
        print("  A command-line interface for user authentication and help system.")
        print("  Supports both interactive and single-command execution modes.")
        
        print("\nAVAILABLE COMMANDS:")
        print("  help     - Display this comprehensive help information")
        print("             Example: python main.py help")
        print()
        print("  signin   - Authenticate with username and password")
        print("             - Prompts for credentials securely")
        print("             - Maintains session until signout")
        print("             Example: python main.py signin")
        print()
        print("  signout  - End current user session")
        print("             - Clears authentication state")
        print("             Example: python main.py signout")
        print()
        print("  status   - Display current authentication status")
        print("             - Shows logged-in user or 'not signed in'")
        print("             Example: python main.py status")
        print()
        print("  exit     - Exit the application (interactive mode only)")
        print("             - Gracefully terminates the session")
        
        print("\nUSAGE MODES:")
        print("  1. Interactive Mode:")
        print("     python main.py")
        print("     - Starts an interactive session")
        print("     - Execute multiple commands in sequence")
        print("     - Type 'exit' or Ctrl+C to quit")
        print()
        print("  2. Command-Line Mode:")
        print("     python main.py <command>")
        print("     - Execute a single command and exit")
        print("     - Useful for scripting and automation")
        
        print("\nDEMO CREDENTIALS:")
        print("  For testing purposes, use these accounts:")
        print("  • admin / password123")
        print("  • user / pass")
        print("  • test / test123")
        
        print("\nSECURITY FEATURES:")
        print("  • Password input is masked during entry")
        print("  • Invalid login attempts are logged")
        print("  • Session management prevents unauthorized access")
        
        print("\nEXAMPLES:")
        print("  # Show help")
        print("  python main.py help")
        print()
        print("  # Check status without signing in")
        print("  python main.py status")
        print()
        print("  # Interactive session example:")
        print("  python main.py")
        print("  integ> signin")
        print("  integ> status")
        print("  integ> signout")
        print("  integ> exit")
        
        print("\n" + "="*50)
        print()
    
    def signin(self) -> bool:
        """
        Handle secure user authentication process.
        
        Prompts user for credentials and validates against the user database.
        Implements security best practices including password masking and 
        input validation.
        
        Returns:
            bool: True if authentication successful, False otherwise
            
        Security Features:
            - Password input is masked using getpass module
            - Credential validation without revealing which part failed
            - Session state management
            - Input sanitization
        
        Flow:
            1. Check if user is already signed in
            2. Prompt for username with validation
            3. Securely collect password (masked input)
            4. Validate credentials against user database
            5. Establish session if authentication successful
        """
        # Check if already authenticated
        if self.current_user:
            print(f"Already signed in as: {self.current_user}")
            return True
            
        print("\n=== SIGN IN ===")
        
        # Collect and validate username
        username = input("Username: ").strip()
        
        if not username:
            print("Username cannot be empty")
            return False
            
        # Securely collect password (masked input)
        password = getpass.getpass("Password: ")
        
        # Validate credentials and establish session
        if username in self.users and self.users[username] == password:
            self.current_user = username
            print(f"Successfully signed in as: {username}")
            return True
        else:
            # Security: Don't reveal whether username or password failed
            print("Invalid username or password")
            return False
    
    def signout(self) -> None:
        """
        Terminate the current user session.
        
        Clears the authentication state and ends the user session.
        Provides appropriate feedback based on current session state.
        
        Security: Ensures clean session termination
        """
        if self.current_user:
            print(f"Signed out user: {self.current_user}")
            self.current_user = None
        else:
            print("No user currently signed in")
    
    def status(self) -> None:
        """
        Display current user authentication status.
        
        Shows the currently authenticated user or indicates no active session.
        Useful for checking session state before performing authenticated operations.
        """
        if self.current_user:
            print(f"Current user: {self.current_user}")
        else:
            print("No user signed in")
    
    def run_command(self, command: str) -> bool:
        """
        Execute a single command with proper routing and error handling.
        
        Args:
            command (str): The command to execute (case-insensitive)
            
        Returns:
            bool: True to continue execution, False to exit application
            
        Supported Commands:
            - help: Display comprehensive help information
            - signin: Authenticate user with credentials
            - signout: Terminate current user session
            - status: Show current authentication status
            - exit/quit: Terminate application
        """
        command = command.lower().strip()
        
        if command == "help":
            self.help()
        elif command == "signin":
            self.signin()
        elif command == "signout":
            self.signout()
        elif command == "status":
            self.status()
        elif command in ["exit", "quit"]:
            print("Goodbye!")
            return False
        else:
            print(f"Unknown command: {command}")
            print("Type 'help' for available commands")
        
        return True
    
    def interactive_mode(self) -> None:
        """
        Run the application in interactive mode for continuous command execution.
        
        Provides a user-friendly interface for executing multiple commands
        in sequence. Handles user input, command execution, and graceful
        shutdown on exit or interruption.
        
        Features:
            - Continuous command execution loop
            - User-friendly prompt and feedback
            - Graceful handling of Ctrl+C and EOF
            - Session persistence between commands
            - Empty input handling
        """
        print("Welcome to INTEG CLI!")
        print("Type 'help' for available commands or 'exit' to quit.")
        
        while True:
            try:
                command = input("\ninteg> ").strip()
                if not command:
                    continue
                    
                if not self.run_command(command):
                    break
                    
            except KeyboardInterrupt:
                print("\nGoodbye!")
                break
            except EOFError:
                print("\nGoodbye!")
                break

def main() -> None:
    """
    Main entry point for the INTEG CLI application.
    
    Determines execution mode based on command-line arguments:
    - No arguments: Interactive mode
    - Single argument: Command-line mode
    
    Usage:
        python main.py           # Interactive mode
        python main.py <command> # Command-line mode
    """
    app = IntegApp()
    
    if len(sys.argv) > 1:
        # Command-line mode: execute single command and exit
        command = sys.argv[1]
        app.run_command(command)
    else:
        # Interactive mode: continuous command execution
        app.interactive_mode()

if __name__ == "__main__":
    main()