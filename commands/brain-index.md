---
description: Index Brain project docs or URLs
agent: brain
---

Index the requested documentation into the Brain RAG without delegating to subagents.

Arguments:

```text
$ARGUMENTS
```

Behavior:

- Before reindex/ingest, call `brain_status({ deep: true })`; use lightweight `brain_status` only for read-only status checks.
- If `$ARGUMENTS` is empty, reindex the Brain vault with `brain_reindex`.
- If `$ARGUMENTS` is a URL, ingest it with `brain_ingest_url`. Use the URL as title unless a title is clearly provided.
- If `$ARGUMENTS` is a file or directory path, ingest it with `brain_ingest_path`.
- If `$ARGUMENTS` looks like a repo name, reindex that repo with `brain_reindex` using the repo filter.
- After indexing, call `brain_status` again and summarize indexed files/chunks or any errors.

Keep the answer concise and include the exact tool/action used.
