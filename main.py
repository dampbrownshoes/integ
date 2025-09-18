#!/usr/bin/env python3
"""
Simple CLI application providing help and signin functionality.
"""

import sys
import getpass
from typing import Dict, Any

class IntegApp:
    """Main application class for integ CLI."""
    
    def __init__(self):
        self.users = {
            "admin": "password123",
            "user": "pass",
            "test": "test123"
        }
        self.current_user = None
    
    def help(self) -> None:
        """Display help information."""
        print("\n=== INTEG CLI HELP ===")
        print("Available commands:")
        print("  help     - Show this help message")
        print("  signin   - Sign in to the application")
        print("  signout  - Sign out of the application")
        print("  status   - Show current user status")
        print("  exit     - Exit the application")
        print("\nUsage:")
        print("  python main.py [command]")
        print("  or run interactively: python main.py")
        print()
    
    def signin(self) -> bool:
        """Handle user signin process."""
        if self.current_user:
            print(f"Already signed in as: {self.current_user}")
            return True
            
        print("\n=== SIGN IN ===")
        username = input("Username: ").strip()
        
        if not username:
            print("Username cannot be empty")
            return False
            
        password = getpass.getpass("Password: ")
        
        if username in self.users and self.users[username] == password:
            self.current_user = username
            print(f"Successfully signed in as: {username}")
            return True
        else:
            print("Invalid username or password")
            return False
    
    def signout(self) -> None:
        """Sign out the current user."""
        if self.current_user:
            print(f"Signed out user: {self.current_user}")
            self.current_user = None
        else:
            print("No user currently signed in")
    
    def status(self) -> None:
        """Show current user status."""
        if self.current_user:
            print(f"Current user: {self.current_user}")
        else:
            print("No user signed in")
    
    def run_command(self, command: str) -> bool:
        """Execute a single command."""
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
        """Run the application in interactive mode."""
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

def main():
    """Main entry point."""
    app = IntegApp()
    
    if len(sys.argv) > 1:
        # Command line mode
        command = sys.argv[1]
        app.run_command(command)
    else:
        # Interactive mode
        app.interactive_mode()

if __name__ == "__main__":
    main()