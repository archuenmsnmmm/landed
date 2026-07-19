import { writeFileSync, existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, "..", ".env");

const KEYS = [
  "VITE_SUPABASE_URL",
  "VITE_SUPABASE_ANON_KEY",
  "VITE_LEGAL_BASE_URL",
  "VITE_API_BASE_URL",
  "VITE_GOOGLE_CLIENT_ID",
];

const DEFAULTS = {
  VITE_LEGAL_BASE_URL: "https://landed-ai.com",
  VITE_API_BASE_URL: "https://landed-ai.com",
  VITE_GOOGLE_CLIENT_ID:
    "821453006387-snrakrrq6n17m5pde2nfshmnf8nanmc6.apps.googleusercontent.com",
};

/** Never bake localhost into packaged desktop builds for public site/API URLs. */
function sanitizePublicUrl(key, value) {
  if (
    (key === "VITE_LEGAL_BASE_URL" || key === "VITE_API_BASE_URL") &&
    value &&
    (value.includes("localhost") || value.includes("127.0.0.1"))
  ) {
    console.warn(
      `[landed] Ignoring localhost ${key}=${value} — using ${DEFAULTS[key]}`,
    );
    return DEFAULTS[key];
  }
  return value;
}

function parseEnvFile(contents) {
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
    if (key) vars[key] = value;
  }
  return vars;
}

const existingEnv = existsSync(envPath)
  ? parseEnvFile(readFileSync(envPath, "utf8"))
  : {};

const REQUIRED = ["VITE_SUPABASE_URL", "VITE_SUPABASE_ANON_KEY"];

const lines = ["# Generated for CI / release packaging — do not commit secrets manually."];
const missing = [];

for (const key of KEYS) {
  const value = sanitizePublicUrl(
    key,
    process.env[key]?.trim() || existingEnv[key]?.trim() || DEFAULTS[key] || "",
  );
  if (!value && REQUIRED.includes(key)) {
    missing.push(key);
  }
  lines.push(`${key}=${value}`);
}

if (missing.length > 0) {
  console.error("[landed] Missing required env for desktop packaging:");
  for (const key of missing) {
    console.error(`  ${key}`);
  }
  console.error(
    "[landed] Set GitHub Actions secrets or export vars locally before packaging.",
  );
  process.exit(1);
}

writeFileSync(envPath, `${lines.join("\n")}\n`, "utf8");
console.log(`[landed] Wrote ${envPath} for packaging (${KEYS.length} keys).`);
