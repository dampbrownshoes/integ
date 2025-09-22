#!/bin/bash
# Lullaby Response System
# A gentle way to respond to issues and concerns

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PYTHON_SCRIPT="$SCRIPT_DIR/lullaby_responder.py"

# Function to display help
show_help() {
    echo "🌙 Lullaby Response System 🌙"
    echo ""
    echo "Usage:"
    echo "  $0 [text...]                 Generate a lullaby response to text"
    echo "  $0 --issue [issue text...]   Generate a lullaby response to an issue"
    echo "  $0 --help                    Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 \"user reported bug\""
    echo "  $0 --issue \"application crashes\" \"need urgent fix\""
    echo ""
    echo "This system provides soothing, lullaby-style responses to any input. 💤"
}

# Check if help is requested
if [[ "$1" == "--help" || "$1" == "-h" ]]; then
    show_help
    exit 0
fi

# Check if Python script exists
if [[ ! -f "$PYTHON_SCRIPT" ]]; then
    echo "Error: lullaby_responder.py not found in $SCRIPT_DIR"
    exit 1
fi

# Check if no arguments provided
if [[ $# -eq 0 ]]; then
    echo "🌙 Welcome to the Lullaby Response System 🌙"
    echo ""
    python3 "$PYTHON_SCRIPT" "gentle visitor"
    echo ""
    echo "Use --help for more options."
    exit 0
fi

# Pass all arguments to the Python script
python3 "$PYTHON_SCRIPT" "$@"