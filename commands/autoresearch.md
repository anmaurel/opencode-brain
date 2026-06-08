---
description: Conduct autonomous technical research, create wiki notes, and index in Brain RAG
agent: brain
---

Conduct autonomous technical research on the topic in $ARGUMENTS and produce structured notes in `docs/wiki/`, then index them in the Brain RAG.

## Steps

### 1. Resolve project context
- Determine the current project path and repo name (from working directory or `$ARGUMENTS`).
- Read `<project>/docs/wiki/_Index.md` and relevant architecture notes to understand the project stack.
- If no wiki exists, stop and suggest running `/brain-sync` first to scaffold it.

### 2. Parse the topic
From $ARGUMENTS, identify:
- The core subject (library, pattern, protocol, concept)
- The angle: best practices? comparison? migration? integration?
- The relevant project area (authentication, state management, testing, build, API layer, etc.)

If $ARGUMENTS is empty, ask the user for a topic and angle.

### 3. Round 1 — broad search (3 searches minimum)
- Official docs or spec overview
- Recent developments / releases (last 12 months)
- Real-world usage patterns in Vue 3 + TypeScript projects

### 4. Identify gaps — do 2-3 targeted follow-up searches
After round 1, list what's still unclear:
- Integration specifics for the project's stack
- Known issues, gotchas, or breaking changes
- Comparison with currently used approach (if applicable)

### 5. Synthesize findings
Structure the synthesis around:
- What it is and why it matters for the project
- How it fits with the existing codebase patterns (see CONTEXT.md)
- Concrete integration steps or code patterns
- Trade-offs vs. current approach
- Sources (all URLs used)

### 6. Classify and create the main research note

| Subject type | Path |
|---|---|
| Library / tool to adopt | `docs/wiki/architecture/<tool-name>.md` |
| Pattern / technique | `docs/wiki/architecture/<pattern-name>.md` |
| Feature-scoped research | `docs/wiki/features/<feature-name>.md` |
| API / external service | `docs/wiki/api/<service-name>.md` |

Use the matching template from `docs/wiki/Templates/`.

### 7. Create concept stub notes
One stub per new concept, library, or technology discovered that deserves its own note.
Link to the main research note via `[[wikilink]]`.

### 8. Optionally draft an ADR
If the research concludes with a clear technical decision (adopt / reject / defer a library or pattern), create a draft ADR in `docs/wiki/decisions/adr-<NNN>-<slug>.md` using the decision template.

### 9. Update `docs/wiki/_Index.md`
Add under "Sujets de recherche actifs" or "Notes récentes".

### 10. Index in Brain RAG
- Call `brain_ingest_path` with the absolute path `<project-path>/docs/wiki/` to index all wiki files.
- Verify with `brain_search({ query: "<research topic>", mode: "hybrid" })`.

### 11. Report
- Files created
- Key findings (5 bullets max)
- Recommended next action (implement, discuss with team, open ADR, etc.)
- Open questions for further research
- Confirm RAG index status
