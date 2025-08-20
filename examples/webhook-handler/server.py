#!/usr/bin/env python3
"""
Simple Webhook Handler Example
Demonstrates how to build a basic webhook receiver with validation and processing.
"""

from flask import Flask, request, jsonify
import hashlib
import hmac
import json
import logging
from typing import Dict, Any, Optional

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)

class WebhookProcessor:
    """Processes webhook events with signature validation and event handling."""
    
    def __init__(self, secret_key: Optional[str] = None):
        self.secret_key = secret_key
        self.handlers = {}
    
    def register_handler(self, event_type: str, handler_func):
        """Register a handler function for a specific event type."""
        self.handlers[event_type] = handler_func
        logger.info(f"Registered handler for event type: {event_type}")
    
    def validate_signature(self, payload: bytes, signature: str) -> bool:
        """Validate webhook signature using HMAC-SHA256."""
        if not self.secret_key:
            return True  # Skip validation if no secret key
        
        expected_signature = hmac.new(
            self.secret_key.encode(),
            payload,
            hashlib.sha256
        ).hexdigest()
        
        # Remove 'sha256=' prefix if present
        if signature.startswith('sha256='):
            signature = signature[7:]
        
        return hmac.compare_digest(expected_signature, signature)
    
    def process_event(self, event_data: Dict[str, Any]) -> Dict[str, Any]:
        """Process a webhook event based on its type."""
        event_type = event_data.get('type', 'unknown')
        
        logger.info(f"Processing event: {event_type}")
        
        if event_type in self.handlers:
            try:
                result = self.handlers[event_type](event_data)
                logger.info(f"Successfully processed {event_type} event")
                return {"status": "success", "result": result}
            
            except Exception as e:
                logger.error(f"Error processing {event_type}: {e}")
                return {"status": "error", "message": str(e)}
        
        else:
            logger.warning(f"No handler found for event type: {event_type}")
            return {"status": "ignored", "message": f"No handler for {event_type}"}

# Initialize processor
processor = WebhookProcessor(secret_key="your-webhook-secret")

# Example event handlers
def handle_user_created(event_data):
    """Handle user creation events."""
    user_data = event_data.get('data', {})
    logger.info(f"New user created: {user_data.get('email')}")
    
    # Add your processing logic here
    # e.g., send welcome email, update database, etc.
    
    return {"processed": True, "user_id": user_data.get('id')}

def handle_order_completed(event_data):
    """Handle order completion events."""
    order_data = event_data.get('data', {})
    logger.info(f"Order completed: {order_data.get('id')}")
    
    # Add your processing logic here
    # e.g., send confirmation email, update inventory, etc.
    
    return {"processed": True, "order_id": order_data.get('id')}

# Register handlers
processor.register_handler('user.created', handle_user_created)
processor.register_handler('order.completed', handle_order_completed)

@app.route('/webhook', methods=['POST'])
def handle_webhook():
    """Main webhook endpoint."""
    try:
        # Get request data
        payload = request.get_data()
        signature = request.headers.get('X-Signature', '')
        
        # Validate signature
        if not processor.validate_signature(payload, signature):
            logger.warning("Invalid webhook signature")
            return jsonify({"error": "Invalid signature"}), 401
        
        # Parse JSON payload
        try:
            event_data = request.get_json()
        except Exception as e:
            logger.error(f"Invalid JSON payload: {e}")
            return jsonify({"error": "Invalid JSON"}), 400
        
        # Process the event
        result = processor.process_event(event_data)
        
        return jsonify(result), 200
    
    except Exception as e:
        logger.error(f"Webhook processing error: {e}")
        return jsonify({"error": "Internal server error"}), 500

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint."""
    return jsonify({"status": "healthy", "handlers": list(processor.handlers.keys())})

if __name__ == '__main__':
    logger.info("Starting webhook handler server...")
    app.run(host='0.0.0.0', port=5000, debug=True)