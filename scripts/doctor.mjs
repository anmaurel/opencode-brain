import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";

const execFileAsync = promisify(execFile);
const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const configDir = process.env.OPENCODE_CONFIG_DIR || path.resolve(scriptDir, "..");
const brainRootInput = (process.env.BRAIN_ROOT || path.join(os.homedir(), "brain")).trim();
const brainRoot = brainRootInput ? path.resolve(brainRootInput.replace(/^~(?=$|\/)/, os.homedir())) : "";
const deep = process.argv.includes("--deep");
const embedUrl = process.env.BRAIN_RAG_EMBED_URL || "http://localhost:1234/v1/embeddings";
const modelsUrl = new URL("/v1/models", embedUrl).toString();

const results = [];

function record(level, name, detail) {
  results.push({ level, name, detail });
}

async function exists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function command(name, args = ["--version"]) {
  try {
    const { stdout, stderr } = await execFileAsync(name, args, { timeout: 5000 });
    return (stdout || stderr).trim().split("\n")[0];
  } catch (err) {
    throw new Error(err.code === "ENOENT" ? "not found" : err.message);
  }
}

async function httpJson(url, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs || 3000);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    const text = await response.text();
    return { ok: response.ok, status: response.status, text };
  } finally {
    clearTimeout(timeout);
  }
}

if (process.platform === "darwin") record("OK", "macOS", os.release());
else record("WARN", "macOS", `expected darwin, got ${process.platform}`);

for (const [name, args] of [["bun", ["--version"]], ["docker", ["--version"]]]) {
  try {
    record("OK", name, await command(name, args));
  } catch (err) {
    record("FAIL", name, err.message);
  }
}

record((await exists(path.join(configDir, "opencode.json"))) ? "OK" : "FAIL", "opencode.json", path.join(configDir, "opencode.json"));
record((await exists(path.join(configDir, "brain-rag", "server.mjs"))) ? "OK" : "FAIL", "brain-rag server", path.join(configDir, "brain-rag", "server.mjs"));
record(brainRoot && (await exists(brainRoot)) ? "OK" : "WARN", "Brain root", brainRoot || "BRAIN_ROOT is empty");

try {
  const response = await httpJson("http://localhost:6333/collections");
  record(response.ok ? "OK" : "FAIL", "Qdrant", `HTTP ${response.status}`);
} catch (err) {
  record("FAIL", "Qdrant", `not reachable at http://localhost:6333 (${err.message})`);
}

try {
  const response = deep
    ? await httpJson(embedUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: process.env.BRAIN_RAG_EMBED_MODEL || "text-embedding-baai-bge-m3-568m", input: "doctor check" }),
        timeoutMs: 8000
      })
    : await httpJson(modelsUrl);
  record(response.ok ? "OK" : "WARN", deep ? "LM Studio embeddings" : "LM Studio models", `HTTP ${response.status}`);
} catch (err) {
  record("WARN", deep ? "LM Studio embeddings" : "LM Studio models", `not reachable at ${deep ? embedUrl : modelsUrl} (${err.message})`);
}

for (const item of results) {
  console.log(`${item.level.padEnd(4)} ${item.name}: ${item.detail}`);
}

if (results.some((item) => item.level === "FAIL")) {
  console.log("\nFix FAIL items before relying on Brain RAG. WARN items may be acceptable during initial setup.");
  process.exit(1);
}
