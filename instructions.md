# Token Rules

- Be concise; no filler, repeated context, or broad tool output.
- Prefer grep/glob before reads; batch independent searches.
- Read narrow ranges; summarize long outputs instead of pasting them.
- For complex work, use Plan first; after long sessions, propose a compact restart summary.

# Brain / RAG Rules

- Brain root: `$BRAIN_ROOT` or `~/brain`.
- Use Brain/RAG only for non-trivial tasks, unclear history, durable prompts/decisions, or when it avoids reading multiple source files. Skip it for quick questions and simple one-file edits.
- For repo work, infer project path. If useful, read `<project>/docs/wiki/_Index.md`; scaffold/update `docs/wiki/` only for meaningful work or stale/missing context.
- Save durable prompts only after explicit request/confirmation under `$BRAIN_ROOT/Prompts/` or as project wiki notes.
- Never store secrets, tokens, raw `.env`, private keys, or personal data.
- Use repo-relative paths in wiki docs by default; serialize Brain/wiki writes in the primary session.
