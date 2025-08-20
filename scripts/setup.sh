#!/bin/bash
# Setup script for the integ repository
# This demonstrates automation capabilities

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Setting up integ repository...${NC}"

# Check if Python is available
check_python() {
    if command -v python3 &> /dev/null; then
        echo -e "${GREEN}✅ Python 3 is available${NC}"
        python3 --version
    else
        echo -e "${RED}❌ Python 3 is required but not installed${NC}"
        exit 1
    fi
}

# Check if pip is available
check_pip() {
    if command -v pip3 &> /dev/null || command -v pip &> /dev/null; then
        echo -e "${GREEN}✅ pip is available${NC}"
    else
        echo -e "${RED}❌ pip is required but not installed${NC}"
        exit 1
    fi
}

# Install Python dependencies for examples
install_dependencies() {
    echo -e "${YELLOW}📦 Installing Python dependencies...${NC}"
    
    # Create a simple requirements file
    cat > /tmp/integ_requirements.txt << EOF
requests>=2.25.0
flask>=2.0.0
EOF
    
    pip3 install -r /tmp/integ_requirements.txt
    echo -e "${GREEN}✅ Dependencies installed${NC}"
    
    # Clean up
    rm /tmp/integ_requirements.txt
}

# Test the examples
test_examples() {
    echo -e "${YELLOW}🧪 Testing examples...${NC}"
    
    # Test API client
    echo "Testing API integration example..."
    cd examples/api-integration
    python3 -c "from client import APIClient; print('API client module imported successfully')"
    cd - > /dev/null
    
    # Test webhook handler (syntax check only)
    echo "Testing webhook handler example..."
    cd examples/webhook-handler
    python3 -c "from server import WebhookProcessor; print('Webhook handler module imported successfully')"
    cd - > /dev/null
    
    echo -e "${GREEN}✅ All examples tested successfully${NC}"
}

# Create development environment info
create_dev_info() {
    echo -e "${YELLOW}📝 Creating development information...${NC}"
    
    cat > .devinfo << EOF
# Development Environment Information
Generated: $(date)

## Python Environment
Python Version: $(python3 --version 2>&1)
Pip Version: $(pip3 --version 2>&1)

## Available Examples
- API Integration (examples/api-integration/)
- Webhook Handler (examples/webhook-handler/)

## Quick Commands
# Test API client
cd examples/api-integration && python3 client.py

# Start webhook server
cd examples/webhook-handler && python3 server.py

# Run health check
curl http://localhost:5000/health

## Repository Structure
$(find . -type d -name ".git" -prune -o -type d -print | head -10)
EOF
    
    echo -e "${GREEN}✅ Development info created (.devinfo)${NC}"
}

# Main setup flow
main() {
    echo "Starting setup process..."
    
    check_python
    check_pip
    install_dependencies
    test_examples
    create_dev_info
    
    echo -e "${GREEN}🎉 Setup complete! Your integ repository is ready.${NC}"
    echo ""
    echo -e "${YELLOW}Next steps:${NC}"
    echo "1. Explore the examples directory"
    echo "2. Run 'cd examples/api-integration && python3 client.py' to test API integration"
    echo "3. Run 'cd examples/webhook-handler && python3 server.py' to start webhook server"
    echo "4. Check .devinfo for development environment details"
}

# Run main function
main "$@"