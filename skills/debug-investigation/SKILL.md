---
name: debug-investigation
description: Investigate bugs methodically from reproduction to verified fix
metadata:
  audience: developers
  workflow: debugging
---

# Debug Investigation

Use for runtime bugs, failing/flaky tests, crashes, unexpected UI/API behavior, logs/traces, regressions, or integration issues.

Workflow: capture expected/actual, command/input/logs/env → reproduce or narrow → inspect relevant code/recent changes → test hypotheses with evidence → apply smallest root-cause fix → add regression test when practical → verify targeted then broader.

Rules: no broad rewrites, no catch-all symptom masking unless justified, preserve unrelated behavior, avoid reverting user changes. If no reproduction, state assumptions and closest verification.

Report root cause, changed files, verification, risks.
