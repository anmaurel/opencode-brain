---
name: brain-memory
description: Create, update, search, and maintain Brain memory for repos, durable prompts, decisions, logs, and TODOs
metadata:
  audience: opencode-users
  workflow: memory
---

# Brain Memory

Use this when a task involves durable context, repo memory, long-lived prompts/specs, decisions, past work, or Brain RAG quality.

## What I do

- Detect the active repo/project and check for existing Brain context.
- Bootstrap concise repo docs for new projects.
- Save or propose saving durable prompts/specs.
- Update `LOG.md` and `TODO.md` after meaningful work.
- Search Brain RAG before relying on chat-only memory.
- Keep memory safe for public repos and free of secrets.

## Workflow

1. Infer the repo name and local path when doing repo-specific work.
2. Check `$BRAIN_ROOT/Repos/<repo>/CONTEXT.md` and read it if present.
3. If context is missing for a non-trivial repo task, create or propose a bootstrap:
   - `CONTEXT.md`
   - `ARCHITECTURE.md`
   - `CODEMAP.md`
   - `COMMANDS.md`
   - `TODO.md`
   - `LOG.md`
4. Use `brain_search` / `brain_search_context` for broad, ambiguous, historical, or exact-identifier queries.
5. For durable prompts/specs, ask before saving unless the user explicitly requested persistence.
6. After meaningful work, append concise facts to `LOG.md` and update `TODO.md` only for actionable follow-ups.
7. Reindex only when Brain docs were written or edited.

## Durable prompt handling

Save durable prompts under:

```txt
$BRAIN_ROOT/Prompts/<kebab-case-slug>.md
```

Or, when clearly repo-specific:

```txt
$BRAIN_ROOT/Repos/<repo>/PROMPTS.md
```

Include title, date, source context, and the prompt/spec. Do not save casual chat by default.

## Write policy

Auto-update allowed:

- `Daily/YYYY-MM-DD.md`
- `Repos/*/LOG.md`
- `Repos/*/TODO.md`
- new repo bootstrap docs for the active project

Ask before modifying:

- global `CONTEXT.md`
- `AGENTS.md`
- existing stable `Repos/*/CONTEXT.md`
- `Repos/*/DECISIONS.md`

## Secrets policy

Never store passwords, tokens, private keys, raw `.env` values, API keys, OAuth/client secrets, SSH keys, or database credentials.

When config depends on secrets, describe it generically, for example:

```md
Requires GitHub App credentials via environment variables.
```

## Concurrency

Subagents should return notes or proposed snippets. The primary session should serialize Brain writes.
