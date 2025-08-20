# API Integration Example

This example demonstrates how to build a robust API client with proper error handling, retry logic, and authentication.

## Features

- **Retry Logic**: Exponential backoff for failed requests
- **Error Handling**: Comprehensive exception handling
- **Authentication**: Bearer token support
- **Timeout Management**: Configurable request timeouts
- **JSON Support**: Automatic JSON serialization/deserialization

## Usage

```python
from client import APIClient

# Create client
client = APIClient("https://api.example.com", api_key="your-token")

# Make requests
data = client.get("/users", params={"limit": 10})
result = client.post("/users", {"name": "John", "email": "john@example.com"})
```

## Running the Example

```bash
# Install dependencies
pip install requests

# Run the demo
python client.py
```

## Configuration Options

- `base_url`: API base URL
- `api_key`: Optional API key for authentication
- `retries`: Number of retry attempts (default: 3)
- `timeout`: Request timeout in seconds (default: 30)

## Error Handling

The client handles various error scenarios:
- Network connectivity issues
- HTTP error status codes
- JSON parsing errors
- Timeout errors

All errors are logged and can trigger retry attempts with exponential backoff.