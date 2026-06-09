---
name: fresh-laptop-setup
description: Install and validate this portable OpenCode plus Brain RAG setup on a fresh macOS laptop
metadata:
  audience: opencode-users
  workflow: setup
---

# Fresh Laptop Setup

Use to install/validate this OpenCode + Brain RAG config on macOS.

Prereqs: OpenCode, Bun >= 1.3, Docker/runtime, LM Studio embeddings server.

Standard install:
```bash
git clone <repo-public-url> ~/.config/opencode
cd ~/.config/opencode
bun install
bun run bootstrap
```

If cloned elsewhere: set `OPENCODE_CONFIG_DIR=/absolute/path/to/opencode-config`. Manual fallback: `bun install`, `bun run bootstrap-env`, `bun run render-config`, `bun run bootstrap-brain`, `docker compose -f brain/rag/docker-compose.yml up -d`, `bun run doctor`; edit `.env`, rerender, restart OpenCode.

Validate: local ignored `opencode.json`/`.env`, Brain root with `CONTEXT.md`, `AGENTS.md`, `Prompts/`, `RAG/`, Qdrant and LM Studio endpoints OK, Brain tools/commands visible.

Common fixes: install Bun, start Docker/LM Studio, set config path, rerun render after `.env` edits. Bootstrap should not overwrite existing `.env` values or Brain files; skipped existing files are expected.

Rules: do not copy personal Brain contents, commit generated `opencode.json`, or store secrets in git-intended config.
