# Agent Operating Rules

## Brain Location

Default Brain vault: `~/brain`

Use `$BRAIN_ROOT` if configured.

## Purpose

The Brain stores durable, non-secret context for agents:

- repo/project summaries
- architecture notes
- commands
- decisions
- TODO/follow-ups
- durable prompts/specs
- session logs
- RAG operating notes

## Session Start

- Read `CONTEXT.md` when Brain context is relevant.
- For repo work, infer the repo name/path.
- If `Repos/<repo>/CONTEXT.md` exists, read it before planning or editing.
- If repo context is missing for a non-trivial task, create or propose a concise repo bootstrap.

## Repo Memory

For new projects, create:

```txt
Repos/<repo>/
├── CONTEXT.md
├── ARCHITECTURE.md
├── CODEMAP.md
├── COMMANDS.md
├── TODO.md
└── LOG.md
```

Optional when useful:

```txt
APIs.md
GOTCHAS.md
DECISIONS.md
PROMPTS.md
```

## Durable Prompts

If the user gives a long-lived spec, reusable prompt, product goal, or operating rule:

- ask whether to save it;
- save under `Prompts/` or the relevant `Repos/<repo>/`;
- use clear filenames with kebab-case slugs;
- do not save casual chat unless explicitly requested.

## Write Policy

Auto-update allowed:

- `Daily/YYYY-MM-DD.md`
- `Repos/*/LOG.md`
- `Repos/*/TODO.md`
- new repo bootstrap docs for the active project

Ask before modifying:

- global `CONTEXT.md`
- `AGENTS.md`
- existing stable `Repos/*/CONTEXT.md`
- `Repos/*/DECISIONS.md`

## Secrets Policy

Never store:

- passwords
- tokens
- private keys
- raw `.env` values
- API keys
- OAuth/client secrets
- SSH keys
- database credentials

When needed, describe config generically:

```md
Requires GitHub App credentials via environment variables.
```

Do not paste actual values.

## Repo Docs Style

Keep docs concise and searchable.

Include:

- local path
- purpose
- stack
- entrypoints
- run/build/test commands
- main modules
- data flow
- APIs/routes/CLIs
- gotchas
- current TODOs
- last update date

Prefer summaries over dumping source code.

## RAG Usage

Use Brain RAG when:

- the user references past context
- the request is broad or ambiguous
- repo context may exist
- exact files are unknown
- searching durable prompts/specs/decisions

Use hybrid search for:

- filenames
- symbols
- commands
- APIs
- exact identifiers

## Updates After Work

After meaningful work, update Brain when useful:

- non-trivial diff
- bug fix
- test/build result
- architecture discovery
- new follow-up
- durable decision

Append concise notes to `LOG.md`; update `TODO.md` only for actionable follow-ups.

## Concurrency

Subagents should not write Brain files directly if the primary session is also writing them.

Subagents should return:

- notes
- findings
- proposed doc snippets
- risks
- follow-ups

The primary session applies Brain updates.

## Public Repo Safety

Treat this OpenCode config repository as potentially public.

Do not commit:

- personal Brain contents
- `opencode.json`
- `.env*`
- secrets
- machine-specific absolute paths
- Qdrant data
- LM Studio cache/models
- logs/cache
