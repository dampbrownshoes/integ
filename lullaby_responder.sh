#!/bin/bash

# Lullaby Responder - A gentle system that responds in soothing lullaby format
# Usage: ./lullaby_responder.sh "your message"

respond_in_lullaby() {
    local input="$1"
    
    # Lullaby phrases and gentle words
    local lullaby_starters=(
        "🌙 Hush now, little one,"
        "✨ Sleep tight, dear heart,"
        "🎵 Dream sweetly now,"
        "🌟 Close your eyes and listen,"
        "💤 Softly, gently,"
    )
    
    local lullaby_endings=(
        "... and drift away to peaceful dreams 🌙"
        "... as the stars watch over you ✨"
        "... while angels sing you to sleep 👼"
        "... in the gentle embrace of night 🌃"
        "... until morning light returns 🌅"
    )
    
    # Select random starter and ending
    local starter=${lullaby_starters[$((RANDOM % ${#lullaby_starters[@]}))]}
    local ending=${lullaby_endings[$((RANDOM % ${#lullaby_endings[@]}))]}
    
    # Convert input to gentle, lullaby-style response
    local gentle_response
    if [[ -z "$input" ]]; then
        gentle_response="all is well in this quiet moment"
    else
        # Transform harsh words to gentle ones
        gentle_response=$(echo "$input" | sed -e 's/error/gentle whisper/gi' \
                                             -e 's/bug/little butterfly/gi' \
                                             -e 's/problem/puzzle to solve/gi' \
                                             -e 's/issue/quiet concern/gi' \
                                             -e 's/fail/learning moment/gi' \
                                             -e 's/crash/unexpected rest/gi' \
                                             -e 's/urgent/needs gentle care/gi')
    fi
    
    echo "$starter $gentle_response $ending"
}

# Main function
main() {
    if [[ $# -eq 0 ]]; then
        echo "🎵 Welcome to the Lullaby Responder 🎵"
        echo "Usage: $0 \"your message\""
        echo "Example: $0 \"There's a bug in the system\""
        echo ""
        respond_in_lullaby "Welcome to peaceful responses"
    else
        respond_in_lullaby "$*"
    fi
}

# Run the script
main "$@"