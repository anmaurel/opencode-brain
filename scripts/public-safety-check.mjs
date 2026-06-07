import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const failures = [];
const warnings = [];

function fail(message) {
  failures.push(message);
}

function warn(message) {
  warnings.push(message);
}

async function git(args, options = {}) {
  try {
    const { stdout } = await execFileAsync("git", args, { timeout: 10000, ...options });
    return stdout.trim();
  } catch (err) {
    if (options.allowFailure) return `${err.stdout || ""}${err.stderr || ""}`.trim();
    throw err;
  }
}

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function listCandidates() {
  const out = await git(["ls-files", "--cached", "--others", "--exclude-standard", "-z"]);
  return out ? out.split("\0").filter(Boolean) : [];
}

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const forbiddenFiles = new Set(["opencode.json", "package-lock.json", ".env", ".env.local", ".DS_Store"]);
const forbiddenPathParts = ["node_modules", ".git"];
const currentUser = escapeRegex(os.userInfo().username);
const contentPatterns = [
  { name: "private local path", regex: new RegExp(`/(?:Users/${currentUser}|var/folders)/`) },
  { name: "private key header", regex: /BEGIN (?:RSA |OPENSSH |EC |DSA )?PRIVATE KEY/ },
  { name: "OpenAI-like key", regex: /\bsk-[A-Za-z0-9_-]{16,}\b/ },
  { name: "GitHub token", regex: /\bgh[pousr]_[A-Za-z0-9_]{20,}\b/ },
  { name: "Slack token", regex: /\bxox[baprs]-[A-Za-z0-9-]{20,}\b/ },
  { name: "AWS access key", regex: /\bAKIA[0-9A-Z]{16}\b/ },
  { name: "Google API key", regex: /\bAIza[0-9A-Za-z_-]{20,}\b/ },
  { name: "raw env assignment", regex: /^(?:API|APP|AUTH|CLIENT|DISCORD|GITHUB|GOOGLE|OPENAI|SECRET|TOKEN|PASSWORD|PRIVATE|AWS)_[A-Z0-9_]*\s*=\s*[^\s#]+/m }
];

const candidates = await listCandidates();

if (!(await fileExists("bun.lock"))) fail("Expected Bun lockfile to be versioned: bun.lock");

for (const file of candidates) {
  const base = path.basename(file);
  if (forbiddenFiles.has(file) || forbiddenFiles.has(base) || (/^\.env\./.test(base) && base !== ".env.example")) {
    fail(`Forbidden candidate file: ${file}`);
  }
  if (file.split(path.sep).some((part) => forbiddenPathParts.includes(part))) {
    fail(`Forbidden candidate path: ${file}`);
  }
  if (!(await fileExists(file))) continue;
  const stat = await fs.stat(file);
  if (!stat.isFile() || stat.size > 2_000_000) continue;
  const text = await fs.readFile(file, "utf8").catch(() => "");
  for (const pattern of contentPatterns) {
    if (pattern.name === "raw env assignment" && /\.(md|markdown)$/i.test(file)) continue;
    if (pattern.regex.test(text)) fail(`${pattern.name} pattern in ${file}`);
  }
}

for (const file of ["opencode.json", ".env", ".env.local", ".DS_Store", "package-lock.json"]) {
  try {
    await execFileAsync("git", ["check-ignore", "-q", file], { timeout: 5000 });
  } catch {
    fail(`Expected ${file} to be ignored by git`);
  }
}

try {
  await execFileAsync("git", ["check-ignore", "-q", ".env.example"], { timeout: 5000 });
  fail("Expected .env.example to be versionable, but it is ignored by git");
} catch {
  // Expected: .env.example should not be ignored.
}

const historical = await git(["log", "--all", "--format=%H", "--", "opencode.json", ".env", ".env.local", "package-lock.json"], { allowFailure: true });
if (historical) fail("Sensitive/generated files appear in git history: opencode.json/.env/package-lock.json");

const staged = await git(["diff", "--cached", "--name-only", "-z"], { allowFailure: true });
for (const file of staged ? staged.split("\0").filter(Boolean) : []) {
  const base = path.basename(file);
  if (forbiddenFiles.has(file) || forbiddenFiles.has(base) || (/^\.env\./.test(base) && base !== ".env.example")) fail(`Forbidden staged file: ${file}`);
}

for (const message of warnings) console.log(`WARN ${message}`);
if (failures.length) {
  for (const message of failures) console.error(`FAIL ${message}`);
  process.exit(1);
}

console.log(`OK public safety check passed (${candidates.length} candidate files scanned)`);
