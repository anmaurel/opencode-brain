---
name: fresh-laptop-setup
description: Install and validate this portable OpenCode plus Brain RAG setup on a fresh macOS laptop
metadata:
  audience: opencode-users
  workflow: setup
---

# Fresh Laptop Setup

Use this when installing or validating this OpenCode configuration on a new macOS laptop.

## What I do

- Bootstrap the versioned OpenCode config from a public repo.
- Create local `.env` from `.env.example` without overwriting existing values.
- Generate local `opencode.json` from `opencode.example.json`.
- Create a fresh Brain vault from `brain-template/` without overwriting existing files.
- Start/validate Qdrant and LM Studio embeddings.
- Run diagnostics and explain next steps.

## Prerequisites

- macOS.
- OpenCode installed.
- Bun >= 1.3 installed.
- Docker Desktop or compatible Docker runtime installed.
- LM Studio installed with an OpenAI-compatible embeddings server.

## Standard install

```bash
git clone <repo-public-url> ~/.config/opencode
cd ~/.config/opencode
bun install
bun run bootstrap
```

If the repo is cloned somewhere else, set:

```bash
export OPENCODE_CONFIG_DIR="/absolute/path/to/opencode-config"
```

## Manual steps

If bootstrap fails, run steps independently:

```bash
bun install
bun run bootstrap-env
bun run render-config
bun run bootstrap-brain
docker compose -f brain-rag/docker-compose.yml up -d
bun run doctor
```

Then edit `.env` if needed, rerun `bun run render-config`, start LM Studio with an embedding model, usually `text-embedding-bge-m3`, and restart OpenCode.

## Validation

Expected checks:

- `opencode.json` exists locally and is ignored by git.
- `.env` exists locally and is ignored by git; `.env.example` is versioned.
- `${BRAIN_ROOT:-$HOME/brain}` exists and contains `CONTEXT.md`, `AGENTS.md`, `Repos/`, `Prompts/`, `Daily/`, and `RAG/`.
- Qdrant responds on `http://localhost:6333`.
- LM Studio embeddings respond on `http://localhost:1234/v1/embeddings`.
- OpenCode exposes Brain tools and slash commands.

## Common fixes

- Missing Bun: install Bun, then rerun `bun run doctor`.
- Docker not running: start Docker Desktop, then rerun Qdrant compose.
- LM Studio warning: start the LM Studio server and load the embedding model.
- Wrong config path: set `OPENCODE_CONFIG_DIR` and rerun `bun run render-config`.
- Changed `.env`: rerun `bun run render-config`, then restart OpenCode.
- Existing Brain files skipped: expected; bootstrap never overwrites existing files by default.

## Rules

- Do not copy personal Brain contents into the public config repo.
- Do not commit generated `opencode.json`.
- Do not store secrets in `.env` or config files intended for git.
