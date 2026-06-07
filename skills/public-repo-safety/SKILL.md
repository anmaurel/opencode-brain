---
name: public-repo-safety
description: Audit files before publishing a public repository to prevent secrets, private paths, and personal memory leaks
metadata:
  audience: developers
  workflow: security
---

# Public Repo Safety

Use this before committing, pushing, or publishing a repo publicly, especially configuration, agent, Brain, automation, or deployment repos.

## What I do

- Check git status and intended tracked files.
- Verify ignore rules for generated/local files.
- Scan candidate files for secrets, private paths, and personal memory.
- Review history risk before first public push.
- Report blockers and safe remediation steps.

## Must not be committed

- `.env`, `.env.*`, raw environment dumps.
- API keys, OAuth secrets, tokens, passwords, private keys, SSH keys.
- Generated machine-local config such as `opencode.json`.
- Legacy npm lockfiles such as `package-lock.json` in this Bun-based repo.
- Personal Brain vault contents.
- Qdrant/vector DB storage or model caches.
- Logs, cache files, temporary files, `.DS_Store`.
- Machine-specific absolute paths unless they are examples using `$HOME` or placeholders.

## Workflow

1. Inspect `git status --short` and identify files that would be versioned.
2. Verify `.gitignore` covers generated/local/sensitive files.
3. Scan tracked and candidate files for:
   - private paths like `/Users/<name>`
   - token prefixes such as OpenAI, GitHub, Slack, AWS, and Google API keys
   - private key headers
   - raw `.env` assignments
   - personal memory or client/project data not meant for public release
4. Check whether sensitive files were ever committed:
   - `git log --all -- <sensitive-file>`
   - if needed, use history rewrite tools before publishing.
5. Review README/setup docs for public-safe language and placeholder URLs.
6. Report safe-to-publish status or blockers.

## Suggested checks

```bash
git status --short
git check-ignore -v opencode.json .env .env.local .DS_Store
git log --all -- opencode.json .env
```

Use content search for common leaks:

```txt
/Users/<local-username>
BEGIN ... PRIVATE KEY
BEGIN ... OPENSSH PRIVATE KEY
OpenAI key prefix
GitHub token prefix
Slack token prefix
AWS access key prefix
Google API key prefix
```

## Remediation

- If a sensitive file is untracked: add or fix `.gitignore`.
- If a sensitive file is staged: unstage it and remove from the index.
- If a sensitive file was committed: stop, rotate any leaked credentials, and rewrite history before public push.
- If docs contain private paths: replace with `$HOME`, `<repo>`, or `<path>` placeholders.

## Rules

- Never print full secret values in the final response.
- Prefer describing the leak class and file path over exposing the value.
- Do not commit or push unless the user explicitly requests it.
