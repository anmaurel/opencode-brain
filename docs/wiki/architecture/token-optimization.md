---
title: "Optimisation tokens prompts et RAG"
date: 2026-06-08
type: architecture
tags: [tokens, prompts, rag, brain]
---

# Optimisation tokens prompts et RAG

## Contexte

Les prompts custom, skills et commandes OpenCode ajoutent du contexte récurrent. Le Brain RAG est utile seulement s'il remplace plusieurs lectures de fichiers ou récupère un historique durable.

## Décision

- Compresser les prompts de base (`instructions.md`, `prompts/build.md`, `prompts/plan.md`).
- Compresser les commandes Brain lourdes (`brain-sync`, `wiki`, `brain-summarize-project`).
- Compresser les agents/skills en gardant frontmatter, permissions et règles sécurité.
- Règle RAG : usage à la demande pour tâches non triviales, historique ambigu, décisions/prompts durables, ou économie de plusieurs lectures source.
- Pas de wiki/RAG pour questions rapides ou edits simples mono-fichier.
- MCP Brain optimisé pour retours compacts : limites search/context réduites, `max_chars`, `include_text:false`, status léger par défaut, reindex périodique désactivé.

## Impact codebase

- `instructions.md` : règle RAG on-demand.
- `prompts/build.md`, `prompts/plan.md` : workflows réduits.
- `skills/brain-memory/SKILL.md` : skill condensée.
- `commands/brain-sync.md`, `commands/wiki.md`, `commands/brain-summarize-project.md` : étapes condensées.
- `agents/*.md`, `skills/*/SKILL.md` : corps condensés, permissions/frontmatter préservés.
- `brain/rag/server.mjs` : schemas courts, résultats tronqués par défaut, metadata-only possible, `brain_status({ deep: true })` pour tester embeddings.
- `.env*` : chunks/search defaults plus compacts, reindex startup/périodique désactivés par défaut.

## Vérification

- Mesurer avec `wc -w`.
- Lancer `bun run public-safety-check`.

## Gotchas

- Le RAG fait perdre des tokens s'il est chargé systématiquement pour des tâches triviales.
- Il en économise s'il évite des lectures larges de source ou de longs rappels manuels.
