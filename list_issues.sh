#!/bin/bash

# list_issues.sh - Script to list all issues
# Usage: ./list_issues.sh [open|closed|all]

STATUS="${1:-all}"

echo "📋 Issues Report"
echo "=================="

list_issues_in_dir() {
    local dir="$1"
    local status="$2"
    
    if [ -d "$dir" ] && [ "$(ls -A "$dir" 2>/dev/null)" ]; then
        echo ""
        echo "🔍 $status Issues:"
        echo "-------------------"
        for issue_file in "$dir"/*.md; do
            if [ -f "$issue_file" ]; then
                # Extract title (first line starting with #)
                title=$(grep "^# " "$issue_file" | head -1 | sed 's/^# //')
                # Extract ID
                id=$(grep "^\*\*ID:\*\*" "$issue_file" | sed 's/\*\*ID:\*\* //')
                # Extract date
                date=$(grep "^\*\*Created:\*\*" "$issue_file" | sed 's/\*\*Created:\*\* //')
                
                printf "  • %-20s | %s | %s\n" "$id" "$date" "$title"
            fi
        done
    else
        echo ""
        echo "🔍 $status Issues:"
        echo "-------------------"
        echo "  No $status issues found."
    fi
}

case "$STATUS" in
    "open")
        list_issues_in_dir "issues/open" "Open"
        ;;
    "closed")
        list_issues_in_dir "issues/closed" "Closed"
        ;;
    "all"|*)
        list_issues_in_dir "issues/open" "Open"
        list_issues_in_dir "issues/closed" "Closed"
        ;;
esac

echo ""