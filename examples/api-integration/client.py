#!/usr/bin/env python3
"""
Simple API Integration Example
Demonstrates how to build a basic REST API client with error handling and retry logic.
"""

import requests
import time
import json
from typing import Dict, Any, Optional

class APIClient:
    """A simple REST API client with retry and error handling."""
    
    def __init__(self, base_url: str, api_key: Optional[str] = None):
        self.base_url = base_url.rstrip('/')
        self.session = requests.Session()
        
        if api_key:
            self.session.headers.update({'Authorization': f'Bearer {api_key}'})
    
    def get(self, endpoint: str, params: Optional[Dict] = None, retries: int = 3) -> Dict[Any, Any]:
        """Make a GET request with retry logic."""
        url = f"{self.base_url}/{endpoint.lstrip('/')}"
        
        for attempt in range(retries):
            try:
                response = self.session.get(url, params=params, timeout=30)
                response.raise_for_status()
                return response.json()
            
            except requests.exceptions.RequestException as e:
                if attempt == retries - 1:
                    raise Exception(f"API request failed after {retries} attempts: {e}")
                
                # Exponential backoff
                wait_time = (2 ** attempt) + 1
                print(f"Request failed, retrying in {wait_time} seconds...")
                time.sleep(wait_time)
    
    def post(self, endpoint: str, data: Dict, retries: int = 3) -> Dict[Any, Any]:
        """Make a POST request with retry logic."""
        url = f"{self.base_url}/{endpoint.lstrip('/')}"
        
        for attempt in range(retries):
            try:
                response = self.session.post(
                    url, 
                    json=data, 
                    headers={'Content-Type': 'application/json'},
                    timeout=30
                )
                response.raise_for_status()
                return response.json()
            
            except requests.exceptions.RequestException as e:
                if attempt == retries - 1:
                    raise Exception(f"API request failed after {retries} attempts: {e}")
                
                wait_time = (2 ** attempt) + 1
                print(f"Request failed, retrying in {wait_time} seconds...")
                time.sleep(wait_time)

def example_usage():
    """Demonstrate the API client with a public API."""
    # Using JSONPlaceholder as an example public API
    client = APIClient("https://jsonplaceholder.typicode.com")
    
    try:
        # GET example
        print("Fetching posts...")
        posts = client.get("/posts", params={"_limit": 3})
        print(f"Retrieved {len(posts)} posts")
        
        for post in posts:
            print(f"- {post['title']}")
        
        # POST example
        print("\nCreating a new post...")
        new_post = {
            "title": "Integration Example",
            "body": "This demonstrates API integration capabilities",
            "userId": 1
        }
        
        result = client.post("/posts", new_post)
        print(f"Created post with ID: {result['id']}")
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    example_usage()