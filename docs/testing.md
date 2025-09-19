# Integration Testing Guide

## Overview

This document provides guidance on integration testing practices demonstrated in this project.

## Test Structure

The project uses a simple test runner that validates the core functionality:

- Function behavior validation
- Input/output verification
- Error handling

## Running Tests

```bash
npm test
```

## Adding New Tests

1. Create test functions in `tests/test.js`
2. Use the `test()` helper function
3. Use `assertEqual()` for simple assertions

## Best Practices

- Keep tests simple and focused
- Test one behavior per test case
- Use descriptive test names
- Validate both success and failure cases