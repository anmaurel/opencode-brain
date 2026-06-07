---
name: git-release
description: Create consistent git releases and changelogs from merged PRs
metadata:
  audience: maintainers
  workflow: github
---

## What I do

- Analyze commits since the last tag
- Draft release notes grouped by type (features, fixes, breaking changes)
- Propose a version bump following semver
- Provide a copy-pasteable `gh release create` command

## When to use me

Use this when you are preparing a tagged release. Ask clarifying questions if the target versioning scheme is unclear.

## Workflow

1. Run `git log <last-tag>..HEAD --oneline` to list changes
2. Categorize commits: feat, fix, breaking, chore, docs, refactor
3. Determine version bump: patch (fixes), minor (features), major (breaking)
4. Generate changelog in keep-a-changelog format
5. Output the `gh release create` command with the notes
