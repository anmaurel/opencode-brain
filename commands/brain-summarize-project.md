---
description: Summarize a source project into docs/wiki and index it
agent: build
---

Analyze a project, create/update concise `docs/wiki/`, then index with Brain RAG. Arguments: path or `repo=<name> <path>`.

```text
$ARGUMENTS
```

Workflow:

1. Check `brain_status`; resolve project path/repo.
2. Inspect structure, skipping generated/vendor/binary/secrets (`.git`, `node_modules`, `dist`, `.env*`, keys, credentials, etc.). Prefer grep/glob; read only key files.
3. Create/update focused wiki notes. Baseline: `architecture/project-context.md`, optional `codemap.md`, `commands.md`, `api/*`, `gotchas.md`, `features/todo.md`, `decisions/log-YYYY-MM-DD.md`.
4. Do not store secrets/raw `.env`; use repo-relative paths.
5. Ingest `<project>/docs/wiki/`; verify with `brain_status` and hybrid `brain_search`.

Final: wiki files changed, index action, verification, skipped folders.
