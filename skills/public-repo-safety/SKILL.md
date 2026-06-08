---
name: public-repo-safety
description: Audit files before publishing a public repository to prevent secrets, private paths, and personal memory leaks
metadata:
  audience: developers
  workflow: security
---

# Public Repo Safety

Use before committing, pushing, or publishing public repos, especially config/agent/Brain/automation repos.

Check:
- `git status --short`, intended tracked files, `.gitignore`, and sensitive history (`git log --all -- <file>`).
- Leaks: `.env*`, raw env dumps, API/OAuth/GitHub/Slack/AWS/Google tokens, passwords, private/SSH keys, personal Brain contents, client data, Qdrant/model/cache/logs, `.DS_Store`, machine-specific absolute paths.
- Generated/local files such as `opencode.json` and ignored lock/runtime artifacts.

Remediate: ignore untracked sensitive files, unstage staged leaks, rotate/rewrite history for committed secrets, replace private paths with `$HOME`/placeholders.

Rules: never print full secret values; report leak class + file path; do not commit/push unless explicitly requested.
