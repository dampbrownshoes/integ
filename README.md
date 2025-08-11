# integ

A simple integration repository with built-in issue tracking functionality.

## Issue Management

This repository includes a simple file-based issue tracking system.

### Creating Issues

To create a new issue:

```bash
./create_issue.sh "Issue title" "Issue description"
```

Example:
```bash
./create_issue.sh "Fix login bug" "Users cannot login with valid credentials"
```

### Listing Issues

To view all issues:
```bash
./list_issues.sh
```

To view only open issues:
```bash
./list_issues.sh open
```

To view only closed issues:
```bash
./list_issues.sh closed
```

### Closing Issues

To close an issue:
```bash
./close_issue.sh "issue-id"
```

Example:
```bash
./close_issue.sh "issue-20250811-152104"
```

## Issue Structure

Issues are stored as markdown files in the `issues/` directory:
- `issues/open/` - Contains open issues
- `issues/closed/` - Contains closed issues
- `issues/templates/` - Contains issue templates

Each issue contains:
- Title and unique ID
- Creation date and status
- Description
- Comments section for updates