---
name: debug-investigation
description: Investigate bugs methodically from reproduction to verified fix
metadata:
  audience: developers
  workflow: debugging
---

## What I do

- Clarify the failure, expected behavior, and affected environment
- Reproduce the issue before changing code whenever possible
- Trace data/control flow to identify the smallest credible root cause
- Propose focused fixes and verify them with targeted tests or commands
- Keep a clear investigation log: symptoms, hypotheses, evidence, fix, risks

## When to use me

Use this for runtime bugs, failing tests, regressions, flaky behavior, crashes, unexpected UI/API behavior, logs/trace analysis, or suspected integration issues.

## Workflow

1. Capture the bug report: command, input, stack trace, logs, environment, expected vs actual.
2. Reproduce or narrow the failure with the smallest reliable command or scenario.
3. Inspect relevant code paths and recent changes before editing.
4. Form hypotheses and test them with evidence, not guesses.
5. Implement the smallest fix that addresses the root cause.
6. Add or update a regression test when practical.
7. Run targeted verification first, then broader tests if appropriate.
8. Report the root cause, changed files, verification run, and remaining risks.

## Rules

- Do not apply broad rewrites while debugging.
- Do not mask symptoms with catch-all fallbacks unless explicitly justified.
- Preserve unrelated behavior and avoid reverting user changes.
- Prefer deterministic reproductions over speculative fixes.
- If reproduction is impossible, state assumptions and verify with the closest available checks.
