#!/bin/bash

# integrate_lullaby_notifications.sh - Integration script for lullaby email notifications
# This script can be called by other systems to send gentle notifications

set -e

SCRIPT_DIR="$(dirname "$0")"
EMAIL_SCRIPT="$SCRIPT_DIR/send_lullaby_email.sh"

# Function to send issue created notification
notify_issue_created() {
    local title="$1"
    local id="$2"
    local description="$3"
    local recipient="$4"
    local created_date="${5:-$(date +%Y-%m-%d)}"
    
    echo "🌙 Sending gentle issue creation notification..."
    "$EMAIL_SCRIPT" issue_created "$recipient" \
        "ISSUE_TITLE=$title" \
        "ISSUE_ID=$id" \
        "ISSUE_DESCRIPTION=$description" \
        "CREATED_DATE=$created_date"
}

# Function to send issue closed notification  
notify_issue_closed() {
    local title="$1"
    local id="$2"
    local recipient="$3"
    local closed_date="${4:-$(date +%Y-%m-%d)}"
    local resolution_time="${5:-peaceful and swift}"
    
    echo "🌙 Sending gentle issue closure notification..."
    "$EMAIL_SCRIPT" issue_closed "$recipient" \
        "ISSUE_TITLE=$title" \
        "ISSUE_ID=$id" \
        "CLOSED_DATE=$closed_date" \
        "RESOLUTION_TIME=$resolution_time"
}

# Function to send system update notification
notify_system_update() {
    local update_type="$1"
    local details="$2"
    local recipient="$3"
    local update_date="${4:-$(date +%Y-%m-%d)}"
    
    echo "🌙 Sending gentle system update notification..."
    "$EMAIL_SCRIPT" system_update "$recipient" \
        "UPDATE_TYPE=$update_type" \
        "UPDATE_DETAILS=$details" \
        "UPDATE_DATE=$update_date"
}

# Function to send welcome notification
notify_new_user() {
    local recipient="$1"
    local user_role="$2"
    local welcome_date="${3:-$(date +%Y-%m-%d)}"
    
    echo "🌙 Sending gentle welcome notification..."
    "$EMAIL_SCRIPT" new_user "$recipient" \
        "USER_ROLE=$user_role" \
        "WELCOME_DATE=$welcome_date"
}

# Example usage function
show_examples() {
    cat << EOF
🌙 Lullaby Notification Integration Examples 🌙

Issue Created:
  $0 issue_created "Sweet Dreams Bug" "issue-001" "A gentle bug description" "dev@example.com" "2025-09-08"

Issue Closed:
  $0 issue_closed "Sweet Dreams Bug" "issue-001" "dev@example.com" "2025-09-08" "2 peaceful hours"

System Update:
  $0 system_update "Gentle Enhancement" "Peaceful UI improvements" "team@example.com" "2025-09-08"

New User Welcome:
  $0 new_user "newdev@example.com" "Peaceful Developer" "2025-09-08"

🌟 May your integrations be seamless and your notifications peaceful 🌟
EOF
}

# Main function
case "$1" in
    "issue_created")
        notify_issue_created "$2" "$3" "$4" "$5" "$6"
        ;;
    "issue_closed")
        notify_issue_closed "$2" "$3" "$4" "$5" "$6"
        ;;
    "system_update")
        notify_system_update "$2" "$3" "$4" "$5"
        ;;
    "new_user")
        notify_new_user "$2" "$3" "$4"
        ;;
    "examples"|"--examples")
        show_examples
        ;;
    *)
        echo "🌙 Lullaby Integration Script 🌙"
        echo ""
        echo "Usage: $0 <notification_type> [parameters...]"
        echo ""
        echo "Notification Types:"
        echo "  issue_created <title> <id> <description> <recipient> [date]"
        echo "  issue_closed <title> <id> <recipient> [date] [resolution_time]"
        echo "  system_update <type> <details> <recipient> [date]"
        echo "  new_user <recipient> <role> [date]"
        echo ""
        echo "Use '$0 examples' for detailed examples"
        echo ""
        echo "🌟 May your notifications bring gentle understanding 🌟"
        exit 1
        ;;
esac