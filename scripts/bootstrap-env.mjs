import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const configDir = process.env.OPENCODE_CONFIG_DIR || path.resolve(scriptDir, "..");
const examplePath = path.join(configDir, ".env.example");
const envPath = path.join(configDir, ".env");

async function exists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

if (!(await exists(examplePath))) {
  console.error(`Missing ${examplePath}`);
  process.exit(1);
}

if (await exists(envPath)) {
  console.log(`.env exists, skipped: ${envPath}`);
} else {
  await fs.copyFile(examplePath, envPath);
  console.log(`.env created: ${envPath}`);
}

console.log("After editing .env, run: bun run render-config");
