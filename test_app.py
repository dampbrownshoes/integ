#!/usr/bin/env python3
"""
Tests for the CLI application.
"""

import unittest
import os
import json
import sys
from io import StringIO
from unittest.mock import patch
import app

class TestApp(unittest.TestCase):
    """Test cases for the app module."""
    
    def setUp(self):
        """Set up test fixtures."""
        # Remove subscribers file if it exists
        if os.path.exists(app.SUBSCRIBERS_FILE):
            os.remove(app.SUBSCRIBERS_FILE)
    
    def tearDown(self):
        """Clean up after tests."""
        # Remove subscribers file if it exists
        if os.path.exists(app.SUBSCRIBERS_FILE):
            os.remove(app.SUBSCRIBERS_FILE)
    
    def test_greeting_hello(self):
        """Test hello greeting."""
        result = app.handle_greeting('hello')
        self.assertEqual(result, 'Hello there!')
    
    def test_greeting_hey(self):
        """Test hey greeting."""
        result = app.handle_greeting('hey')
        self.assertEqual(result, 'Hey! How can I help you?')
    
    def test_greeting_yo(self):
        """Test yo greeting."""
        result = app.handle_greeting('yo')
        self.assertEqual(result, 'Yo! What\'s up?')
    
    def test_subscribe_new_email(self):
        """Test subscribing a new email."""
        result = app.handle_subscribe('test@example.com')
        self.assertIn('successfully subscribed', result)
        
        # Verify email was saved
        subscribers = app.load_subscribers()
        self.assertIn('test@example.com', subscribers)
    
    def test_subscribe_duplicate_email(self):
        """Test subscribing an email that already exists."""
        app.handle_subscribe('test@example.com')
        result = app.handle_subscribe('test@example.com')
        self.assertIn('already subscribed', result)
    
    def test_subscribe_without_email(self):
        """Test subscribe command without email."""
        result = app.handle_subscribe()
        self.assertIn('provide an email', result)
    
    def test_subscribe_invalid_email(self):
        """Test subscribing an invalid email format."""
        result = app.handle_subscribe('invalid-email')
        self.assertIn('Invalid email format', result)
        
        result = app.handle_subscribe('test@')
        self.assertIn('Invalid email format', result)
        
        result = app.handle_subscribe('@example.com')
        self.assertIn('Invalid email format', result)
    
    def test_is_valid_email(self):
        """Test email validation."""
        self.assertTrue(app.is_valid_email('test@example.com'))
        self.assertTrue(app.is_valid_email('user.name@example.co.uk'))
        self.assertFalse(app.is_valid_email('invalid'))
        self.assertFalse(app.is_valid_email('test@'))
        self.assertFalse(app.is_valid_email('@example.com'))
    
    def test_subscribe_list_empty(self):
        """Test listing subscribers when list is empty."""
        result = app.handle_subscribe_list()
        self.assertIn('No subscribers', result)
    
    def test_subscribe_list_with_subscribers(self):
        """Test listing subscribers."""
        app.handle_subscribe('test1@example.com')
        app.handle_subscribe('test2@example.com')
        
        result = app.handle_subscribe_list()
        self.assertIn('test1@example.com', result)
        self.assertIn('test2@example.com', result)
        self.assertIn('Subscribers:', result)
    
    def test_signin_with_username(self):
        """Test signing in with a username."""
        result = app.handle_signin('john')
        self.assertIn('Welcome back, john', result)
        self.assertIn('signed in', result)
    
    def test_signin_without_username(self):
        """Test signin command without username."""
        result = app.handle_signin()
        self.assertIn('provide a username', result)
    
    def test_load_save_subscribers(self):
        """Test loading and saving subscribers."""
        test_subscribers = ['test1@example.com', 'test2@example.com']
        app.save_subscribers(test_subscribers)
        
        loaded = app.load_subscribers()
        self.assertEqual(loaded, test_subscribers)
    
    @patch('sys.argv', ['app.py', 'hello'])
    @patch('sys.stdout', new_callable=StringIO)
    def test_main_hello(self, mock_stdout):
        """Test main function with hello command."""
        app.main()
        output = mock_stdout.getvalue()
        self.assertIn('Hello there!', output)
    
    @patch('sys.argv', ['app.py', 'subscribe', 'test@example.com'])
    @patch('sys.stdout', new_callable=StringIO)
    def test_main_subscribe(self, mock_stdout):
        """Test main function with subscribe command."""
        app.main()
        output = mock_stdout.getvalue()
        self.assertIn('successfully subscribed', output)
    
    @patch('sys.argv', ['app.py', 'subscribe', 'list'])
    @patch('sys.stdout', new_callable=StringIO)
    def test_main_subscribe_list(self, mock_stdout):
        """Test main function with subscribe list command."""
        app.handle_subscribe('test@example.com')
        app.main()
        output = mock_stdout.getvalue()
        self.assertIn('test@example.com', output)
    
    @patch('sys.argv', ['app.py', 'signin', 'testuser'])
    @patch('sys.stdout', new_callable=StringIO)
    def test_main_signin(self, mock_stdout):
        """Test main function with signin command."""
        app.main()
        output = mock_stdout.getvalue()
        self.assertIn('Welcome back, testuser', output)

if __name__ == '__main__':
    unittest.main()
