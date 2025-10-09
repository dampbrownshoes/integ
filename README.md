# integ

A simple CLI application for managing subscriptions and greetings.

## Features

- **Greetings**: Get friendly greetings with hello, hey, and yo commands
- **Subscribe**: Subscribe users with email addresses
- **Subscribe List**: View all subscribed users
- **Sign In**: Sign in with a username

## Usage

### Greetings

```bash
python3 app.py hello
# Output: Hello there!

python3 app.py hey
# Output: Hey! How can I help you?

python3 app.py yo
# Output: Yo! What's up?
```

### Subscribe

Subscribe a new email address:

```bash
python3 app.py subscribe user@example.com
# Output: user@example.com has been successfully subscribed!
```

### Subscribe List

View all subscribed users:

```bash
python3 app.py subscribe list
# Output: 
# Subscribers:
# 1. user@example.com
```

### Sign In

Sign in with a username:

```bash
python3 app.py signin john
# Output: Welcome back, john! You are now signed in.
```

## Testing

Run the test suite:

```bash
python3 -m unittest test_app.py -v
```

## Requirements

- Python 3.x