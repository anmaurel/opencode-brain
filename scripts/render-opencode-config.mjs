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

const inputPath = path.join(configDir, "opencode.example.json");
const outputPath = path.join(configDir, "opencode.json");
const config = expand(JSON.parse(await fs.readFile(inputPath, "utf8")));
const rendered = JSON.stringify(config, null, 2);
const unresolved = unresolvedVariables(config);

await fs.writeFile(outputPath, `${rendered}\n`);
console.log(`Wrote ${outputPath}`);
if (unresolved.length) console.warn(`Warning: unresolved variables: ${[...new Set(unresolved)].join(", ")}`);
