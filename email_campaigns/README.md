# 🌙 Email Campaign Lullaby System 🌙

A gentle and soothing email notification system that sends lullaby-themed messages for various system events.

## Overview

This system transforms traditional system notifications into peaceful, lullaby-themed emails that provide information in a gentle, caring manner. Each email is crafted with soft language, soothing colors, and peaceful imagery to create a calming experience for recipients.

## Features

- **Lullaby-themed Templates**: All emails use gentle, rhythmic language reminiscent of lullabies
- **Beautiful HTML Design**: Soft colors, peaceful gradients, and comforting typography
- **Multiple Template Types**: Different templates for various system events
- **Variable Substitution**: Dynamic content insertion with graceful defaults
- **Delivery Logging**: Peaceful tracking of sent notifications
- **Configurable Settings**: Gentle rate limiting and personalization options

## Template Types

### 🌸 Issue Notifications
- **issue_created.html** - Gentle notification when a new issue is created
- **issue_closed.html** - Soothing message when an issue is resolved

### 🌺 System Updates
- **system_update.html** - Peaceful notification of system changes

### 🌼 Welcome Messages
- **new_user.html** - Warm welcome for new users

## Directory Structure

```
email_campaigns/
├── templates/
│   ├── notifications/          # Issue and system notifications
│   │   ├── issue_created.html
│   │   └── issue_closed.html
│   ├── updates/               # System update notifications
│   │   └── system_update.html
│   └── welcome/               # Welcome messages
│       └── new_user.html
├── scripts/
│   ├── send_lullaby_email.sh  # Main sending script
│   └── email_config.conf      # Configuration file
└── sent/                      # Log of sent emails
    └── email_log.txt
```

## Usage

### Basic Usage

```bash
./email_campaigns/scripts/send_lullaby_email.sh <template_type> <recipient_email> [variables...]
```

### Examples

**Send issue creation notification:**
```bash
./email_campaigns/scripts/send_lullaby_email.sh issue_created developer@example.com \
  ISSUE_TITLE="Sweet Dreams Bug Fix" \
  ISSUE_ID="issue-20250908-001" \
  CREATED_DATE="2025-09-08" \
  ISSUE_DESCRIPTION="A gentle bug that needs peaceful resolution"
```

**Send issue closure notification:**
```bash
./email_campaigns/scripts/send_lullaby_email.sh issue_closed developer@example.com \
  ISSUE_TITLE="Peaceful Resolution Complete" \
  ISSUE_ID="issue-20250908-001" \
  CLOSED_DATE="2025-09-08" \
  RESOLUTION_TIME="2 peaceful hours"
```

**Send welcome message:**
```bash
./email_campaigns/scripts/send_lullaby_email.sh new_user newuser@example.com \
  WELCOME_DATE="2025-09-08" \
  USER_ROLE="Peaceful Developer"
```

**Send system update notification:**
```bash
./email_campaigns/scripts/send_lullaby_email.sh system_update team@example.com \
  UPDATE_TYPE="Gentle Enhancement" \
  UPDATE_DATE="2025-09-08" \
  UPDATE_DETAILS="Peaceful improvements to the user interface"
```

## Template Variables

All templates support variable substitution using the format `{{VARIABLE_NAME}}`. Common variables include:

- `ISSUE_TITLE` - Title of the issue
- `ISSUE_ID` - Unique issue identifier
- `ISSUE_DESCRIPTION` - Description of the issue
- `CREATED_DATE` - Date when created
- `CLOSED_DATE` - Date when closed
- `RESOLUTION_TIME` - Time taken to resolve
- `UPDATE_TYPE` - Type of system update
- `UPDATE_DATE` - Date of the update
- `UPDATE_DETAILS` - Details about the update
- `WELCOME_DATE` - Date of welcome
- `USER_ROLE` - Role of the user

If variables are not provided, gentle default values are used.

## Design Philosophy

The lullaby email system is designed around principles of:

- **Gentleness**: All language is soft and caring
- **Peace**: Visual design promotes calm and tranquility
- **Comfort**: Messages provide reassurance and support
- **Beauty**: Aesthetic design enhances the peaceful experience
- **Clarity**: Information is presented clearly within the gentle theme

## Configuration

Edit `email_campaigns/scripts/email_config.conf` to customize:

- Email service settings
- Rate limiting
- Default values
- Personalization options

## Integration

This system can be integrated with:

- Issue tracking systems
- CI/CD pipelines
- User management systems
- Monitoring tools
- Any system requiring gentle notifications

## Future Enhancements

- Integration with actual email services (SMTP, SendGrid, etc.)
- Multi-language lullaby support
- Time-of-day aware messaging
- User preference management
- Mobile-optimized templates
- Calendar integration for peaceful scheduling

---

*"May your notifications bring peace, and your communications foster gentle understanding."*

🌙 Sweet dreams from the Integration System ✨