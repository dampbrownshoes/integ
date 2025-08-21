#!/bin/bash

# List issues in the issue tracking system
# Usage: ./list_issues.sh [open|closed|all]

set -e

# Default to showing all issues if no argument provided
FILTER="${1:-all}"

# Function to display help
show_help() {
    echo "Usage: $0 [open|closed|all]"
    echo ""
    echo "Options:"
    echo "  open    - Show only open issues"
    echo "  closed  - Show only closed issues" 
    echo "  all     - Show all issues (default)"
    echo ""
    echo "Examples:"
    echo "  $0"
    echo "  $0 open"
    echo "  $0 closed"
}

# Function to list issues from a directory
list_issues_in_dir() {
    local dir="$1"
    local status="$2"
    
    if [ ! -d "$dir" ]; then
        return 0
    fi
    
    local count=0
    for file in "$dir"/*.md; do
        if [ -f "$file" ]; then
            count=$((count + 1))
            local basename=$(basename "$file" .md)
            local title=$(head -n 1 "$file" | sed 's/^# //')
            local created=$(grep "^\*\*Created:\*\*" "$file" | sed 's/.*Created:\*\* *//')
            
            echo "[$status] $basename"
            echo "  📝 $title"
            echo "  📅 $created"
            echo ""
        fi
    done 2>/dev/null
}

# Function to count issues in a directory
count_issues_in_dir() {
    local dir="$1"
    
    if [ ! -d "$dir" ]; then
        echo 0
        return
    fi
    
    local count=0
    for file in "$dir"/*.md; do
        if [ -f "$file" ]; then
            count=$((count + 1))
        fi
    done 2>/dev/null
    echo $count
}

# Check for help flag
if [ "$FILTER" = "-h" ] || [ "$FILTER" = "--help" ]; then
    show_help
    exit 0
fi

# Validate filter option
if [ "$FILTER" != "open" ] && [ "$FILTER" != "closed" ] && [ "$FILTER" != "all" ]; then
    echo "❌ Invalid option: $FILTER"
    echo ""
    show_help
    exit 1
fi

echo "🗂️  Issue Tracker"
echo "=================="
echo ""

total_count=0

# List issues based on filter
case "$FILTER" in
    "open")
        echo "📂 Open Issues:"
        echo ""
        list_issues_in_dir "issues/open" "OPEN"
        total_count=$(count_issues_in_dir "issues/open")
        ;;
    "closed")
        echo "📂 Closed Issues:"
        echo ""
        list_issues_in_dir "issues/closed" "CLOSED"
        total_count=$(count_issues_in_dir "issues/closed")
        ;;
    "all")
        echo "📂 Open Issues:"
        echo ""
        list_issues_in_dir "issues/open" "OPEN"
        open_count=$(count_issues_in_dir "issues/open")
        
        echo "📂 Closed Issues:"
        echo ""
        list_issues_in_dir "issues/closed" "CLOSED"
        closed_count=$(count_issues_in_dir "issues/closed")
        
        total_count=$((open_count + closed_count))
        ;;
esac

# Show summary
echo "📊 Total issues displayed: $total_count"

if [ $total_count -eq 0 ]; then
    echo ""
    echo "💡 No issues found. Create your first issue with:"
    echo "   ./create_issue.sh \"Your issue title\" \"Your issue description\""
fi