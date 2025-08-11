# Issues

This directory contains the issue tracking system for this repository.

## Structure

- `open/` - Contains open issues
- `closed/` - Contains closed issues
- `templates/` - Contains issue templates

## Creating a New Issue

Use the `create_issue.sh` script to create a new issue:

```bash
./create_issue.sh "Issue title" "Issue description"
```

## Issue Format

Each issue is stored as a markdown file with the following format:

```markdown
# Issue Title

**Status:** Open/Closed
**Created:** YYYY-MM-DD
**ID:** issue-YYYYMMDD-HHMMSS

## Description

Issue description here

## Comments

- YYYY-MM-DD: Comment text
```