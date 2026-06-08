#!/usr/bin/env bun

import fs from "node:fs/promises";
import { watch } from "node:fs";
import path from "node:path";
import os from "node:os";
import crypto from "node:crypto";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

const BRAIN_ROOT = process.env.BRAIN_RAG_ROOT || process.env.BRAIN_ROOT || path.join(os.homedir(), "brain");
const LMSTUDIO_EMBED_URL = process.env.BRAIN_RAG_EMBED_URL || "http://localhost:1234/v1/embeddings";
const EMBED_MODEL = process.env.BRAIN_RAG_EMBED_MODEL || "text-embedding-baai-bge-m3-568m";
const QDRANT_URL = (process.env.BRAIN_RAG_QDRANT_URL || "http://localhost:6333").replace(/\/$/, "");
const COLLECTION = process.env.BRAIN_RAG_COLLECTION || "brain_chunks";
const CHUNK_WORDS = positiveInt(process.env.BRAIN_RAG_CHUNK_WORDS, 320);
const CHUNK_OVERLAP = positiveInt(process.env.BRAIN_RAG_CHUNK_OVERLAP, 50);
const SEARCH_LIMIT = positiveInt(process.env.BRAIN_RAG_SEARCH_LIMIT, 5);
const CONTEXT_LIMIT = positiveInt(process.env.BRAIN_RAG_CONTEXT_LIMIT, 3);
const RESULT_LIMIT_CAP = positiveInt(process.env.BRAIN_RAG_RESULT_LIMIT_CAP, 20);
const SEARCH_MAX_CHARS = nonNegativeInt(process.env.BRAIN_RAG_SEARCH_MAX_CHARS, 900);
const CONTEXT_MAX_CHARS = nonNegativeInt(process.env.BRAIN_RAG_CONTEXT_MAX_CHARS, 700);
const RESULT_MAX_CHARS_CAP = nonNegativeInt(process.env.BRAIN_RAG_RESULT_MAX_CHARS_CAP, 5000);
const EXTERNAL_ALLOWED_PATHS = (process.env.BRAIN_RAG_ALLOWED_PATHS || "")
  .split(path.delimiter)
  .map((item) => item.trim())
  .filter(Boolean)
  .map((item) => path.resolve(item.replace(/^~(?=$|\/)/, os.homedir())));
const REINDEX_ON_STARTUP = process.env.BRAIN_RAG_REINDEX_ON_STARTUP === "true";
const WATCH_ENABLED = process.env.BRAIN_RAG_WATCH === "true";
const REINDEX_INTERVAL_MS = Number(process.env.BRAIN_RAG_REINDEX_INTERVAL_MS || 0);
const WATCH_DEBOUNCE_MS = Number(process.env.BRAIN_RAG_WATCH_DEBOUNCE_MS || 10000);

let activeReindex = null;
let lastReindex = null;
let watchStatus = "disabled";
let watchTimer = null;

const tools = [
  {
    name: "brain_status",
    description: "Check Brain RAG status.",
    inputSchema: {
      type: "object",
      properties: {
        deep: { type: "boolean", default: false, description: "Also test embeddings." }
      },
      additionalProperties: false
    }
  },
  {
    name: "brain_reindex",
    description: "Reindex Markdown notes.",
    inputSchema: {
      type: "object",
      properties: {
        repo: { type: "string" },
        path: { type: "string" },
        limit: { type: "number" }
      },
      additionalProperties: false
    }
  },
  {
    name: "brain_ingest_path",
    description: "Ingest file or directory.",
    inputSchema: {
      type: "object",
      properties: {
        path: { type: "string" },
        source_type: { type: "string", enum: ["markdown", "pdf", "text"] }
      },
      required: ["path"],
      additionalProperties: false
    }
  },
  {
    name: "brain_ingest_url",
    description: "Ingest a public URL.",
    inputSchema: {
      type: "object",
      properties: {
        url: { type: "string" },
        title: { type: "string" }
      },
      required: ["url"],
      additionalProperties: false
    }
  },
  {
    name: "brain_search",
    description: "Search Brain index.",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string" },
        limit: { type: "number", default: 5, minimum: 1 },
        repo: { type: "string" },
        source_type: { type: "string", enum: ["markdown", "pdf", "web", "text"] },
        doc_type: { type: "string" },
        mode: { type: "string", enum: ["semantic", "keyword", "hybrid"], default: "semantic" },
        max_chars: { type: "number", default: 900, minimum: 0, maximum: 5000 },
        include_text: { type: "boolean", default: true }
      },
      required: ["query"],
      additionalProperties: false
    }
  },
  {
    name: "brain_search_context",
    description: "Search with neighboring chunks.",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string" },
        limit: { type: "number", default: 3, minimum: 1 },
        repo: { type: "string" },
        source_type: { type: "string", enum: ["markdown", "pdf", "web", "text"] },
        doc_type: { type: "string" },
        mode: { type: "string", enum: ["semantic", "keyword", "hybrid"], default: "hybrid" },
        neighbors: { type: "number", default: 1, minimum: 0 },
        max_chars: { type: "number", default: 700, minimum: 0, maximum: 5000 },
        include_text: { type: "boolean", default: true }
      },
      required: ["query"],
      additionalProperties: false
    }
  }
];

