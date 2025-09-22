#!/usr/bin/env python3
"""
Lullaby Responder - A simple system to generate lullaby-style responses
"""

import random
import sys
import argparse


class LullabyResponder:
    """Generate soothing, lullaby-style responses to any input"""
    
    def __init__(self):
        self.lullaby_patterns = [
            "Sleep tight, {topic}, dream of stars so bright",
            "Hush now {topic}, let the moonbeams dance",
            "Close your eyes, {topic}, and drift away",
            "Gentle {topic}, rest your weary head",
            "Sweet dreams, {topic}, on clouds of white",
            "Softly now, {topic}, the night is here",
            "Peace be with you, {topic}, until morning light",
            "Slumber deep, {topic}, where angels sing",
            "Quiet now, {topic}, let sleepy time begin",
            "Rest now, {topic}, in dreams so sweet"
        ]
        
        self.lullaby_endings = [
            "La la la, la la la...",
            "Hmm hmm hmm, hmm hmm hmm...",
            "Sleep now, sleep now...",
            "Dream sweet dreams...",
            "Until the morning comes...",
            "While the stars watch over you...",
            "In the land of sleepy dreams...",
            "Where peaceful slumber waits..."
        ]
    
    def generate_lullaby_response(self, input_text="little one"):
        """Generate a lullaby-style response for any input"""
        # Clean and prepare the topic
        topic = input_text.strip() if input_text.strip() else "little one"
        
        # Select random lullaby pattern and ending
        pattern = random.choice(self.lullaby_patterns)
        ending = random.choice(self.lullaby_endings)
        
        # Format the response
        lullaby = pattern.format(topic=topic)
        
        return f"🌙 {lullaby}\n   {ending} 🌟"
    
    def respond_to_issue(self, issue_title, issue_description=""):
        """Generate a lullaby response to an issue or problem"""
        topic = issue_title.lower().replace("bug", "little bug").replace("error", "little error")
        response = self.generate_lullaby_response(topic)
        
        lullaby_solution = [
            "🎵 Lullaby Response System 🎵",
            "",
            response,
            "",
            "This gentle response acknowledges your concern with soothing words.",
            "Sometimes the best solutions come when we approach problems peacefully. 💤"
        ]
        
        return "\n".join(lullaby_solution)


def main():
    parser = argparse.ArgumentParser(description="Generate lullaby-style responses")
    parser.add_argument("input", nargs="*", help="Input text to respond to")
    parser.add_argument("--issue", action="store_true", help="Treat input as an issue to resolve")
    
    args = parser.parse_args()
    
    responder = LullabyResponder()
    
    if args.input:
        input_text = " ".join(args.input)
    else:
        input_text = "gentle soul"
    
    if args.issue:
        print(responder.respond_to_issue(input_text))
    else:
        print(responder.generate_lullaby_response(input_text))


if __name__ == "__main__":
    main()