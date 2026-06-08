---
description: Ingest documentation into the project wiki and index it in Brain RAG
agent: brain
---

Ingest `$ARGUMENTS` into `<project>/docs/wiki/`, then index with Brain RAG.

Rules: no person names, no Jira/ticket IDs, no secrets/raw env values; use repo-relative paths.

Steps:
1. Resolve project path/repo. Read `_Index.md`; if no wiki, stop and suggest `/brain-sync`.
2. Source: URL fetch, file read, or ask for pasted content.
3. Extract subject, concepts, API/data shapes, code impact, open questions.
4. Classify path/template: `api/`, `features/`, `architecture/`, or `decisions/adr-<NNN>-<slug>.md`.
5. Create/update concise note; add concept stubs only when valuable.
6. Quick grep for related code and add "Impact codebase".
7. Update `_Index.md`, ingest `<project>/docs/wiki/`, verify with hybrid `brain_search`.

Report changed files, 3-5 findings, open questions, and RAG status.
