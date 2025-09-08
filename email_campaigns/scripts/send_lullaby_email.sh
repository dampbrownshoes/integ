#!/bin/bash

# send_lullaby_email.sh - Script to send gentle, lullaby-themed campaign emails
# Usage: ./send_lullaby_email.sh <template_type> <recipient_email> [template_variables...]

set -e

# Configuration
SCRIPT_DIR="$(dirname "$0")"
TEMPLATES_DIR="$SCRIPT_DIR/../templates"
SENT_LOG_DIR="$SCRIPT_DIR/../sent"
CONFIG_FILE="$SCRIPT_DIR/email_config.conf"

# Ensure sent log directory exists
mkdir -p "$SENT_LOG_DIR"

# Function to display help
show_help() {
    cat << EOF
🌙 Lullaby Email Campaign System 🌙

Usage: $0 <template_type> <recipient_email> [variables...]

Template Types:
  issue_created   - Gentle notification when a new issue is created
  issue_closed    - Soothing message when an issue is resolved  
  system_update   - Peaceful notification of system changes
  new_user        - Warm welcome for new users

Variables (passed as KEY=VALUE):
  ISSUE_TITLE=     Issue title
  ISSUE_ID=        Issue identifier
  ISSUE_DESCRIPTION= Issue description
  CREATED_DATE=    Date created
  CLOSED_DATE=     Date closed
  RESOLUTION_TIME= Time to resolve
  UPDATE_TYPE=     Type of update
  UPDATE_DATE=     Date of update
  UPDATE_DETAILS=  Update details
  WELCOME_DATE=    Welcome date
  USER_ROLE=       User role

Examples:
  $0 issue_created user@example.com ISSUE_TITLE="Sweet Dreams Bug" ISSUE_ID="issue-001" CREATED_DATE="2025-09-08"
  
  $0 issue_closed user@example.com ISSUE_TITLE="Peaceful Fix" ISSUE_ID="issue-001" CLOSED_DATE="2025-09-08"

  $0 new_user newuser@example.com WELCOME_DATE="2025-09-08" USER_ROLE="Developer"

🌟 May your notifications bring peace and gentle understanding 🌟
EOF
}

# Function to log sent emails
log_email() {
    local template_type="$1"
    local recipient="$2"
    local timestamp=$(date "+%Y-%m-%d %H:%M:%S")
    local log_file="$SENT_LOG_DIR/email_log.txt"
    
    echo "[$timestamp] LULLABY_EMAIL: $template_type -> $recipient" >> "$log_file"
}

# Function to replace template variables
replace_variables() {
    local template_file="$1"
    local output_file="$2"
    shift 2
    
    # Copy template to output file
    cp "$template_file" "$output_file"
    
    # Process each variable
    for var in "$@"; do
        if [[ "$var" == *"="* ]]; then
            local key="${var%%=*}"
            local value="${var#*=}"
            # Replace {{KEY}} with value in the file
            sed -i "s|{{$key}}|$value|g" "$output_file"
        fi
    done
    
    # Replace any remaining template variables with gentle defaults
    sed -i 's/{{ISSUE_TITLE}}/Peaceful Resolution Needed/g' "$output_file"
    sed -i 's/{{ISSUE_ID}}/gentle-issue/g' "$output_file"
    sed -i 's/{{ISSUE_DESCRIPTION}}/A gentle matter requiring your caring attention/g' "$output_file"
    sed -i 's/{{CREATED_DATE}}/today/g' "$output_file"
    sed -i 's/{{CLOSED_DATE}}/today/g' "$output_file"
    sed -i 's/{{RESOLUTION_TIME}}/swift and peaceful/g' "$output_file"
    sed -i 's/{{UPDATE_TYPE}}/Gentle Enhancement/g' "$output_file"
    sed -i 's/{{UPDATE_DATE}}/today/g' "$output_file"
    sed -i 's/{{UPDATE_DETAILS}}/Peaceful improvements to enhance your experience/g' "$output_file"
    sed -i 's/{{WELCOME_DATE}}/today/g' "$output_file"
    sed -i 's/{{USER_ROLE}}/Peaceful Contributor/g' "$output_file"
}

# Function to send email (simulation - logs instead of actual sending)
send_email() {
    local template_type="$1"
    local recipient="$2"
    local processed_file="$3"
    
    echo "🌙 Sending gentle lullaby email..."
    echo "   Template: $template_type"
    echo "   Recipient: $recipient"
    echo "   Content: $(wc -l < "$processed_file") lines of soothing content"
    
    # In a real implementation, this would integrate with an email service
    # For now, we'll save the processed email and log it
    local sent_file="$SENT_LOG_DIR/$(date +%Y%m%d_%H%M%S)_${template_type}_$(echo "$recipient" | sed 's/@/_at_/g').html"
    cp "$processed_file" "$sent_file"
    
    log_email "$template_type" "$recipient"
    
    echo "   📧 Email gently delivered to dreams..."
    echo "   💤 Saved as: $sent_file"
    echo ""
    echo "🌟 May this message bring peace and understanding 🌟"
}

# Main function
main() {
    if [ $# -lt 2 ]; then
        show_help
        exit 1
    fi
    
    local template_type="$1"
    local recipient="$2"
    shift 2
    
    # Determine template file path
    local template_file=""
    case "$template_type" in
        "issue_created")
            template_file="$TEMPLATES_DIR/notifications/issue_created.html"
            ;;
        "issue_closed")
            template_file="$TEMPLATES_DIR/notifications/issue_closed.html"
            ;;
        "system_update")
            template_file="$TEMPLATES_DIR/updates/system_update.html"
            ;;
        "new_user")
            template_file="$TEMPLATES_DIR/welcome/new_user.html"
            ;;
        *)
            echo "❌ Unknown template type: $template_type"
            echo "💤 Use --help for gentle guidance"
            exit 1
            ;;
    esac
    
    # Check if template exists
    if [ ! -f "$template_file" ]; then
        echo "❌ Template file not found: $template_file"
        echo "💤 Please ensure the template sleeps peacefully in the correct location"
        exit 1
    fi
    
    # Create temporary processed file
    local temp_file="/tmp/lullaby_email_$(date +%Y%m%d_%H%M%S).html"
    
    # Process template with variables
    replace_variables "$template_file" "$temp_file" "$@"
    
    # Send the email
    send_email "$template_type" "$recipient" "$temp_file"
    
    # Clean up
    rm -f "$temp_file"
}

# Handle help flag
if [[ "$1" == "--help" || "$1" == "-h" ]]; then
    show_help
    exit 0
fi

# Run main function
main "$@"