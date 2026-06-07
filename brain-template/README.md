# Brain Template

Safe empty Brain vault template for fresh macOS installs.

This folder is copied to `${BRAIN_ROOT:-$HOME/brain}` by:

```bash
bun run bootstrap-brain
```

The bootstrap script creates missing files and directories only. It does not overwrite existing Brain files.

This template contains generic operating rules and RAG notes only. It must not contain personal memory, client data, secrets, raw `.env` values, or machine-specific paths.

## Contents

- `AGENTS.md` — generic agent memory rules.
- `CONTEXT.md` — fresh vault overview.
- `Daily/` — dated session logs.
- `Prompts/` — durable prompts/specs.
- `Repos/` — repo-specific memory.
- `RAG/` — local RAG setup notes and TODOs.

## After bootstrap

Start Qdrant and LM Studio, then in OpenCode run:

```text
/brain-index
/brain-sync
```
