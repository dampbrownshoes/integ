#!/bin/bash

# Create a new issue in the issue tracking system
# Usage: ./create_issue.sh "Title" "Description"

set -e

# Check if the required arguments are provided
if [ $# -lt 2 ]; then
    echo "Usage: $0 \"Issue Title\" \"Issue Description\""
    echo "Example: $0 \"Fix login bug\" \"Users cannot login with valid credentials\""
    exit 1
fi

# Get arguments
TITLE="$1"
DESCRIPTION="$2"

# Generate unique ID based on current timestamp
TIMESTAMP=$(date +"%Y%m%d-%H%M%S")
ISSUE_ID="issue-$TIMESTAMP"
DATE=$(date +"%Y-%m-%d")

# Create the issue file in the open directory
ISSUE_FILE="issues/open/$ISSUE_ID.md"

# Ensure the open directory exists
mkdir -p "issues/open"

# Create the issue file
cat > "$ISSUE_FILE" << EOF
# $TITLE

**Status:** Open
**Created:** $DATE
**ID:** $ISSUE_ID

## Description
$DESCRIPTION

## Comments
*Additional thoughts and updates will be recorded here*
EOF

echo "✨ Issue created successfully!"
echo "📁 File: $ISSUE_FILE"
echo "🆔 ID: $ISSUE_ID"
echo "📅 Created: $DATE"
echo ""
echo "To view: cat $ISSUE_FILE"
echo "To list all issues: ./list_issues.sh"
echo "To close this issue: ./close_issue.sh $ISSUE_ID"