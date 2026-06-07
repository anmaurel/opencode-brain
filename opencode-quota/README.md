# OpenCode Quota Plugin Config

`quota-toast.json` stores UI preferences for `@slkiser/opencode-quota` and is safe to version.

Upstream package: `@slkiser/opencode-quota`.

Do not commit runtime files that may be produced by quota or provider tooling, such as:

- logs
- cache files
- token/session files
- credentials

The root `.gitignore` excludes common `opencode-quota/*.log` and `opencode-quota/*.cache` files. Add more ignore rules if the plugin creates additional local state.
