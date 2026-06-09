# Brain Context

Fresh Brain vault for OpenCode agents.

## Purpose

Store durable, non-secret context across sessions.

## Layout

- `AGENTS.md` — agent operating rules.
- `Prompts/` — durable prompts/specs.
- `RAG/` — local RAG setup notes.

Project-specific context lives in each project's version-controlled `docs/wiki/` directory.

## Active Projects

Add active projects here when explicitly requested:

```md
- `<project-name>` — wiki: `<project-path>/docs/wiki/`
```

## RAG Stack

- Embeddings: local OpenAI-compatible endpoint, usually LM Studio.
- Vector DB: Qdrant local Docker container.
- Access: OpenCode MCP tools `brain_fs` and `brain_rag`.
