# Webhook Handler Example

This example demonstrates how to build a secure webhook receiver with signature validation, event processing, and error handling.

## Features

- **Signature Validation**: HMAC-SHA256 signature verification
- **Event Routing**: Type-based event handler registration
- **Error Handling**: Comprehensive error handling and logging
- **Health Checks**: Built-in health monitoring endpoint
- **Extensible**: Easy to add new event handlers

## Usage

### Starting the Server

```bash
# Install dependencies
pip install flask

# Run the server
python server.py
```

The server will start on `http://localhost:5000`

### Endpoints

- `POST /webhook` - Main webhook receiver
- `GET /health` - Health check and handler status

### Adding Event Handlers

```python
def handle_payment_received(event_data):
    # Your processing logic here
    return {"processed": True}

processor.register_handler('payment.received', handle_payment_received)
```

### Testing Webhooks

```bash
# Test webhook endpoint
curl -X POST http://localhost:5000/webhook \
  -H "Content-Type: application/json" \
  -H "X-Signature: sha256=your-signature" \
  -d '{"type": "user.created", "data": {"id": 123, "email": "test@example.com"}}'

# Check health
curl http://localhost:5000/health
```

## Security Features

- **Signature Validation**: Verifies webhook authenticity using HMAC-SHA256
- **Error Handling**: Prevents information leakage in error responses
- **Input Validation**: JSON payload validation
- **Logging**: Comprehensive request and error logging

## Configuration

Set your webhook secret:
```python
processor = WebhookProcessor(secret_key="your-webhook-secret")
```

## Event Types

Currently supported event types:
- `user.created` - New user registration
- `order.completed` - Order completion
- Custom event types can be easily added

## Deployment

For production deployment:
1. Use a proper WSGI server (gunicorn, uWSGI)
2. Set up proper logging configuration
3. Configure environment variables for secrets
4. Add rate limiting and authentication
5. Monitor webhook processing metrics