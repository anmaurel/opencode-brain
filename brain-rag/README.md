# Brain RAG MCP

Local MCP server exposing semantic search over a Brain vault, defaulting to `~/brain`.

## Stack

- LM Studio embeddings: `http://localhost:1234/v1/embeddings`
- Default embedding model: `text-embedding-baai-bge-m3-568m`
- Qdrant: `http://localhost:6333`
- Collection: `brain_chunks`
- Runtime: Bun (`bun` on `PATH`)

## Tools

- `brain_status` — check Qdrant/config; use `deep: true` to test embeddings.
- `brain_reindex` — index Markdown files from the Brain vault.
- `brain_ingest_path` — ingest one Markdown/PDF/text file or a directory.
- `brain_ingest_url` — fetch, clean, chunk, embed, and store a web page.
- `brain_search` — compact semantic/keyword/hybrid search in Qdrant.
- `brain_search_context` — compact search plus neighboring chunks.

## Code-repo mode

For repo work, prefer structured wiki docs in `<project>/docs/wiki/` over indexing all raw source. The index stores project-oriented metadata when available:

- `repo`, `relative_path`, `folder`
- `doc_type` (`context`, `architecture`, `codemap`, `decisions`, `log`, `todo`, `apis`, `commands`, `gotchas`, etc.)
- `heading_path`, `language`, `tags`, `word_count`

Use hybrid mode for exact identifiers, filenames, commands, globals, and API names:

```json
{ "query": "GPWindowMgr gpAjax", "repo": "grepo", "mode": "hybrid" }
```

Search results are compact by default. Use `max_chars` to control text length or `include_text: false` for metadata-only discovery:

```json
{ "query": "build command", "repo": "grepo", "mode": "hybrid", "limit": 5, "max_chars": 600 }
{ "query": "build command", "repo": "grepo", "include_text": false }
```

Use context search when a single chunk is too small:

```json
{ "query": "custom build command", "repo": "grepo", "neighbors": 1 }
```

## Automation

Configured through OpenCode environment variables:

- `BRAIN_RAG_REINDEX_ON_STARTUP=false` — optionally reindex once when the MCP server starts.
- `BRAIN_RAG_ROOT=~/brain` — Brain vault path. If omitted, the server uses `~/brain`.
- `BRAIN_RAG_WATCH=true` — watch the Brain vault and debounce Markdown/text/PDF changes.
- `BRAIN_RAG_WATCH_DEBOUNCE_MS=10000` — wait 10s after a file change before reindexing.
- `BRAIN_RAG_REINDEX_INTERVAL_MS=0` — periodic full reindex disabled by default.
- `BRAIN_RAG_CHUNK_WORDS=320`, `BRAIN_RAG_CHUNK_OVERLAP=50` — chunk sizing.
- `BRAIN_RAG_SEARCH_LIMIT=5`, `BRAIN_RAG_CONTEXT_LIMIT=3`, `BRAIN_RAG_RESULT_LIMIT_CAP=20` — result count defaults/cap.
- `BRAIN_RAG_SEARCH_MAX_CHARS=900`, `BRAIN_RAG_CONTEXT_MAX_CHARS=700`, `BRAIN_RAG_RESULT_MAX_CHARS_CAP=5000` — returned text caps.
- `BRAIN_RAG_ALLOWED_PATHS=<path-list>` — optional path-delimited external allowlist; otherwise external ingestion is limited to `docs/wiki` paths.

Use `brain_status` to see watcher status and the last reindex result.

## Requirements

- Bun >= 1.3.
- LM Studio server running with an embedding model.
- Qdrant running locally, for example:

```bash
docker compose -f ~/.config/opencode/brain-rag/docker-compose.yml up -d
```

Qdrant UI/API will be available at:

- REST API: `http://localhost:6333`
- gRPC: `localhost:6334`

Stop it with:

```bash
docker compose -f ~/.config/opencode/brain-rag/docker-compose.yml down
```

PDF ingestion requires `pdftotext` installed locally.
