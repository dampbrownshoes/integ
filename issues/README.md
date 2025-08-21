# Issues

*Rock-a-bye issues, in the repo so neat,  
When the wind blows, your tracking's complete.*

This directory contains the issue tracking system for this repository, where all your concerns can rest peacefully.

## Structure

*Sleep tight little issues, safe in your folders:*

- `open/` - Contains open issues, still awake and waiting
- `closed/` - Contains closed issues, now fast asleep  
- `templates/` - Contains issue templates, dreams of future problems

## Creating a New Issue

*Hush now, don't cry, we'll make an issue by and by:*

Use the `create_issue.sh` script to create a new issue:

```bash
./create_issue.sh "Issue title" "Issue description"
```

## Listing Issues

*Count the issues like counting sheep:*

```bash
./list_issues.sh        # List all issues
./list_issues.sh open   # List only open issues  
./list_issues.sh closed # List only closed issues
```

## Closing Issues

*Time to sleep, little issue, your work here is done:*

```bash
./close_issue.sh "issue-YYYYMMDD-HHMMSS"
```

## Issue Format

Each issue sleeps peacefully in its markdown file with the following gentle format:

```markdown
# Issue Title

**Status:** Open/Closed
**Created:** YYYY-MM-DD
**ID:** issue-YYYYMMDD-HHMMSS

## Description
*Your issue description here, soft as a whisper*

## Comments
*Additional thoughts, quiet as moonlight*
```

*Sweet dreams, little issues. May your bugs be few and your solutions swift.*