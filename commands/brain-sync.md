---
description: Sync project wiki or durable prompt into Brain RAG
agent: brain
---

Sync durable context. Arguments: empty/current project, path, `repo=<name> <path>`, or `prompt=<title>` plus prompt/spec text.

```text
$ARGUMENTS
```

Workflow:

1. Check `brain_status`.
2. Prompt/spec mode: ask confirmation unless explicit; save to `$BRAIN_ROOT/Prompts/<slug>.md` or `$BRAIN_ROOT/Prompts/<repo>-<slug>.md`; ingest and verify.
3. Project mode: resolve path/repo; inspect only key files, skipping generated/vendor/secrets; scaffold `docs/wiki/` if missing; write/update concise `architecture/project-context.md` and focused notes.
4. Never store secrets or raw `.env`; use repo-relative paths in wiki docs.
5. Ingest `<project>/docs/wiki/` with `brain_ingest_path`; verify with hybrid `brain_search`.

Final: files changed, index action, verification, skipped paths/confirmation.
