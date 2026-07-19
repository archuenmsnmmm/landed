import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const repo = "archuenmsnmmm/landed";
const envPath = path.join(repoRoot, "desktop", ".env");

const SECRETS = [
  "VITE_SUPABASE_URL",
  "VITE_SUPABASE_ANON_KEY",
  "VITE_GOOGLE_CLIENT_ID",
  "VITE_API_BASE_URL",
  "VITE_LEGAL_BASE_URL",
];

function parseEnv(contents) {
  const vars = {};
  for (const line of contents.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    vars[key] = value;
  }
  return vars;
}

const vars = parseEnv(readFileSync(envPath, "utf8"));
let set = 0;
let skipped = 0;

for (const key of SECRETS) {
  const value = vars[key]?.trim();
  if (!value) {
    console.log(`[secrets] skip ${key} (empty)`);
    skipped += 1;
    continue;
  }

  const result = spawnSync(
    "gh",
    ["secret", "set", key, "-R", repo, "-b", value],
    { stdio: "pipe", encoding: "utf8" },
  );

  if (result.status !== 0) {
    console.error(`[secrets] failed ${key}: ${result.stderr?.trim() || "unknown error"}`);
    process.exit(result.status ?? 1);
  }

  console.log(`[secrets] set ${key}`);
  set += 1;
}

console.log(`[secrets] Done (${set} set, ${skipped} skipped).`);
