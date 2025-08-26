#!/usr/bin/env python3
"""
Integration CLI Tool
Provides signin and help functionality
"""

import sys
import getpass
import json
import os
from pathlib import Path

class IntegCLI:
    def __init__(self):
        self.config_file = Path.home() / '.integ_config.json'
        self.current_user = None
        
    def load_config(self):
        """Load user configuration if exists"""
        if self.config_file.exists():
            try:
                with open(self.config_file, 'r') as f:
                    config = json.load(f)
                    self.current_user = config.get('current_user')
            except (json.JSONDecodeError, IOError):
                pass
    
    def save_config(self):
        """Save user configuration"""
        config = {'current_user': self.current_user}
        try:
            with open(self.config_file, 'w') as f:
                json.dump(config, f, indent=2)
        except IOError as e:
            print(f"Warning: Could not save config: {e}")
    
    def signin(self, username=None):
        """Handle user signin"""
        if username is None:
            username = input("Username: ")
        
        if not username.strip():
            print("Error: Username cannot be empty")
            return False
            
        password = getpass.getpass("Password: ")
        
        if not password:
            print("Error: Password cannot be empty")
            return False
        
        # Simple validation (in real app, this would authenticate against a service)
        if len(username) >= 3 and len(password) >= 4:
            self.current_user = username
            self.save_config()
            print(f"Successfully signed in as: {username}")
            return True
        else:
            print("Error: Invalid credentials (username must be 3+ chars, password 4+ chars)")
            return False
    
    def signout(self):
        """Handle user signout"""
        if self.current_user:
            print(f"Signing out {self.current_user}")
            self.current_user = None
            self.save_config()
        else:
            print("Not currently signed in")
    
    def status(self):
        """Show current signin status"""
        if self.current_user:
            print(f"Currently signed in as: {self.current_user}")
        else:
            print("Not signed in")
    
    def help(self):
        """Display help information"""
        help_text = """
Integration CLI Tool - Help

USAGE:
    python integ.py <command> [options]

COMMANDS:
    signin [username]  - Sign in with username and password
                        If username not provided, will prompt for it
    signout           - Sign out current user
    status            - Show current signin status
    help              - Show this help message

EXAMPLES:
    python integ.py signin
    python integ.py signin myuser
    python integ.py signout
    python integ.py status
    python integ.py help

NOTES:
    - Username must be at least 3 characters
    - Password must be at least 4 characters
    - User session is saved locally in ~/.integ_config.json
        """
        print(help_text)
    
    def run(self, args):
        """Main CLI entry point"""
        self.load_config()
        
        if len(args) < 2:
            self.help()
            return
        
        command = args[1].lower()
        
        if command == 'signin':
            username = args[2] if len(args) > 2 else None
            self.signin(username)
        elif command == 'signout':
            self.signout()
        elif command == 'status':
            self.status()
        elif command == 'help':
            self.help()
        else:
            print(f"Unknown command: {command}")
            print("Use 'help' to see available commands")

if __name__ == '__main__':
    cli = IntegCLI()
    cli.run(sys.argv)