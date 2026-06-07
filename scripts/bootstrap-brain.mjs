import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const configDir = process.env.OPENCODE_CONFIG_DIR || path.resolve(scriptDir, "..");
const templateDir = path.join(configDir, "brain-template");
const brainRootInput = (process.env.BRAIN_ROOT || path.join(os.homedir(), "brain")).trim();
if (!brainRootInput) {
  console.error("BRAIN_ROOT is empty. Unset it or set it to an absolute Brain vault path.");
  process.exit(1);
}
const brainRoot = path.resolve(brainRootInput.replace(/^~(?=$|\/)/, os.homedir()));

const created = [];
const skipped = [];

async function exists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function copyMissing(from, to) {
  if ([".DS_Store", ".gitkeep"].includes(path.basename(from))) return;
  const stat = await fs.stat(from);
  if (stat.isDirectory()) {
    if (!(await exists(to))) {
      await fs.mkdir(to, { recursive: true });
      created.push(path.relative(brainRoot, to) || ".");
    }
    for (const entry of await fs.readdir(from)) {
      await copyMissing(path.join(from, entry), path.join(to, entry));
    }
    return;
  }

  if (await exists(to)) {
    skipped.push(path.relative(brainRoot, to));
    return;
  }

  await fs.mkdir(path.dirname(to), { recursive: true });
  await fs.copyFile(from, to);
  created.push(path.relative(brainRoot, to));
}

if (!(await exists(templateDir))) {
  console.error(`Missing Brain template: ${templateDir}`);
  process.exit(1);
}

await fs.mkdir(brainRoot, { recursive: true });
await copyMissing(templateDir, brainRoot);

console.log(`Brain root: ${brainRoot}`);
console.log(`Created: ${created.length ? created.join(", ") : "none"}`);
console.log(`Skipped existing: ${skipped.length ? skipped.join(", ") : "none"}`);
console.log("Next: start LM Studio embeddings, start Qdrant, then run /brain-index or brain_reindex.");
