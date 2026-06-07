# Token Optimization Rules

- Be concise: no filler, no preamble, no unnecessary summaries.
- Prefer short answers; explain only when asked or needed.
- Keep edits minimal and avoid repeating prior context/code.
- Use grep/glob before reads; batch parallel tool calls.
- Avoid large tool outputs; read narrow file ranges.
- For complex tasks, suggest Plan Mode first.
- When context feels large or after ~15 exchanges, propose a new session with a compact pasteable summary.
- Prefer focused sessions over long broad sessions.

# Brain Memory Rules

- Brain vault: `~/brain` by default, or `$BRAIN_ROOT` when configured.
- Use the Brain when persistent context, repo memory, long goals, decisions, prompts, or past work are relevant.
- At session start, read `$BRAIN_ROOT/CONTEXT.md` when Brain context is relevant.
- For repo-specific work, read `$BRAIN_ROOT/Repos/<repo>/CONTEXT.md` when present.
- For repo-specific work, first infer the repo name/path and check whether `$BRAIN_ROOT/Repos/<repo>/` exists.
- If repo Brain context is missing or obviously stale and the task is more than trivial, bootstrap or update concise repo docs before/after the work instead of relying on chat-only context.
- Use `brain_rag` semantic search for broad/ambiguous requests or when the user references past context without a precise note path.
- Use `brain_fs` for scoped file read/write access inside the Brain vault.

## Brain Auto-Memory Workflow

- New repo/project: create or update `$BRAIN_ROOT/Repos/<repo>/` with `CONTEXT.md`, `ARCHITECTURE.md`, `CODEMAP.md`, `COMMANDS.md`, `TODO.md`, and `LOG.md`, then index it with `brain_rag`.
- Existing repo/project: read existing Brain context before planning/building; update `LOG.md` and `TODO.md` after meaningful work (non-trivial diff, bug fix, test/build result, or discovered follow-up).
- Durable prompts/specs: when the user gives a long-lived goal, product spec, operating rule, or reusable prompt, offer to save it under `$BRAIN_ROOT/Prompts/` or the relevant repo folder.
- Decisions: store only explicit durable decisions; ask before editing `DECISIONS.md` unless the user clearly requested persistence.
- Keep generated Brain docs structured and searchable: include local path, stack, commands, entrypoints, module map, APIs, gotchas, and current follow-ups.
- Serialize Brain writes through the primary session; subagents should return notes or proposed diffs instead of writing the same Brain files concurrently.

## Brain Write Policy

- Auto-update allowed: `Daily/YYYY-MM-DD.md`, `Repos/*/LOG.md`, `Repos/*/TODO.md`, and new `Repos/<repo>/` bootstrap docs for a repo the user is actively working on.
- Ask before modifying unless explicitly instructed: global `CONTEXT.md`, `AGENTS.md`, existing stable `Repos/*/CONTEXT.md`, and `Repos/*/DECISIONS.md`.
- Never store secrets, passwords, tokens, private keys, or raw `.env` values in the Brain.
- Keep Brain updates concise, factual, and deduplicated.
