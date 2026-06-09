# Contributing

This repo is intended to be safe for public GitHub use and targets macOS.

## Before opening a PR or publishing changes

```bash
bun install
bun run bootstrap-env
bun run render-config
bun run public-safety-check
```

Optional local diagnostics:

```bash
bun run doctor
bun run doctor -- --deep
```

## Do not commit

- `opencode.json`
- `.env*` except `.env.example`
- `package-lock.json`
- personal Brain contents
- Qdrant storage/data
- model files/cache
- logs/cache
- secrets or raw credentials
- machine-specific absolute paths

## Versioning policy

- Use Bun and keep `bun.lock` versioned.
- Keep `.env.example` versioned with safe non-secret defaults; never commit local `.env`.
- Keep `opencode.example.json` portable with `$HOME` and `$OPENCODE_CONFIG_DIR` placeholders.
- Keep `brain/template/` generic and non-personal.
- Run `bun run public-safety-check` before any public push.
