---
name: customize-opencode
description: Create or edit opencode configuration, agents, skills, plugins, MCP servers, and permission rules
metadata:
  audience: opencode-users
  workflow: configuration
---

# Customizing opencode

Use only for OpenCode config/agents/skills/plugins/MCP/permissions under `~/.config/opencode/`, project `opencode.json/jsonc`, or `.opencode/`.

Source of truth: schema `https://opencode.ai/config.json`; include `$schema` in config. Global config path is `~/.config/opencode/` (not `~/.opencode/`). Project config deep-merges over global.

Workflow: locate files, read current config, verify uncertain field shapes against schema, make minimal changes, keep secrets in env/auth flows, and tell user to restart OpenCode after config/skill changes.

Rules: do not guess top-level keys, edit application code, or write MCP/plugin/provider shapes without verification.
