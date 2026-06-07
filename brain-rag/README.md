# Brain RAG MCP

Local MCP server exposing semantic search over a Brain vault, defaulting to `~/brain`.

## Stack

- LM Studio embeddings: `http://localhost:1234/v1/embeddings`
- Default embedding model: `text-embedding-bge-m3`
- Qdrant: `http://localhost:6333`
- Collection: `brain_chunks`
- Runtime: Bun (`bun` on `PATH`)

## Tools

- `brain_status` — check LM Studio/Qdrant connectivity and collection state.
- `brain_reindex` — index Markdown files from the Brain vault.
- `brain_ingest_path` — ingest one Markdown/PDF/text file or a directory.
- `brain_ingest_url` — fetch, clean, chunk, embed, and store a web page.
- `brain_search` — semantic search in Qdrant.
- `brain_search_context` — search and include neighboring chunks from the same source.

## Code-repo mode

For repo work, prefer structured Brain docs in `~/brain/Repos/<repo>/` over indexing all raw source. The index stores repo-oriented metadata when available:

- `repo`, `relative_path`, `folder`
- `doc_type` (`context`, `architecture`, `codemap`, `decisions`, `log`, `todo`, `apis`, `commands`, `gotchas`, etc.)
- `heading_path`, `language`, `tags`, `word_count`

Use hybrid mode for exact identifiers, filenames, commands, globals, and API names:

```json
{ "query": "GPWindowMgr gpAjax", "repo": "grepo", "mode": "hybrid" }
```

Use context search when a single chunk is too small:

```json
{ "query": "custom build command", "repo": "grepo", "neighbors": 1 }
```

## Automation

Configured through OpenCode environment variables:

- `BRAIN_RAG_REINDEX_ON_STARTUP=true` — reindex once when the MCP server starts.
- `BRAIN_RAG_ROOT=~/brain` — Brain vault path. If omitted, the server uses `~/brain`.
- `BRAIN_RAG_WATCH=true` — watch the Brain vault and debounce Markdown/text/PDF changes.
- `BRAIN_RAG_WATCH_DEBOUNCE_MS=10000` — wait 10s after a file change before reindexing.
- `BRAIN_RAG_REINDEX_INTERVAL_MS=1800000` — periodic full reindex every 30 minutes.

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
