---
name: refactor
description: Plan and execute safe refactoring of code modules
metadata:
  audience: developers
  workflow: refactoring
---

## What I do

- Analyze the current code structure and dependencies
- Create a step-by-step refactoring plan
- Execute changes incrementally with tests at each step
- Ensure no behavioral changes without explicit request

## When to use me

Use this when you need to restructure existing code without changing its behavior. Typical use cases: extracting functions, renaming, moving modules, simplifying conditionals, replacing duplicated code.

## Workflow

1. Read the target files and understand the current structure
2. Identify all usages and dependencies (imports, callers)
3. Plan the refactoring in small, reversible steps
4. Execute one step at a time, running tests after each
5. Update all references and imports
6. Verify the final result with the full test suite

## Rules

- Never change public API behavior unless explicitly asked
- Run existing tests after each step to catch regressions
- If tests fail, revert the last step and re-plan
- Prefer small, focused refactors over large rewrites
