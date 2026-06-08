---
title: "opencode-config-brain-rag — contexte projet"
date: 2026-06-08
type: architecture
tags: [opencode, brain, rag, template]
---

# opencode-config-brain-rag — contexte projet

## Contexte

Configuration OpenCode portable pour macOS avec agents, commandes, skills, prompts et support Brain RAG local.

## Stack

- Runtime/scripts : Bun + Node ESM.
- Config OpenCode : `opencode.example.json` rendu vers `opencode.json` local ignoré.
- Brain RAG : serveur MCP local dans `brain-rag/server.mjs`, embeddings OpenAI-compatible locaux, Qdrant local.
- Template Brain : `brain-template/` pour initialiser un vault global non personnel.

## Entrypoints

- `package.json` — scripts bootstrap, doctor, render config, public safety.
- `scripts/bootstrap-brain.mjs` — copie les fichiers manquants depuis `brain-template/` vers `$BRAIN_ROOT`.
- `scripts/render-opencode-config.mjs` — rend la config locale.
- `brain-rag/server.mjs` — serveur MCP Brain RAG.
- `commands/` — commandes OpenCode spécialisées.
- `skills/` et `prompts/` — comportements agents.

## Commandes

```bash
bun run bootstrap
bun run bootstrap-brain
bun run render-config
bun run doctor
bun run doctor -- --deep
bun run public-safety-check
```

## Règles mémoire

- Le Brain global contient seulement le contexte durable non-projet : `AGENTS.md`, `CONTEXT.md`, `Daily/`, `Prompts/`, `RAG/`.
- Le contexte projet vit dans `<project>/docs/wiki/` et doit être versionné avec le projet.
- `brain-template/` ne doit pas contenir de mémoire personnelle, secrets, chemins machine ou données client.

## Gotchas

- `opencode.json` et `.env*` locaux sont ignorés et ne doivent pas être publiés.
- `bootstrap-brain` crée seulement les fichiers manquants ; il ne supprime pas les dossiers legacy existants dans un vault déjà initialisé.
- Le support legacy `Repos/<repo>` peut rester dans le serveur RAG pour compatibilité, mais les nouveaux docs projet doivent utiliser `docs/wiki/`.

## Vérification

- Tester un bootstrap dans un `$BRAIN_ROOT` temporaire.
- Lancer `bun run public-safety-check` avant publication.
