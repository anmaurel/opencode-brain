# OpenCode configuration

Portable OpenCode configuration with local Brain RAG/MCP support for macOS.

## Files

- `opencode.example.json` is the portable template used to generate local `opencode.json`.
- `opencode.json` is intentionally ignored because it contains machine-local expanded paths.
- `brain/rag/` contains the local MCP server for semantic search over the Brain vault.
- `brain/template/` contains a safe empty Brain vault template for fresh machines.
- `agents/`, `commands/`, `prompts/`, and `skills/` contain OpenCode customizations.
- `scripts/` contains bootstrap, config render, and doctor scripts.

## Included skills

- `brain-memory` — maintain project wiki memory, durable prompts, follow-ups, and RAG usage.
- `fresh-laptop-setup` — install and validate this config on a new macOS laptop.
- `public-repo-safety` — audit before publishing a public repo.
- `customize-opencode` — edit OpenCode config, agents, skills, plugins, MCP, and permissions.
- `debug-investigation` — debug from reproduction to verified fix.
- `pr-review` — review GitHub pull requests before merge.
- `refactor` — execute safe behavior-preserving refactors.
- `git-release` — prepare releases and changelogs.

## Install from zero on macOS

```bash
git clone <repo-public-url> ~/.config/opencode
cd ~/.config/opencode
bun install
bun run bootstrap
```

`bun run bootstrap` creates local `.env` if missing, renders local config, creates a fresh Brain vault from `brain/template/` without overwriting existing files, starts Qdrant, and runs diagnostics.

Clone to `~/.config/opencode` by default. If you clone elsewhere, set `OPENCODE_CONFIG_DIR` to that absolute path before rendering config.

## Manual requirements

- Install OpenCode.
- Install Bun >= 1.3.
- Install Docker Desktop or a compatible Docker runtime.
- Install/start LM Studio.
- Load an embedding model compatible with the OpenAI embeddings API, default `text-embedding-bge-m3`.

## Config generation

This repo uses `.env.example` as portable defaults. Local `.env` is ignored by git and is used only to render `opencode.json`.

```bash
bun run bootstrap-env
# edit .env if needed
bun run render-config
```

After editing `.env`, rerun `bun run render-config` and restart OpenCode.

### Manual render

```bash
bun run render-config
```

This generates ignored local `opencode.json` from `opencode.example.json`, `.env`, `.env.local`, and shell environment variables.

Optional environment variables:

```bash
export BRAIN_ROOT="$HOME/brain"
export OPENCODE_CONFIG_DIR="$HOME/.config/opencode"

# Model tiers used in opencode.example.json
export OPENCODE_MODEL_DEFAULT="anthropic/claude-sonnet-4-6"
export OPENCODE_MODEL_SMALL="anthropic/claude-haiku-4-5-20251001"
export OPENCODE_MODEL_HUGE="anthropic/claude-opus-4-7"
```

Shell environment variables override `.env` values during rendering.

`OPENCODE_MODEL_DEFAULT` is used for the top-level `model` and every agent. `OPENCODE_MODEL_SMALL` is used for `small_model`. `OPENCODE_MODEL_HUGE` is defined for ad-hoc overrides (e.g. point a specific agent at it in your local `opencode.example.json`).

When new variables are added to `.env.example`, copy them into your local `.env` manually (the bootstrap script does not merge), then rerun `bun run render-config`.

Manual fallback if rendering fails:

```bash
cp opencode.example.json opencode.json
# edit opencode.json paths manually for your machine
```

## Config modes

Three env presets are versioned alongside `.env.example` to switch between provider/model setups:

| File | Purpose |
|------|---------|
| `.env.work` | Anthropic via local proxy, with `opencode-with-claude` plugin |
| `.env.perso-high` | High-tier models (direct API) |
| `.env.perso-low` | Budget-tier models (direct API) |

Switch with:

```bash
bun run switch <work|perso-high|perso-low>
```

This copies `.env.<mode>` → `.env` and runs `render-config` automatically. Restart OpenCode to apply.

To create a custom mode, copy an existing preset and adjust values:

```bash
cp .env.work .env.my-mode
# edit .env.my-mode, then:
bun run switch my-mode
```

Custom `.env.*` files are ignored by git (only `.env.work`, `.env.perso-high`, `.env.perso-low` are versioned).

## Fresh Brain bootstrap

This repo includes `brain/template/`, a safe empty Brain vault template. It creates generic Brain structure only; it does not include personal memory.

```bash
bun run bootstrap-brain
```

The script copies missing files into `${BRAIN_ROOT:-$HOME/brain}` and never overwrites existing Brain files by default.

## Brain RAG services

Start Qdrant for the RAG index:

```bash
docker compose -f brain/rag/docker-compose.yml up -d
```

The default embedding endpoint is LM Studio at `http://localhost:1234/v1/embeddings` with model `text-embedding-bge-m3`.

Run diagnostics:

```bash
bun run doctor
bun run doctor -- --deep
```

Use `-- --deep` to test a real embeddings request. The default doctor uses lighter service checks.

## Public safety check

Run before committing or pushing to a public repo:

```bash
bun run public-safety-check
```

The check scans versioned candidates for local paths, secret patterns, ignored generated files, and sensitive history.

After LM Studio and Qdrant are running, restart OpenCode and run:

```text
/brain-index
/brain-sync
```

## Public repo safety

This repository is intended to be safe for a public GitHub repo. Never commit:

- `opencode.json`
- `.env*` except `.env.example`
- personal `~/brain` contents
- Qdrant storage/data
- model files/cache
- logs/cache
- secrets or raw credentials
- machine-specific absolute paths

## CI

GitHub Actions runs on macOS with Bun:

- `bun install --frozen-lockfile`
- `bun run render-config`
- `bun run public-safety-check`

## Public publish checklist

Before creating the first public GitHub repo or pushing a release:

```bash
bun run render-config
bun run public-safety-check
git status --short
git check-ignore -v .env .env.local .env.example opencode.json package-lock.json
git log --all -- opencode.json .env .env.local package-lock.json
```

Confirm `opencode.json`, local `.env*`, `package-lock.json`, and `.DS_Store` are ignored and absent from history; `.env.example` must remain versionable.