function send(message) {
  process.stdout.write(`${JSON.stringify(message)}\n`);
}

function result(id, value) {
  send({ jsonrpc: "2.0", id, result: value });
}

function error(id, code, message) {
  send({ jsonrpc: "2.0", id, error: { code, message } });
}

function textResult(value) {
  return { content: [{ type: "text", text: typeof value === "string" ? value : JSON.stringify(value, null, 2) }] };
}

function positiveInt(value, fallback) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function nonNegativeInt(value, fallback) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : fallback;
}

function cleanText(input) {
  return String(input || "")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<nav[\s\S]*?<\/nav>/gi, " ")
    .replace(/<footer[\s\S]*?<\/footer>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function truncateText(text, maxChars) {
  if (text === undefined || text === null) return undefined;
  const value = String(text);
  if (maxChars === 0) return undefined;
  if (!maxChars || value.length <= maxChars) return value;
  return `${value.slice(0, maxChars).trim()}…`;
}

function textOptions(args, fallbackMaxChars) {
  const maxChars = nonNegativeInt(args.max_chars, fallbackMaxChars);
  return {
    include_text: args.include_text !== false,
    max_chars: Math.min(maxChars, RESULT_MAX_CHARS_CAP)
  };
}

function resultLimit(value, fallback) {
  return Math.min(positiveInt(value, fallback), RESULT_LIMIT_CAP);
}

function wordChunks(text, meta) {
  const words = cleanText(text).split(/\s+/).filter(Boolean);
  const chunks = [];
  if (!words.length) return chunks;
  const step = Math.max(1, CHUNK_WORDS - CHUNK_OVERLAP);
  for (let start = 0; start < words.length; start += step) {
    const slice = words.slice(start, start + CHUNK_WORDS);
    if (!slice.length) break;
    chunks.push({ text: slice.join(" "), meta: { ...meta, chunk_index: chunks.length } });
    if (start + CHUNK_WORDS >= words.length) break;
  }
  return chunks;
}

function chunkText(text, meta) {
  if (meta.source_type !== "markdown") return wordChunks(text, meta);

  const sections = markdownSections(text);
  const chunks = [];
  for (const section of sections) {
    const sectionText = cleanText(section.text);
    if (!sectionText) continue;
    const sectionWords = sectionText.split(/\s+/).filter(Boolean);
    if (sectionWords.length <= CHUNK_WORDS) {
      chunks.push({
        text: sectionText,
        meta: { ...meta, heading_path: section.heading_path, word_count: sectionWords.length, chunk_index: chunks.length }
      });
      continue;
    }
    for (const chunk of wordChunks(sectionText, { ...meta, heading_path: section.heading_path })) {
      chunks.push({ text: chunk.text, meta: { ...chunk.meta, word_count: chunk.text.split(/\s+/).filter(Boolean).length, chunk_index: chunks.length } });
    }
  }
  return chunks.length ? chunks : wordChunks(text, meta);
}

function markdownSections(text) {
  const lines = String(text || "").split(/\r?\n/);
  const headings = [];
  const sections = [];
  let current = [];
  let currentHeading = [];

  function flush() {
    const body = current.join("\n").trim();
    if (body) sections.push({ heading_path: currentHeading.join(" > ") || undefined, text: body });
    current = [];
  }

  for (const line of lines) {
    const match = /^(#{1,6})\s+(.+?)\s*#*\s*$/.exec(line);
    if (match) {
      flush();
      const level = match[1].length;
      headings[level - 1] = match[2].trim();
      headings.length = level;
      currentHeading = headings.filter(Boolean);
      current.push(line);
    } else {
      current.push(line);
    }
  }
  flush();
  return sections;
}

async function embed(text) {
  return (await embedBatch([text]))[0];
}

async function embedBatch(inputs) {
  const response = await fetch(LMSTUDIO_EMBED_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model: EMBED_MODEL, input: inputs })
  });
  if (!response.ok) throw new Error(`LM Studio embeddings failed: ${response.status} ${await response.text()}`);
  const json = await response.json();
  const vectors = json?.data?.map((item) => item.embedding);
  if (!Array.isArray(vectors) || vectors.some((vector) => !Array.isArray(vector))) {
    throw new Error("LM Studio response did not include embedding vectors");
  }
  return vectors;
}

