---
description: Sync current repo or durable prompt into Brain and index it
agent: build
---

Sync durable context into the Brain so future sessions and Brain RAG can retrieve it.

Arguments can be empty, a project path, `repo=<name> <path>`, or `prompt=<title>` followed by durable prompt/spec text:

```text
$ARGUMENTS
```

Workflow:

1. Call `brain_status` first and report if LM Studio/Qdrant/watcher are not OK.
2. Determine sync type:
   - Empty args or path/repo args: repo/project sync.
   - `prompt=<title>` or clearly non-path long text: durable prompt/spec sync.
3. Repo/project sync:
   - Resolve the project path; if empty, use current working directory.
   - Infer repo name from `repo=<name>` or nearest project root.
   - If syncing a subfolder of a larger repo, prefer a focused doc under the larger repo Brain folder instead of creating a separate repo.
   - If the inferred name matches an existing Brain repo whose `CONTEXT.md` points to a different local path/origin, stop and ask for `repo=<unique-name>`.
   - Inspect source structure while skipping `.git`, `node_modules`, `dist`, `build`, `.cache`, `coverage`, archives, binary/media assets, `.env*`, `*.key`, `*.pem`, `*.p12`, `id_rsa*`, `.aws/`, `.gcloud/`, `.netrc`, `*.keystore`, and anything clearly secret/credential/token-related.
   - Prefer glob/grep first; read at most ~15 key files or ~100 KB unless the user asks for deeper indexing.
   - For new repos, create `$BRAIN_ROOT/Repos/<repo>/CONTEXT.md`, `ARCHITECTURE.md`, `CODEMAP.md`, `COMMANDS.md`, `TODO.md`, and `LOG.md`.
   - For existing repos, auto-update only `LOG.md`, `TODO.md`, and focused feature docs unless the user explicitly asked to refresh stable docs.
   - Add `APIs.md` and `GOTCHAS.md` when useful.
   - Never store raw `.env` values, tokens, private keys, passwords, or secrets.
   - Index the repo folder with `brain_ingest_path` or `brain_reindex({ repo })`.
   - Verify with `brain_search({ repo, mode: "hybrid" })` using a query based on the project name and stack.
4. Durable prompt/spec sync:
   - Ask for confirmation before saving unless the user explicitly requested persistence.
   - Save under `$BRAIN_ROOT/Prompts/<slug>.md` with title, date, source context, and the prompt/spec text. Use kebab-case slugs, optionally prefixed with `YYYY-MM-DD-`; do not use an empty slug.
   - If it belongs to a repo, prefer `$BRAIN_ROOT/Repos/<repo>/PROMPTS.md` or a focused repo doc.
   - Index the saved file/folder and verify with `brain_search`.
5. Do not edit global `$BRAIN_ROOT/CONTEXT.md` unless the user explicitly requested it. If Active Repos is missing the repo, include the exact suggested entry in the final response.

Final response: synced files, index action, verification result, and any skipped paths or confirmation needed.
