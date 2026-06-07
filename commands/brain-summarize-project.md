---
description: Summarize a source project into Brain docs and index it
agent: build
---

Analyze a source/project subdirectory, create or update concise Brain repo documentation, then index it with Brain RAG.

Arguments can be either a path, or `repo=<brain-repo-name> <path>`:

```text
$ARGUMENTS
```

Workflow:

1. Call `brain_status` first and report if LM Studio, Qdrant, or watcher are not OK.
2. Resolve the project path from `$ARGUMENTS`. If empty, use the current working directory.
3. Inspect the project structure without reading generated/vendor folders.
4. Ignore at minimum: `.git`, `node_modules`, `dist`, `build`, `.cache`, `coverage`, `__MACOSX`, archives, images, audio, video, binary assets, `.env*`, `*.key`, `*.pem`, `*.p12`, `id_rsa*`, `.aws/`, `.gcloud/`, `.netrc`, `*.keystore`, and anything clearly secret/credential/token-related.
5. Read key files such as README/docs, package/config files, entrypoints, source modules, routes, game logic, UI/components, state/store, tests, and scripts. Prefer glob/grep first; read at most ~15 key files or ~100 KB unless the user asks for deeper indexing.
6. Determine the Brain repo name:
   - If arguments include `repo=<name>`, use that exact existing Brain repo folder.
   - Otherwise infer from the nearest project folder.
   - If the path is a subfolder of a larger project, prefer the larger project name when obvious.
   - If the inferred name matches an existing Brain repo whose `CONTEXT.md` points to a different local path/origin, stop and ask for `repo=<unique-name>`.
7. Create or update Brain docs under:

   ```text
   $BRAIN_ROOT/Repos/<repo-name>/
   ```

   Required baseline files for a new repo. For existing repos, auto-update only `LOG.md`, `TODO.md`, and focused feature docs unless the user explicitly asked to refresh stable docs. For subfolders/features, prefer a dedicated doc named after the analyzed folder instead of treating it as a separate project:

   - `CONTEXT.md` — stable project summary, stack, purpose, run/build/test commands.
   - `ARCHITECTURE.md` — modules, data flow, entrypoints, important files.
   - `CODEMAP.md` — concise source tree map and file responsibilities.
   - `COMMANDS.md` — local/dev/build/test/deploy commands.
   - `APIs.md` — only when the project exposes APIs, routes, CLIs, events, or external integrations.
   - `GOTCHAS.md` — only when non-obvious constraints or pitfalls are found.
   - `TODO.md` — current follow-ups; create even if it only says no known follow-ups.
   - `LOG.md` — append a short dated indexing/summarization note.
   - `<SUBFOLDER>.md` — focused doc for the analyzed subfolder when it belongs to an existing repo.

8. Do not store secrets or raw `.env` values. Mention secret-dependent config generically.
9. Do not edit global `$BRAIN_ROOT/CONTEXT.md` unless the user explicitly requested it; include the suggested Active Repos entry in the final response.
10. Index the generated Brain repo folder with `brain_ingest_path` or `brain_reindex`.
11. Verify with `brain_status` and a small `brain_search` query for the repo in hybrid mode.

Final response: changed Brain files, indexing action used, verification result, suggested global context entry if not written, and any skipped folders.
