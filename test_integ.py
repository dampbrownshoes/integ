#!/usr/bin/env python3
"""
Simple tests for the Integration CLI Tool
"""

import os
import sys
import tempfile
import unittest
from unittest.mock import patch, MagicMock
from pathlib import Path

# Add the parent directory to the path to import integ
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from integ import IntegCLI

class TestIntegCLI(unittest.TestCase):
    def setUp(self):
        """Set up test fixtures"""
        self.cli = IntegCLI()
        # Use a temporary config file for testing
        self.temp_config = tempfile.NamedTemporaryFile(suffix='.json', delete=False)
        self.cli.config_file = Path(self.temp_config.name)
        self.temp_config.close()
    
    def tearDown(self):
        """Clean up test fixtures"""
        if self.cli.config_file.exists():
            os.unlink(self.cli.config_file)
    
    def test_help_command(self):
        """Test help command displays help text"""
        with patch('builtins.print') as mock_print:
            self.cli.help()
            mock_print.assert_called()
            # Check that help text contains key information
            help_output = str(mock_print.call_args[0][0])
            self.assertIn('Integration CLI Tool - Help', help_output)
            self.assertIn('signin', help_output)
            self.assertIn('signout', help_output)
            self.assertIn('help', help_output)
    
    def test_signin_valid_credentials(self):
        """Test signin with valid credentials"""
        with patch('builtins.input', return_value='testuser'):
            with patch('getpass.getpass', return_value='testpass'):
                with patch('builtins.print') as mock_print:
                    result = self.cli.signin()
                    self.assertTrue(result)
                    self.assertEqual(self.cli.current_user, 'testuser')
                    mock_print.assert_called_with('Successfully signed in as: testuser')
    
    def test_signin_invalid_credentials(self):
        """Test signin with invalid credentials"""
        with patch('builtins.input', return_value='ab'):  # Too short username
            with patch('getpass.getpass', return_value='123'):  # Too short password
                with patch('builtins.print') as mock_print:
                    result = self.cli.signin()
                    self.assertFalse(result)
                    self.assertIsNone(self.cli.current_user)
                    mock_print.assert_called_with('Error: Invalid credentials (username must be 3+ chars, password 4+ chars)')
    
    def test_signin_empty_username(self):
        """Test signin with empty username"""
        with patch('builtins.input', return_value=''):
            with patch('builtins.print') as mock_print:
                result = self.cli.signin()
                self.assertFalse(result)
                mock_print.assert_called_with('Error: Username cannot be empty')
    
    def test_signin_empty_password(self):
        """Test signin with empty password"""
        with patch('builtins.input', return_value='testuser'):
            with patch('getpass.getpass', return_value=''):
                with patch('builtins.print') as mock_print:
                    result = self.cli.signin()
                    self.assertFalse(result)
                    mock_print.assert_called_with('Error: Password cannot be empty')
    
    def test_signin_with_provided_username(self):
        """Test signin with username provided as parameter"""
        with patch('getpass.getpass', return_value='testpass'):
            with patch('builtins.print') as mock_print:
                result = self.cli.signin('testuser')
                self.assertTrue(result)
                self.assertEqual(self.cli.current_user, 'testuser')
    
    def test_status_not_signed_in(self):
        """Test status command when not signed in"""
        with patch('builtins.print') as mock_print:
            self.cli.status()
            mock_print.assert_called_with('Not signed in')
    
    def test_status_signed_in(self):
        """Test status command when signed in"""
        self.cli.current_user = 'testuser'
        with patch('builtins.print') as mock_print:
            self.cli.status()
            mock_print.assert_called_with('Currently signed in as: testuser')
    
    def test_signout_when_signed_in(self):
        """Test signout when user is signed in"""
        self.cli.current_user = 'testuser'
        with patch('builtins.print') as mock_print:
            self.cli.signout()
            mock_print.assert_called_with('Signing out testuser')
            self.assertIsNone(self.cli.current_user)
    
    def test_signout_when_not_signed_in(self):
        """Test signout when no user is signed in"""
        with patch('builtins.print') as mock_print:
            self.cli.signout()
            mock_print.assert_called_with('Not currently signed in')
    
    def test_config_persistence(self):
        """Test that user config is saved and loaded properly"""
        # Sign in and save config
        self.cli.current_user = 'testuser'
        self.cli.save_config()
        
        # Create new instance and load config
        new_cli = IntegCLI()
        new_cli.config_file = self.cli.config_file
        new_cli.load_config()
        
        self.assertEqual(new_cli.current_user, 'testuser')
    
    def test_run_with_help_command(self):
        """Test running CLI with help command"""
        with patch.object(self.cli, 'help') as mock_help:
            self.cli.run(['integ.py', 'help'])
            mock_help.assert_called_once()
    
    def test_run_with_no_args(self):
        """Test running CLI with no arguments shows help"""
        with patch.object(self.cli, 'help') as mock_help:
            self.cli.run(['integ.py'])
            mock_help.assert_called_once()
    
    def test_run_with_unknown_command(self):
        """Test running CLI with unknown command"""
        with patch('builtins.print') as mock_print:
            self.cli.run(['integ.py', 'unknown'])
            mock_print.assert_any_call('Unknown command: unknown')
            mock_print.assert_any_call("Use 'help' to see available commands")

if __name__ == '__main__':
    unittest.main()