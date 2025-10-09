#!/usr/bin/env python3
"""
Simple CLI application for managing subscriptions and greetings.
"""

import sys
import json
import os
import re

# File to store subscribers
SUBSCRIBERS_FILE = "subscribers.json"

def load_subscribers():
    """Load subscribers from file."""
    if os.path.exists(SUBSCRIBERS_FILE):
        try:
            with open(SUBSCRIBERS_FILE, 'r') as f:
                return json.load(f)
        except (IOError, PermissionError, json.JSONDecodeError) as e:
            print(f"Warning: Could not load subscribers: {e}")
            return []
    return []

def save_subscribers(subscribers):
    """Save subscribers to file."""
    try:
        with open(SUBSCRIBERS_FILE, 'w') as f:
            json.dump(subscribers, f, indent=2)
    except (IOError, PermissionError) as e:
        print(f"Error: Could not save subscribers: {e}")
        return False
    return True

def handle_greeting(greeting_type):
    """Handle greeting commands."""
    greetings = {
        'hello': 'Hello there!',
        'hey': 'Hey! How can I help you?',
        'yo': 'Yo! What\'s up?'
    }
    return greetings.get(greeting_type.lower(), 'Hi!')

def is_valid_email(email):
    """Validate email format."""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None

def handle_subscribe(email=None):
    """Handle subscribe command."""
    if not email:
        return "Please provide an email address to subscribe."
    
    if not is_valid_email(email):
        return "Invalid email format. Please provide a valid email address."
    
    subscribers = load_subscribers()
    
    if email in subscribers:
        return f"{email} is already subscribed."
    
    subscribers.append(email)
    if not save_subscribers(subscribers):
        return "Error: Could not save subscription."
    return f"{email} has been successfully subscribed!"

def handle_subscribe_list():
    """Handle subscribe list command."""
    subscribers = load_subscribers()
    
    if not subscribers:
        return "No subscribers yet."
    
    result = "Subscribers:\n"
    for i, email in enumerate(subscribers, 1):
        result += f"{i}. {email}\n"
    return result.strip()

def handle_signin(username=None):
    """Handle signin command."""
    if not username:
        return "Please provide a username to sign in."
    
    return f"Welcome back, {username}! You are now signed in."

def main():
    """Main function to handle CLI commands."""
    if len(sys.argv) < 2:
        print("Usage: python app.py <command> [args]")
        print("\nAvailable commands:")
        print("  hello              - Get a hello greeting")
        print("  hey                - Get a hey greeting")
        print("  yo                 - Get a yo greeting")
        print("  subscribe <email>  - Subscribe with an email")
        print("  subscribe list     - List all subscribers")
        print("  signin <username>  - Sign in with a username")
        sys.exit(1)
    
    command = sys.argv[1].lower()
    
    # Handle greetings
    if command in ['hello', 'hey', 'yo']:
        print(handle_greeting(command))
    
    # Handle subscribe commands
    elif command == 'subscribe':
        if len(sys.argv) > 2 and sys.argv[2].lower() == 'list':
            print(handle_subscribe_list())
        elif len(sys.argv) > 2:
            email = sys.argv[2]
            print(handle_subscribe(email))
        else:
            print(handle_subscribe())
    
    # Handle signin
    elif command == 'signin':
        if len(sys.argv) > 2:
            username = sys.argv[2]
            print(handle_signin(username))
        else:
            print(handle_signin())
    
    else:
        print(f"Unknown command: {command}")
        sys.exit(1)

if __name__ == "__main__":
    main()
