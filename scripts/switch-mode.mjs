import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const configDir = path.resolve(scriptDir, "..");

const MODES = ["work", "perso-high", "perso-low"];

const mode = process.argv[2];
if (!mode || !MODES.includes(mode)) {
  console.error(`Usage: bun run switch <${MODES.join("|")}>`);
  process.exit(1);
}

const envFile = path.join(configDir, `.env.${mode}`);
const envTarget = path.join(configDir, ".env");

try {
  await fs.access(envFile);
} catch {
  console.error(`Missing: ${envFile}`);
  process.exit(1);
}

// Copy mode-specific .env
await fs.copyFile(envFile, envTarget);

// Render config (resolves $VAR in opencode.example.json → opencode.json)
execSync("bun run render-config", { cwd: configDir, stdio: "inherit" });

// Post-process: remove empty strings from arrays (e.g. empty $OPENCODE_EXTRA_PLUGIN)
const configPath = path.join(configDir, "opencode.json");
const config = JSON.parse(await fs.readFile(configPath, "utf8"));

function cleanArrays(obj) {
  if (Array.isArray(obj)) {
    const filtered = obj.filter((item) => item !== "").map(cleanArrays);
    return filtered.length === 0 && obj.length > 0 ? filtered : filtered;
  }
  if (obj && typeof obj === "object") {
    return Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, cleanArrays(v)]));
  }
  return obj;
}

const cleaned = cleanArrays(config);
await fs.writeFile(configPath, JSON.stringify(cleaned, null, 2) + "\n");

// Show active config
const env = parseEnv(await fs.readFile(envTarget, "utf8"));
console.log(`\nSwitched to: ${mode}`);
console.log(`  Model:  ${env.OPENCODE_MODEL_DEFAULT}`);
console.log(`  Small:  ${env.OPENCODE_MODEL_SMALL}`);
console.log(`  Huge:   ${env.OPENCODE_MODEL_HUGE}`);
console.log(`  Brain:  ${env.BRAIN_ENABLED === "true" ? "enabled" : "disabled"}`);
console.log(`  Memory: ${env.BRAIN_MEMORY_ENABLED === "true" ? "enabled" : "disabled"}`);
console.log(`  Output: ${env.OPENCODE_TOOL_MAX_LINES || "default"} lines / ${env.OPENCODE_TOOL_MAX_BYTES || "default"} bytes`);
console.log(`\nRestart OpenCode to apply changes.`);

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
