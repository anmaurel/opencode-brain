---
name: refactor
description: Plan and execute safe refactoring of code modules
metadata:
  audience: developers
  workflow: refactoring
---

# Refactor

Use for behavior-preserving restructuring: extraction, renaming, moving modules, simplifying conditionals, deduplicating.

Workflow: inspect target files/usages/dependencies → plan small reversible steps → edit incrementally → run relevant tests after steps → update references → final verification/full suite when appropriate.

Rules: do not change public behavior/API unless asked; preserve style; if tests fail, revert the last step or stop and re-plan; prefer focused refactors over rewrites.
