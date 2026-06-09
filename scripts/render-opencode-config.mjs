import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const configDir = process.env.OPENCODE_CONFIG_DIR || path.resolve(scriptDir, "..");
const home = os.homedir();

async function exists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

function parseEnv(content) {
  const values = {};
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (!match) continue;
    let value = match[2].trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    values[match[1]] = value;
  }
  return values;
}

async function readEnvFile(filePath) {
  if (!(await exists(filePath))) return {};
  return parseEnv(await fs.readFile(filePath, "utf8"));
}

function expandEnvValue(value, env) {
  return value
    .replace(/^~(?=$|\/)/, home)
    .replace(/\$\{([A-Za-z_][A-Za-z0-9_]*)\}/g, (_, name) => env[name] ?? "")
    .replace(/\$([A-Za-z_][A-Za-z0-9_]*)/g, (_, name) => env[name] ?? "");
}

const envFromFile = {
  HOME: home,
  OPENCODE_CONFIG_DIR: configDir,
  ...(await readEnvFile(path.join(configDir, ".env.example"))),
  ...(await readEnvFile(path.join(configDir, ".env"))),
};

// Only use process.env for non-OPENCODE vars (shell env like PATH, HOME, etc.)
// OPENCODE vars must come from .env files to respect mode switching.
const envExternal = Object.fromEntries(
  Object.entries(process.env).filter(([key]) => !key.startsWith("OPENCODE_") && !key.startsWith("BRAIN_"))
);

const env = {
  ...envFromFile,
  ...envExternal,
  ...(await readEnvFile(path.join(configDir, ".env.local")))
};

for (const [key, value] of Object.entries(env)) {
  if (typeof value === "string") env[key] = expandEnvValue(value, env);
}

function expand(value) {
  if (Array.isArray(value)) return value.map(expand);
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([key, val]) => [key, expand(val)]));
  if (typeof value !== "string") return value;
  return expandEnvValue(value, env);
}

function unresolvedVariables(value, found = []) {
  if (Array.isArray(value)) {
    for (const item of value) unresolvedVariables(item, found);
  } else if (value && typeof value === "object") {
    for (const item of Object.values(value)) unresolvedVariables(item, found);
  } else if (typeof value === "string") {
    for (const match of value.matchAll(/\$[A-Za-z_][A-Za-z0-9_]*|\$\{[A-Za-z_][A-Za-z0-9_]*(?::-[^}]*)?\}/g)) found.push(match[0]);
  }
  return found;
}

function envBool(name, fallback = false) {
  const value = env[name];
  if (value === undefined || value === "") return fallback;
  return ["1", "true", "yes", "on"].includes(String(value).toLowerCase());
}

function envInt(name, fallback) {
  const parsed = Number(env[name]);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : fallback;
}

function setBrainAccess(agent, enabled) {
  if (!agent || typeof agent !== "object") return;
  if (agent.tools) {
    if ("brain_fs*" in agent.tools) agent.tools["brain_fs*"] = enabled;
    if ("brain_rag*" in agent.tools) agent.tools["brain_rag*"] = enabled;
  }
  if (agent.permission) {
    if ("brain_fs*" in agent.permission) agent.permission["brain_fs*"] = enabled ? "allow" : "deny";
    if ("brain_rag*" in agent.permission) agent.permission["brain_rag*"] = enabled ? "allow" : "deny";
  }
}

function applyTokenProfile(config) {
  const brainEnabled = envBool("BRAIN_ENABLED", true);
  const memoryEnabled = envBool("BRAIN_MEMORY_ENABLED", false);

  config.tool_output ??= {};
  config.tool_output.max_lines = envInt("OPENCODE_TOOL_MAX_LINES", Number(config.tool_output.max_lines) || 120);
  config.tool_output.max_bytes = envInt("OPENCODE_TOOL_MAX_BYTES", Number(config.tool_output.max_bytes) || 12000);

  config.compaction ??= {};
  config.compaction.tail_turns = envInt("OPENCODE_COMPACTION_TAIL_TURNS", Number(config.compaction.tail_turns) || 3);
  config.compaction.preserve_recent_tokens = envInt("OPENCODE_COMPACTION_PRESERVE_TOKENS", Number(config.compaction.preserve_recent_tokens) || 6000);
  config.compaction.reserved = envInt("OPENCODE_COMPACTION_RESERVED", Number(config.compaction.reserved) || 10000);

  if (config.mcp?.brain_fs) config.mcp.brain_fs.enabled = brainEnabled;
  if (config.mcp?.brain_rag) {
    config.mcp.brain_rag.enabled = brainEnabled;
    config.mcp.brain_rag.environment ??= {};
    config.mcp.brain_rag.environment.BRAIN_MEMORY_ENABLED = String(memoryEnabled);
  }

  if (config.tools) {
    config.tools["brain_fs*"] = false;
    config.tools["brain_rag*"] = false;
  }
  if (config.permission) {
    config.permission["brain_fs*"] = "deny";
    config.permission["brain_rag*"] = "deny";
  }

  if (config.agent) {
    for (const agent of Object.values(config.agent)) setBrainAccess(agent, brainEnabled);
    if (!brainEnabled) delete config.agent.brain;

    // Lean default: avoid subagent fan-out unless explicitly requested.
    if (config.agent.build?.permission?.task) {
      config.agent.build.permission.task = {
        "*": "deny",
        explore: "allow",
        debug: "allow"
      };
    }
  }

  return config;
}

const inputPath = path.join(configDir, "opencode.example.json");
const outputPath = path.join(configDir, "opencode.json");
const config = applyTokenProfile(expand(JSON.parse(await fs.readFile(inputPath, "utf8"))));
const rendered = JSON.stringify(config, null, 2);
const unresolved = unresolvedVariables(config);

await fs.writeFile(outputPath, `${rendered}\n`);
console.log(`Wrote ${outputPath}`);
if (unresolved.length) console.warn(`Warning: unresolved variables: ${[...new Set(unresolved)].join(", ")}`);
