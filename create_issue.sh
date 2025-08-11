#!/bin/bash

# create_issue.sh - Script to create a new issue
# Usage: ./create_issue.sh "Issue title" "Issue description"

set -e

# Check if required arguments are provided
if [ $# -lt 2 ]; then
    echo "Usage: $0 \"Issue title\" \"Issue description\""
    echo "Example: $0 \"Fix login bug\" \"Users cannot login with valid credentials\""
    exit 1
fi

TITLE="$1"
DESCRIPTION="$2"

# Generate issue ID with timestamp
TIMESTAMP=$(date +"%Y%m%d-%H%M%S")
ISSUE_ID="issue-${TIMESTAMP}"
DATE=$(date +"%Y-%m-%d")

# Create filename from title (sanitize for filesystem)
FILENAME=$(echo "$TITLE" | sed 's/[^a-zA-Z0-9 ]//g' | sed 's/ /_/g' | tr '[:upper:]' '[:lower:]')
FILENAME="${ISSUE_ID}-${FILENAME}.md"

# Path to the new issue file
ISSUE_PATH="issues/open/${FILENAME}"

# Check if template exists
TEMPLATE_PATH="issues/templates/issue_template.md"
if [ ! -f "$TEMPLATE_PATH" ]; then
    echo "Error: Template file not found at $TEMPLATE_PATH"
    exit 1
fi

# Create issue from template
sed -e "s/{{DATE}}/$DATE/g" \
    -e "s/{{ISSUE_ID}}/$ISSUE_ID/g" \
    -e "s/{{DESCRIPTION}}/$DESCRIPTION/g" \
    -e "s/# Issue Title/# $TITLE/g" \
    "$TEMPLATE_PATH" > "$ISSUE_PATH"

echo "✅ Issue created successfully!"
echo "📁 File: $ISSUE_PATH"
echo "🆔 ID: $ISSUE_ID"
echo "📝 Title: $TITLE"
echo ""
echo "You can view the issue by running:"
echo "cat \"$ISSUE_PATH\""