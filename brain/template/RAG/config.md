# Local RAG Configuration

## Default Stack

- Brain vault: `~/brain`
- Embeddings endpoint: `http://localhost:1234/v1/embeddings`
- Default model: `text-embedding-bge-m3`
- Qdrant: `http://localhost:6333`
- Collection: `brain_chunks`

## Startup

1. Start Qdrant.
2. Start LM Studio with an embedding model.
3. Start OpenCode.
4. Run `brain_status`.
5. Run `brain_reindex` or `/brain-index`.

## Notes

- Store structured Markdown in Brain.
- Do not index raw secrets.
- Prefer repo summaries over raw source dumps.