async function qdrant(pathname, options = {}) {
  const response = await fetch(`${QDRANT_URL}${pathname}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options.headers || {}) }
  });
  const text = await response.text();
  const json = text ? JSON.parse(text) : {};
  if (!response.ok) throw new Error(`Qdrant ${pathname} failed: ${response.status} ${text}`);
  return json;
}

async function ensureCollection(dim) {
  try {
    await qdrant(`/collections/${COLLECTION}`);
  } catch {
    await qdrant(`/collections/${COLLECTION}`, {
      method: "PUT",
      body: JSON.stringify({ vectors: { size: dim, distance: "Cosine" } })
    });
  }
}

function toPointId(value) {
  const hash = crypto.createHash("sha256").update(value).digest("hex").slice(0, 32);
  return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-${hash.slice(12, 16)}-${hash.slice(16, 20)}-${hash.slice(20)}`;
}

function detectRepo(filePath) {
  if (!filePath) return undefined;
  const parts = filePath.split(path.sep);
  // Legacy: detect from Repos/<repo>/ structure
  const reposIdx = parts.lastIndexOf("Repos");
  if (reposIdx >= 0 && parts[reposIdx + 1]) return parts[reposIdx + 1];
  // New: detect from <project>/docs/wiki/ structure
  const docsIdx = parts.lastIndexOf("docs");
  if (docsIdx >= 0 && parts[docsIdx + 1] === "wiki" && docsIdx > 0) return parts[docsIdx - 1];
  return undefined;
}

function relativeBrainPath(filePath) {
  if (!filePath) return undefined;
  return path.relative(BRAIN_ROOT, filePath);
}

function detectDocType(filePath) {
  if (!filePath) return undefined;
  const base = path.basename(filePath, path.extname(filePath)).toLowerCase();
  const known = new Set(["context", "architecture", "codemap", "decisions", "log", "todo", "apis", "api", "commands", "gotchas", "readme", "agents"]);
  if (known.has(base)) return base === "api" ? "apis" : base;
  const parts = filePath.split(path.sep);
  if (parts.includes("Daily")) return "daily";
  if (parts.includes("Templates")) return "template";
  if (parts.includes("Prompts")) return "prompt";
  if (parts.includes("Sources")) return "source";
  return undefined;
}

function detectLanguage(filePath) {
  const ext = path.extname(filePath || "").toLowerCase();
  return ({
    ".js": "javascript",
    ".mjs": "javascript",
    ".cjs": "javascript",
    ".ts": "typescript",
    ".tsx": "typescript",
    ".jsx": "javascript",
    ".json": "json",
    ".md": "markdown",
    ".py": "python",
    ".go": "go",
    ".rs": "rust",
    ".css": "css",
    ".html": "html",
    ".sh": "shell"
  })[ext];
}

function extractTags(text) {
  const tags = new Set();
  const frontmatter = /^---\n([\s\S]*?)\n---/.exec(String(text || ""));
  if (frontmatter) {
    const tagLine = /^tags:\s*(.+)$/m.exec(frontmatter[1]);
    if (tagLine) tagLine[1].replace(/[\[\],]/g, " ").split(/\s+/).filter(Boolean).forEach((tag) => tags.add(tag.replace(/^#/, "")));
  }
  for (const match of String(text || "").matchAll(/(^|\s)#([A-Za-z0-9_/-]+)/g)) tags.add(match[2]);
  return [...tags];
}

async function resolveBrainPath(input) {
  const candidate = path.isAbsolute(input) ? path.resolve(input) : path.resolve(BRAIN_ROOT, input);
  const root = await fs.realpath(BRAIN_ROOT);
  const candidateNorm = path.resolve(candidate);
  // Allow paths inside Brain root
  if (candidateNorm === root || candidateNorm.startsWith(`${root}${path.sep}`)) {
    const resolved = await fs.realpath(candidate);
    if (resolved === root || resolved.startsWith(`${root}${path.sep}`) || isAllowedExternalPath(resolved)) return resolved;
    throw new Error(`Symlink target is not an allowed docs/wiki path: ${input}`);
  }
  // Allow explicit external project wiki paths only.
  if (path.isAbsolute(input)) {
    const resolved = await fs.realpath(candidate);
    if (!isAllowedExternalPath(resolved)) throw new Error(`External path is not an allowed docs/wiki path: ${input}`);
    return resolved;
  }
  throw new Error(`Path outside Brain root is not allowed: ${input}`);
}

function isAllowedExternalPath(filePath) {
  const normalized = path.resolve(filePath);
  if (EXTERNAL_ALLOWED_PATHS.some((root) => normalized === root || normalized.startsWith(`${root}${path.sep}`))) return true;
  const parts = normalized.split(path.sep);
  const docsIdx = parts.lastIndexOf("docs");
  return docsIdx >= 0 && parts[docsIdx + 1] === "wiki";
}

async function readSource(filePath, sourceType) {
  const ext = path.extname(filePath).toLowerCase();
  const type = sourceType || (ext === ".pdf" ? "pdf" : ext === ".md" ? "markdown" : "text");
  if (type === "pdf") {
    const { stdout } = await execFileAsync("pdftotext", ["-layout", filePath, "-"]);
    return { text: stdout, source_type: "pdf" };
  }
  return { text: await fs.readFile(filePath, "utf8"), source_type: type };
}

async function listFiles(root, visited = new Set()) {
  const realRoot = await fs.realpath(root);
  if (visited.has(realRoot)) return [];
  visited.add(realRoot);
  const entries = await fs.readdir(root, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if ([".obsidian", ".git", "node_modules", "index"].includes(entry.name)) continue;
    if (entry.isSymbolicLink()) {
      // Follow symlinks to external dirs (e.g. repo docs/wiki/ linked into Brain)
      try {
        const target = await fs.realpath(path.join(root, entry.name));
        if (!isAllowedExternalPath(target) && !target.startsWith(`${await fs.realpath(BRAIN_ROOT)}${path.sep}`)) continue;
        const targetStat = await fs.stat(target);
        if (targetStat.isDirectory()) { files.push(...await listFiles(target, visited)); }
        else if (/\.(md|txt|pdf)$/i.test(entry.name)) { files.push(target); }
      } catch {}
      continue;
    }
    const full = path.join(root, entry.name);
    if (entry.isDirectory()) files.push(...await listFiles(full, visited));
    else if (/\.(md|txt|pdf)$/i.test(entry.name)) files.push(full);
  }
  return files;
}

async function ingestDocument({ text, source_path, source_type, title, url }) {
  const repo = source_path ? detectRepo(source_path) : undefined;
  const relative_path = relativeBrainPath(source_path);
  const chunks = chunkText(text, {
    source_path,
    relative_path,
    folder: relative_path ? path.dirname(relative_path) : undefined,
    source_type,
    doc_type: detectDocType(source_path),
    language: detectLanguage(source_path),
    title,
    url,
    repo,
    tags: extractTags(text),
    updated_at: new Date().toISOString()
  });
  if (!chunks.length) return { chunks: 0, points: 0 };
  const vectors = [];
  for (let i = 0; i < chunks.length; i += 32) {
    vectors.push(...await embedBatch(chunks.slice(i, i + 32).map((chunk) => chunk.text)));
  }
  const firstVector = vectors[0];
  await ensureCollection(firstVector.length);
  await deleteExistingSource(source_path || url);
  const points = [];
  for (let i = 0; i < chunks.length; i++) {
    points.push({
      id: toPointId(`${source_path || url}:${i}`),
      vector: vectors[i],
      payload: { text: chunks[i].text, ...chunks[i].meta }
    });
  }
  for (let i = 0; i < points.length; i += 100) {
    await qdrant(`/collections/${COLLECTION}/points?wait=true`, {
      method: "PUT",
      body: JSON.stringify({ points: points.slice(i, i + 100) })
    });
  }
  return { chunks: chunks.length, points: points.length };
}

async function deleteExistingSource(source) {
  if (!source) return;
  const key = String(source).startsWith("http://") || String(source).startsWith("https://") ? "url" : "source_path";
  try {
    await qdrant(`/collections/${COLLECTION}/points/delete?wait=true`, {
      method: "POST",
      body: JSON.stringify({ filter: { must: [{ key, match: { value: source } }] } })
    });
  } catch {
    // Collection may be new or empty; upsert will recreate current source content.
  }
}

async function ingestPath(args) {
  const target = await resolveBrainPath(args.path);
  const stat = await fs.stat(target);
  const files = stat.isDirectory() ? await listFiles(target) : [target];
  let indexedFiles = 0;
  let chunks = 0;
  for (const file of files) {
    const source = await readSource(file, args.source_type);
    const ingested = await ingestDocument({
      text: source.text,
      source_path: file,
      source_type: source.source_type,
      title: path.basename(file)
    });
    indexedFiles++;
    chunks += ingested.chunks;
  }
  return { indexedFiles, chunks };
}

async function ingestUrl(args) {
  validatePublicUrl(args.url);
  const response = await fetch(args.url);
  if (!response.ok) throw new Error(`Fetch failed: ${response.status} ${args.url}`);
  const raw = await response.text();
  const title = args.title || raw.match(/<title[^>]*>(.*?)<\/title>/i)?.[1]?.trim() || args.url;
  return ingestDocument({ text: cleanText(raw), source_type: "web", title, url: args.url });
}

function validatePublicUrl(value) {
  const url = new URL(value);
  if (!["http:", "https:"].includes(url.protocol)) throw new Error("Only http/https URLs are allowed");
  const host = url.hostname.toLowerCase();
  if (
    host === "localhost" ||
    host.endsWith(".local") ||
    host === "127.0.0.1" ||
    host === "::1" ||
    /^10\./.test(host) ||
    /^192\.168\./.test(host) ||
    /^169\.254\./.test(host) ||
    /^172\.(1[6-9]|2\d|3[0-1])\./.test(host)
  ) {
    throw new Error("Private or localhost URLs are blocked for brain_ingest_url");
  }
}

function qdrantFilter(args) {
  const must = [];
  if (args.repo) must.push({ key: "repo", match: { value: args.repo } });
  if (args.source_type) must.push({ key: "source_type", match: { value: args.source_type } });
  if (args.doc_type) must.push({ key: "doc_type", match: { value: args.doc_type } });
  return must.length ? { must } : undefined;
}

async function search(args) {
  const mode = args.mode || "semantic";
  if (mode === "keyword") return keywordSearch(args);
  const vector = await embed(args.query);
  const requestedLimit = resultLimit(args.limit, SEARCH_LIMIT);
  const output = textOptions(args, SEARCH_MAX_CHARS);
  const body = {
    vector,
    limit: mode === "hybrid" ? Math.max(requestedLimit * 4, requestedLimit) : requestedLimit,
    with_payload: true,
    filter: qdrantFilter(args)
  };
  const json = await qdrant(`/collections/${COLLECTION}/points/search`, { method: "POST", body: JSON.stringify(body) });
  let results = (json.result || []).map((item) => ({
    compact: formatSearchResult(item, item.score, item.score, output),
    full: formatSearchResult(item, item.score, item.score, { include_text: true })
  }));
  if (mode === "hybrid") {
    results = results
      .map((item) => {
        const lex = lexicalScore(args.query, item.full);
        return { ...item.compact, lexical_score: lex, score: item.compact.score + lex * 0.2 };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, requestedLimit);
  } else {
    results = results.map((item) => item.compact);
  }
  return results.slice(0, requestedLimit);
}

function formatSearchResult(item, score, vectorScore, options = {}) {
  const includeText = options.include_text !== false;
  const rawText = item.payload?.text;
  const text = includeText ? truncateText(rawText, options.max_chars) : undefined;
  return {
    score,
    vector_score: vectorScore,
    source_path: item.payload?.source_path,
    relative_path: item.payload?.relative_path,
    folder: item.payload?.folder,
    source_type: item.payload?.source_type,
    doc_type: item.payload?.doc_type,
    language: item.payload?.language,
    repo: item.payload?.repo,
    title: item.payload?.title,
    url: item.payload?.url,
    heading_path: item.payload?.heading_path,
    chunk_index: item.payload?.chunk_index,
    tags: item.payload?.tags,
    ...(includeText && text !== undefined ? { text, truncated: rawText !== text } : {})
  };
}

function lexicalTerms(query) {
  return [...new Set(String(query || "").toLowerCase().match(/[\p{L}\p{N}_.$/-]{2,}/gu) || [])];
}

function lexicalScore(query, item) {
  const terms = lexicalTerms(query);
  if (!terms.length) return 0;
  const haystack = [item.text, item.title, item.relative_path, item.source_path, item.heading_path, item.doc_type, item.language, ...(item.tags || [])]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  let hits = 0;
  for (const term of terms) if (haystack.includes(term)) hits++;
  return hits / terms.length;
}

async function keywordSearch(args) {
  const requestedLimit = resultLimit(args.limit, SEARCH_LIMIT);
  const output = textOptions(args, SEARCH_MAX_CHARS);
  const points = await scrollPayloads(qdrantFilter(args), 2000);
  return points
    .map((item) => {
      const full = formatSearchResult(item, 0, undefined, { include_text: true });
      const formatted = formatSearchResult(item, 0, undefined, output);
      return { ...formatted, score: lexicalScore(args.query, full) };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, requestedLimit);
}

async function searchContext(args) {
  const neighbors = nonNegativeInt(args.neighbors, 1);
  const limit = resultLimit(args.limit, CONTEXT_LIMIT);
  const output = textOptions(args, CONTEXT_MAX_CHARS);
  const hits = await search({ ...args, limit, mode: args.mode || "hybrid", max_chars: output.max_chars, include_text: output.include_text });
  const contexts = [];
  for (const hit of hits) {
    const sourceKey = hit.source_path ? "source_path" : hit.url ? "url" : undefined;
    const sourceValue = hit.source_path || hit.url;
    if (!sourceKey || sourceValue === undefined || hit.chunk_index === undefined) {
      contexts.push({ hit, context: [hit] });
      continue;
    }
    const min = hit.chunk_index - neighbors;
    const max = hit.chunk_index + neighbors;
    const points = await scrollPayloads({
      must: [
        { key: sourceKey, match: { value: sourceValue } },
        { key: "chunk_index", range: { gte: min, lte: max } }
      ]
    }, Math.max(1, neighbors * 2 + 1));
    const context = points
      .map((point) => formatSearchResult(point, point.payload?.chunk_index === hit.chunk_index ? hit.score : undefined, undefined, output))
      .filter((point) => point.chunk_index >= min && point.chunk_index <= max)
      .sort((a, b) => a.chunk_index - b.chunk_index);
    contexts.push({ hit, context });
  }
  return contexts;
}

async function scrollPayloads(filter, max = 1000) {
  const points = [];
  let offset;
  while (points.length < max) {
    const body = { limit: Math.min(100, max - points.length), with_payload: true, with_vector: false, filter, offset };
    const json = await qdrant(`/collections/${COLLECTION}/points/scroll`, { method: "POST", body: JSON.stringify(body) });
    points.push(...(json.result?.points || []));
    offset = json.result?.next_page_offset;
    if (!offset) break;
  }
  return points;
}

async function status(args = {}) {
  const out = {
    brain_root: BRAIN_ROOT,
    lmstudio_embed_url: LMSTUDIO_EMBED_URL,
    embed_model: EMBED_MODEL,
    qdrant_url: QDRANT_URL,
    collection: COLLECTION,
    reindex_on_startup: REINDEX_ON_STARTUP,
    watch_enabled: WATCH_ENABLED,
    watch_status: watchStatus,
    reindex_interval_ms: REINDEX_INTERVAL_MS,
    active_reindex: Boolean(activeReindex),
    last_reindex: lastReindex
  };
  if (args.deep) {
    try {
      const test = await embed("status check");
      out.embedding_dimension = test.length;
      out.lmstudio = "ok";
    } catch (err) {
      out.lmstudio = `error: ${err.message}`;
    }
  } else {
    out.lmstudio = "not checked; use deep=true";
  }
  try {
    const collection = await qdrant(`/collections/${COLLECTION}`);
    out.qdrant = "ok";
    out.points_count = collection.result?.points_count ?? collection.result?.vectors_count;
  } catch (err) {
    out.qdrant = `error: ${err.message}`;
  }
  return out;
}

async function reindex(args) {
  let root;
  if (args.path) {
    root = await resolveBrainPath(args.path);
  } else if (args.repo) {
    // Legacy support: try Repos/<repo>/ first, then look for project wiki
    try {
      root = await resolveBrainPath(path.join("Repos", args.repo));
    } catch {
      throw new Error(`Cannot resolve path for repo "${args.repo}". Use the "path" parameter with the project wiki absolute path.`);
    }
  } else {
    root = BRAIN_ROOT;
  }
  let files = (await listFiles(root)).filter((file) => file.toLowerCase().endsWith(".md"));
  if (args.limit) files = files.slice(0, args.limit);
  let indexedFiles = 0;
  let chunks = 0;
  for (const file of files) {
    const source = await readSource(file, "markdown");
    const ingested = await ingestDocument({ text: source.text, source_path: file, source_type: "markdown", title: path.basename(file) });
    indexedFiles++;
    chunks += ingested.chunks;
  }
  return { indexedFiles, chunks, collection: COLLECTION };
}

async function runReindex(args = {}, reason = "manual") {
  if (activeReindex) {
    return { already_running: true, last_reindex: lastReindex };
  }
  const started_at = new Date().toISOString();
  activeReindex = (async () => {
    try {
      const result = await reindex(args);
      lastReindex = { reason, started_at, finished_at: new Date().toISOString(), ok: true, ...result };
      return lastReindex;
    } catch (err) {
      lastReindex = { reason, started_at, finished_at: new Date().toISOString(), ok: false, error: err.message };
      throw err;
    } finally {
      activeReindex = null;
    }
  })();
  return activeReindex;
}

function backgroundReindex(reason) {
  void runReindex({}, reason).catch((err) => {
    console.error(`[brain-rag] ${reason} reindex failed: ${err.message}`);
  });
}

function scheduleWatchReindex(eventType, filename) {
  if (!filename || !/\.(md|txt|pdf)$/i.test(String(filename))) return;
  clearTimeout(watchTimer);
  watchTimer = setTimeout(() => backgroundReindex(`watch:${eventType}`), WATCH_DEBOUNCE_MS);
}

function startAutomation() {
  if (REINDEX_ON_STARTUP) {
    setTimeout(() => backgroundReindex("startup"), 1000);
  }

  if (WATCH_ENABLED) {
    try {
      watch(BRAIN_ROOT, { recursive: true }, scheduleWatchReindex);
      watchStatus = "active";
    } catch (err) {
      watchStatus = `error: ${err.message}`;
      console.error(`[brain-rag] watcher failed: ${err.message}`);
    }
  }

  if (REINDEX_INTERVAL_MS > 0) {
    setInterval(() => backgroundReindex("periodic"), REINDEX_INTERVAL_MS);
  }
}

async function callTool(name, args = {}) {
  if (name === "brain_status") return status(args);
  if (name === "brain_reindex") return runReindex(args, "manual");
  if (name === "brain_ingest_path") return ingestPath(args);
  if (name === "brain_ingest_url") return ingestUrl(args);
  if (name === "brain_search") return search(args);
  if (name === "brain_search_context") return searchContext(args);
  throw new Error(`Unknown tool: ${name}`);
}

async function handle(message) {
  const { id, method, params } = message;
  if (method === "initialize") {
    result(id, {
      protocolVersion: "2024-11-05",
      capabilities: { tools: {} },
      serverInfo: { name: "brain-rag-mcp", version: "0.1.0" }
    });
    return;
  }
  if (method === "ping") {
    result(id, {});
    return;
  }
  if (method === "notifications/initialized") return;
  if (method === "tools/list") {
    result(id, { tools });
    return;
  }
  if (method === "tools/call") {
    try {
      result(id, textResult(await callTool(params?.name, params?.arguments || {})));
    } catch (err) {
      result(id, { content: [{ type: "text", text: `Error: ${err.message}` }], isError: true });
    }
    return;
  }
  if (id !== undefined) error(id, -32601, `Method not found: ${method}`);
}

let buffer = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk) => {
  buffer += chunk;
  let idx;
  while ((idx = buffer.indexOf("\n")) >= 0) {
    const line = buffer.slice(0, idx).trim();
    buffer = buffer.slice(idx + 1);
    if (!line) continue;
    try {
      void handle(JSON.parse(line));
    } catch (err) {
      error(null, -32700, err.message);
    }
  }
});

startAutomation();
