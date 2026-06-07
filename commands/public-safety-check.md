---
description: Run public repository safety checks before commit or push
agent: security-auditor
---

Run the public repo safety workflow for this OpenCode config repo.

Workflow:

1. Run `bun run public-safety-check` from the repo root.
2. If it fails, report blockers without printing secret values.
3. Check `git status --short` and summarize candidate files.
4. Do not commit or push unless the user explicitly asks.

Final response: safety result, blockers if any, and next safe action.
