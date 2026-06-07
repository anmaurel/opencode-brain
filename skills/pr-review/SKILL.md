---
name: pr-review
description: Review a GitHub pull request thoroughly before merge
metadata:
  audience: developers
  workflow: github
---

## What I do

- Fetch the PR diff using `gh pr diff`
- Analyze changes for bugs, security issues, and best practices
- Check that tests exist for new code
- Verify the PR description matches the actual changes
- Post a structured review comment

## When to use me

Use this when you need to review a PR. Provide the PR number or URL.

## Workflow

1. Run `gh pr view <number>` to get the PR description and metadata
2. Run `gh pr diff <number>` to get the full diff
3. Review for: correctness, security, performance, style consistency
4. Check for missing tests or documentation
5. Summarize findings with severity levels
