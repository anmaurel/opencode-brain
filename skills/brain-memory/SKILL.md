---
name: brain-memory
description: Use Brain/RAG and project wiki memory safely and sparingly
metadata:
  audience: opencode-users
  workflow: memory
---

# Brain Memory

Use only for durable context, project wiki memory, past decisions/prompts, or when RAG avoids reading several source files. Skip for trivial edits/questions.

## Workflow

1. Infer project path/repo. If useful, read `<project>/docs/wiki/_Index.md` and focused wiki notes.
2. For missing non-trivial context, scaffold concise `docs/wiki/` (`_Index.md`, `Templates/`, `features/`, `architecture/`, `api/`, `decisions/`).
3. Use `brain_search(_context)` for broad, ambiguous, historical, or exact-identifier lookup.
4. Save durable prompts only after explicit request/confirmation under `$BRAIN_ROOT/Prompts/<slug>.md` or `$BRAIN_ROOT/Prompts/<repo>-<slug>.md`.
5. After meaningful work, update project wiki/follow-ups only when useful; reindex only if Brain/wiki docs changed.

## Safety

- Never store secrets, raw `.env`, tokens, keys, passwords, credentials, or personal data.
- Use repo-relative paths in versioned wiki docs by default.
- Ask before modifying global `CONTEXT.md`, `AGENTS.md`, or stable wiki notes.
- Primary session serializes Brain/wiki writes; subagents return snippets/findings only.
