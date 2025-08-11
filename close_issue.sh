#!/bin/bash

# close_issue.sh - Script to close an issue
# Usage: ./close_issue.sh "issue-id"

set -e

if [ $# -lt 1 ]; then
    echo "Usage: $0 \"issue-id\""
    echo "Example: $0 \"issue-20250811-152104\""
    echo ""
    echo "To see available issues, run: ./list_issues.sh open"
    exit 1
fi

ISSUE_ID="$1"

# Find the issue file in open directory
ISSUE_FILE=$(find issues/open -name "*${ISSUE_ID}*" -type f | head -1)

if [ -z "$ISSUE_FILE" ]; then
    echo "❌ Error: Issue with ID '$ISSUE_ID' not found in open issues."
    echo ""
    echo "Available open issues:"
    ./list_issues.sh open
    exit 1
fi

# Get the filename
FILENAME=$(basename "$ISSUE_FILE")

# Move to closed directory and update status
CLOSED_FILE="issues/closed/$FILENAME"

# Update the status in the file
sed 's/\*\*Status:\*\* Open/\*\*Status:\*\* Closed/' "$ISSUE_FILE" > "$CLOSED_FILE"

# Add closure comment
echo "" >> "$CLOSED_FILE"
echo "- $(date +"%Y-%m-%d"): Issue closed" >> "$CLOSED_FILE"

# Remove from open directory
rm "$ISSUE_FILE"

echo "✅ Issue closed successfully!"
echo "📁 Moved from: $ISSUE_FILE"
echo "📁 Moved to: $CLOSED_FILE"
echo "🆔 ID: $ISSUE_ID"