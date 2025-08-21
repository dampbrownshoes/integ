#!/bin/bash

# Close an issue by moving it from open to closed
# Usage: ./close_issue.sh "issue-YYYYMMDD-HHMMSS"

set -e

# Check if issue ID is provided
if [ $# -lt 1 ]; then
    echo "❌ Usage: $0 \"issue-YYYYMMDD-HHMMSS\""
    echo ""
    echo "Examples:"
    echo "  $0 \"issue-20250821-143000\""
    echo ""
    echo "💡 To list open issues and find the ID, run:"
    echo "  ./list_issues.sh open"
    exit 1
fi

ISSUE_ID="$1"
OPEN_FILE="issues/open/$ISSUE_ID.md"
CLOSED_FILE="issues/closed/$ISSUE_ID.md"

# Check if the open issue file exists
if [ ! -f "$OPEN_FILE" ]; then
    echo "❌ Issue not found: $ISSUE_ID"
    echo ""
    echo "📝 Available open issues:"
    ./list_issues.sh open
    exit 1
fi

# Ensure the closed directory exists
mkdir -p "issues/closed"

# Read the issue content
CONTENT=$(cat "$OPEN_FILE")

# Update the status in the content
UPDATED_CONTENT=$(echo "$CONTENT" | sed 's/\*\*Status:\*\* Open/\*\*Status:\*\* Closed/')

# Add closure information
CLOSED_DATE=$(date +"%Y-%m-%d")
UPDATED_CONTENT=$(echo "$UPDATED_CONTENT" | sed "/\*\*Created:\*\*/a\\*\*Closed:\*\* $CLOSED_DATE")

# Write the updated content to the closed directory
echo "$UPDATED_CONTENT" > "$CLOSED_FILE"

# Remove the file from the open directory
rm "$OPEN_FILE"

echo "✅ Issue closed successfully!"
echo "🆔 ID: $ISSUE_ID"
echo "📅 Closed: $CLOSED_DATE"
echo "📁 Moved to: $CLOSED_FILE"
echo ""
echo "💡 To view closed issues: ./list_issues.sh closed"
echo "💡 To view all issues: ./list_issues.sh"