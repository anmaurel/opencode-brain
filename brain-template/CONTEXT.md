# Brain Context

Fresh Brain vault for OpenCode agents.

## Purpose

Store durable, non-secret context across sessions.

## Layout

- `AGENTS.md` — agent operating rules.
- `Daily/` — dated session logs.
- `Repos/` — repo-specific memory.
- `Prompts/` — durable prompts/specs.
- `RAG/` — local RAG setup notes.

## Active Repos

Add active repos here when explicitly requested:

```md
- `<repo>` — local path: `<path>`
```

## RAG Stack

- Embeddings: local OpenAI-compatible endpoint, usually LM Studio.
- Vector DB: Qdrant local Docker container.
- Access: OpenCode MCP tools `brain_fs` and `brain_rag`.
