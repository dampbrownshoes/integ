# Integ

A comprehensive integration testing and automation framework designed to streamline your development workflow.

## Overview

Integ is a powerful integration testing framework that helps developers and teams create robust, reliable integration tests for their applications. Whether you're working with microservices, APIs, databases, or complex distributed systems, Integ provides the tools and structure you need to ensure your integrations work seamlessly.

## Features

- 🚀 **Easy Setup** - Get started with minimal configuration
- 🔄 **Automated Testing** - Run integration tests automatically in your CI/CD pipeline
- 🌐 **Multi-Service Support** - Test interactions between multiple services and systems
- 📊 **Detailed Reporting** - Comprehensive test reports with metrics and insights
- 🛠️ **Extensible** - Plugin architecture for custom integrations
- 📝 **Configuration-Driven** - Define your test scenarios using simple configuration files

## Quick Start

### Prerequisites

Before getting started, ensure you have the following installed:

- Node.js (v16 or higher)
- npm or yarn
- Docker (for containerized testing environments)

### Installation

```bash
# Clone the repository
git clone https://github.com/dampbrownshoes/integ.git

# Navigate to the project directory
cd integ

# Install dependencies
npm install

# Run the setup script
npm run setup
```

### Basic Usage

1. **Create a test configuration file:**

```json
{
  "name": "api-integration-test",
  "services": [
    {
      "name": "user-service",
      "url": "http://localhost:3001",
      "healthCheck": "/health"
    },
    {
      "name": "auth-service", 
      "url": "http://localhost:3002",
      "healthCheck": "/health"
    }
  ],
  "tests": [
    {
      "name": "User Authentication Flow",
      "steps": [
        {
          "action": "POST",
          "service": "auth-service",
          "endpoint": "/login",
          "payload": {
            "username": "testuser",
            "password": "testpass"
          },
          "expect": {
            "status": 200,
            "body": {
              "token": "string"
            }
          }
        }
      ]
    }
  ]
}
```

2. **Run your integration tests:**

```bash
# Run all tests
npm run test

# Run a specific test suite
npm run test -- --suite api-integration-test

# Run tests with verbose output
npm run test -- --verbose
```

## Configuration

Integ uses configuration files to define your integration tests. Here's a complete example:

```json
{
  "name": "E-commerce Integration Tests",
  "version": "1.0.0",
  "environment": {
    "variables": {
      "BASE_URL": "http://localhost:8080",
      "API_KEY": "${API_KEY}"
    }
  },
  "services": [
    {
      "name": "product-service",
      "url": "${BASE_URL}/products",
      "timeout": 5000,
      "retries": 3
    }
  ],
  "tests": [
    {
      "name": "Product Creation and Retrieval",
      "description": "Test the full lifecycle of product management",
      "steps": [
        {
          "name": "Create Product",
          "action": "POST",
          "service": "product-service",
          "endpoint": "/",
          "headers": {
            "Authorization": "Bearer ${API_KEY}",
            "Content-Type": "application/json"
          },
          "payload": {
            "name": "Test Product",
            "price": 99.99,
            "category": "electronics"
          },
          "expect": {
            "status": 201,
            "body": {
              "id": "string",
              "name": "Test Product"
            }
          },
          "extract": {
            "productId": "body.id"
          }
        },
        {
          "name": "Retrieve Product",
          "action": "GET",
          "service": "product-service",
          "endpoint": "/${productId}",
          "expect": {
            "status": 200,
            "body": {
              "id": "${productId}",
              "name": "Test Product"
            }
          }
        }
      ]
    }
  ]
}
```

## Commands

| Command | Description |
|---------|-------------|
| `npm run test` | Run all integration tests |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Run tests with coverage report |
| `npm run lint` | Run code linting |
| `npm run format` | Format code using Prettier |
| `npm run build` | Build the project |
| `npm run start` | Start the test runner in interactive mode |

## Project Structure

```
integ/
├── src/                    # Source code
│   ├── core/              # Core framework code
│   ├── plugins/           # Plugin implementations
│   ├── reporters/         # Test reporters
│   └── utils/             # Utility functions
├── tests/                 # Example integration tests
├── docs/                  # Documentation
├── config/                # Configuration templates
├── scripts/               # Build and utility scripts
├── package.json          # Project dependencies
└── README.md             # This file
```

## Contributing

We welcome contributions from the community! Here's how you can help:

### Getting Started

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes and commit them: `git commit -m 'Add some amazing feature'`
4. Push to your branch: `git push origin feature/amazing-feature`
5. Submit a pull request

### Development Setup

```bash
# Clone your fork
git clone https://github.com/your-username/integ.git

# Install dependencies
npm install

# Run tests to ensure everything works
npm test

# Start development mode
npm run dev
```

### Code Style

- We use ESLint and Prettier for code formatting
- Run `npm run lint` to check for style issues
- Run `npm run format` to automatically format your code
- Follow the existing code patterns and conventions

### Reporting Bugs

If you find a bug, please create an issue with:

- A clear description of the problem
- Steps to reproduce the issue
- Expected vs actual behavior
- Your environment details (OS, Node.js version, etc.)

### Feature Requests

For new features:

- Check if a similar feature request already exists
- Provide a clear description of the feature
- Explain the use case and benefits
- Consider submitting a pull request if you can implement it

## Documentation

- [API Reference](docs/api.md) - Detailed API documentation
- [Plugin Development](docs/plugins.md) - How to create custom plugins
- [Configuration Guide](docs/configuration.md) - Complete configuration options
- [Examples](docs/examples.md) - Real-world usage examples
- [Troubleshooting](docs/troubleshooting.md) - Common issues and solutions

## Roadmap

- [ ] GraphQL integration support
- [ ] WebSocket testing capabilities
- [ ] Performance testing features
- [ ] Cloud deployment templates
- [ ] Integration with popular CI/CD platforms
- [ ] Real-time test monitoring dashboard
- [ ] Advanced mocking and stubbing

## Community

- [Discord Server](https://discord.gg/integ) - Join our community chat
- [Discussions](https://github.com/dampbrownshoes/integ/discussions) - GitHub discussions
- [Stack Overflow](https://stackoverflow.com/questions/tagged/integ-framework) - Ask questions with the `integ-framework` tag

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Thanks to all contributors who have helped make this project better
- Inspired by modern testing frameworks and integration tools
- Built with ❤️ by the open-source community

---

**Made with ❤️ by [dampbrownshoes](https://github.com/dampbrownshoes)**

*If you find this project useful, please consider giving it a ⭐ on GitHub!*