# integ

A peaceful integration repository with gentle email campaign capabilities.

## 🌙 Email Campaign Lullaby System

This repository includes a unique email notification system that sends gentle, lullaby-themed messages for various system events. All communications are crafted with peaceful language and soothing design to create a calming experience.

### Quick Start

**Send a gentle issue notification:**
```bash
./email_campaigns/scripts/send_lullaby_email.sh issue_created user@example.com \
  ISSUE_TITLE="Sweet Dreams Bug" \
  ISSUE_ID="issue-001" \
  CREATED_DATE="2025-09-08"
```

**Welcome a new user with peaceful words:**
```bash
./email_campaigns/scripts/send_lullaby_email.sh new_user newuser@example.com \
  WELCOME_DATE="2025-09-08" \
  USER_ROLE="Peaceful Developer"
```

### Features

- 🌸 **Lullaby-themed Templates**: Gentle, rhythmic language in all notifications
- 🎨 **Beautiful Design**: Soft colors, peaceful gradients, and comforting typography  
- 📧 **Multiple Template Types**: Issue notifications, system updates, welcome messages
- 🔧 **Variable Substitution**: Dynamic content with graceful defaults
- 📊 **Delivery Logging**: Peaceful tracking of sent notifications
- ⚙️ **Configurable**: Gentle rate limiting and personalization options

### Template Types

- **issue_created** - Gentle notification when a new issue is created
- **issue_closed** - Soothing message when an issue is resolved
- **system_update** - Peaceful notification of system changes  
- **new_user** - Warm welcome for new users

For complete documentation, see [`email_campaigns/README.md`](email_campaigns/README.md).

---

*"May your notifications bring peace, and your communications foster gentle understanding."*

🌟 Sweet dreams from your Integration System ✨