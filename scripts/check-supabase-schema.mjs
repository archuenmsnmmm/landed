import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

function loadEnv(file) {
  const vars = {};
  for (const line of readFileSync(file, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    vars[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim();
  }
  return vars;
}

const env = loadEnv(path.join(repoRoot, ".env"));
const url = env.SUPABASE_URL?.trim();
const key = env.SUPABASE_SERVICE_ROLE_KEY?.trim();

if (!url || !key) {
  console.error("[check] Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const checks = [
  { label: "profiles", path: "profiles?select=id&limit=1" },
  { label: "profiles.app_state", path: "profiles?select=app_state&limit=1" },
  { label: "payment_events", path: "payment_events?select=id&limit=1" },
];

for (const check of checks) {
  const response = await fetch(`${url.replace(/\/$/, "")}/rest/v1/${check.path}`, {
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
    },
  });

  if (response.ok) {
    console.log(`[check] ${check.label}: ok`);
    continue;
  }

  const body = await response.text();
  if (response.status === 404 || body.includes("does not exist")) {
    console.error(`[check] ${check.label}: MISSING`);
    process.exit(1);
  }

  console.log(`[check] ${check.label}: ${response.status} (${body.slice(0, 120)})`);
}

console.log("[check] Supabase schema looks ready.");
