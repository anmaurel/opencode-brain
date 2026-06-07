---
name: customize-opencode
description: Create or edit opencode configuration, agents, skills, plugins, MCP servers, and permission rules
metadata:
  audience: opencode-users
  workflow: configuration
---

# Customizing opencode

Use this only when editing or creating opencode's own configuration: `opencode.json`, `opencode.jsonc`, files under `.opencode/`, or files under `~/.config/opencode/`. Also use it for agents, subagents, skills, plugins, MCP servers, or permission rules.

## Source of truth

opencode validates config strictly and can fail to start on invalid fields. Before writing uncertain config, check the schema:

<https://opencode.ai/config.json>

Every `opencode.json` should include:

```json
{
  "$schema": "https://opencode.ai/config.json"
}
```

## Common paths

| Scope | Path |
| --- | --- |
| Global config | `~/.config/opencode/opencode.json` |
| Global agents | `~/.config/opencode/agent/<name>.md` or `~/.config/opencode/agents/<name>.md` |
| Global skills | `~/.config/opencode/skills/<name>/SKILL.md` |
| Project config | `./opencode.json`, `./opencode.jsonc`, or `.opencode/opencode.json` |
| Project agents | `.opencode/agent/<name>.md` or `.opencode/agents/<name>.md` |
| Project skills | `.opencode/skills/<name>/SKILL.md` |

Project config overrides global config through deep merge.

## Workflow

1. Locate the relevant global or project opencode files.
2. Read existing config before editing.
3. Validate field names and shapes against the schema when unsure.
4. Keep changes minimal and preserve existing conventions.
5. Avoid storing secrets directly in config; prefer environment variables or supported auth flows.
6. After changes, tell the user to quit and restart opencode because config and skills are loaded at startup.

## Rules

- Do not guess unknown top-level keys.
- Do not edit application code under this skill.
- Do not use `~/.opencode/` for global config; use `~/.config/opencode/`.
- For MCP/plugin/provider changes, verify exact config shape before writing.
