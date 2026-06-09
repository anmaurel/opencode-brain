---
name: cross-repo-analysis
description: Analyze changes in another repo to adapt the current project. Use when the user asks to look at a back-end or external repo branch/ticket and adapt the front-end (or vice versa).
metadata:
  audience: developers
  workflow: cross-repo-synchronization
---

# Cross-Repo Analysis

Use when the user references a branch, ticket, or change in another repository and asks to adapt the current project accordingly.

## Workflow

1. **Locate the target repo** — use `ls ~/Projects/<known-name>` or `ls ~/` with a grep on the known repo name. Never `find` or list all directories.
2. **Identify relevant commits** — `git log --oneline --grep="<ticket>" --all` to find matching commits. Use `--stat` only.
3. **Extract interface contracts only** — read only types, DTOs, API schemas, endpoint signatures, and enum values. Skip implementation internals (service logic, algorithms, DB queries).
4. **Diff strategy** — `git show <sha> --stat` first. Then `git show <sha> -- <specific-file-path>` only for files containing contracts or types relevant to the front-end adaptation. Never diff full commits blindly.
5. **Map changes to current project** — identify which front-end types, services, or components consume the changed contracts. Use `grep` to find usages in the current project.
6. **Plan then implement** — list affected files, propose changes, implement.

## Token Efficiency Rules

- After an edit: trust the edit tool confirmation. Do not re-read the file to verify.
- Read files with `offset`/`limit` on the zone of interest. Never read entire files when line numbers are known.
- Summarize back-end changes in a compact table instead of pasting diffs verbatim.
- Batch independent searches (grep/glob) in a single message.

Report: changed files, verification, residual risks.
