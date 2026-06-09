# Agent Operating Rules

## Brain Location

Default Brain vault: `~/brain`

Use `$BRAIN_ROOT` if configured.

## Purpose

The Brain stores durable, non-secret global context for agents:

- durable prompts/specs
- session logs
- RAG operating notes

Project-specific context (architecture, features, APIs, decisions, commands, TODOs) lives in each project's `docs/wiki/` directory, not in the Brain vault.

## Session Start

- Read `CONTEXT.md` when Brain context is relevant.
- For repo work, infer the project path.
- If the project has a wiki at `<project>/docs/wiki/`, read `_Index.md` before planning or editing.
- If project wiki context is missing for a non-trivial task, create or propose a concise wiki scaffold.

## Project Wiki

Each project owns its documentation in `docs/wiki/`:

```txt
<project>/docs/wiki/
├── _Index.md
├── Templates/
│   ├── architecture-note.md
│   ├── api-note.md
│   ├── feature-note.md
│   └── decision-note.md
├── features/
├── architecture/
├── api/
└── decisions/
```

The project wiki is the single source of truth for architecture, features, APIs, decisions, commands, gotchas, and follow-ups. It is version-controlled with the project.

## Durable Prompts

If the user gives a long-lived spec, reusable prompt, product goal, or operating rule:

- ask whether to save it;
- save under `Prompts/` with kebab-case slugs, or as a project wiki note when it belongs to one project;
- do not save casual chat unless explicitly requested.

## Write Policy

Auto-update allowed:

- `Prompts/*` after explicit user request/confirmation
- new wiki scaffold for the active project

Ask before modifying:

- global `CONTEXT.md`
- `AGENTS.md`
- existing stable wiki notes

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

## Wiki Docs Style

Keep docs concise and searchable.

Include:

- repo-relative paths by default; absolute local paths only when explicitly needed and safe
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
- project wiki context may exist
- exact files are unknown
- searching durable prompts/specs/decisions

Use hybrid search for:

- filenames
- symbols
- commands
- APIs
- exact identifiers

## Updates After Work

Meaningful work includes:

- non-trivial diff
- bug fix
- test/build result
- architecture discovery
- new follow-up
- durable decision

Update the project wiki when useful: add dated notes under `decisions/` or `features/`, update `features/todo.md` only for actionable follow-ups, and refresh `_Index.md` when adding notes.

## Concurrency

Subagents should not write Brain or wiki files directly if the primary session is also writing them.

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
