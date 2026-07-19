import { existsSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const desktopRoot = path.join(__dirname, "..");
const secretsPath = path.join(desktopRoot, ".release-secrets.local");

function loadLocalSecrets() {
  if (!existsSync(secretsPath)) return;

  const text = readFileSync(secretsPath, "utf8");
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (key && !process.env[key]) {
      process.env[key] = value;
    }
  }
}

loadLocalSecrets();

// Prefer Keychain when Developer ID cert is already installed; .p12 is optional.
if (!process.env.CSC_LINK) {
  process.env.CSC_LINK = path.join(process.env.HOME ?? "", "Desktop", "DeveloperID.p12");
}

function hasDeveloperIdInKeychain() {
  if (process.platform !== "darwin") return false;
  try {
    const out = spawnSync("security", ["find-identity", "-v", "-p", "codesigning"], {
      encoding: "utf8",
    });
    return /Developer ID Application:/.test(out.stdout ?? "");
  } catch {
    return false;
  }
}

const useP12 = Boolean(process.env.CSC_KEY_PASSWORD?.trim() && existsSync(process.env.CSC_LINK?.trim() ?? ""));
const useKeychain = !useP12 && hasDeveloperIdInKeychain();

if (useP12) {
  delete process.env.CSC_NAME;
} else if (useKeychain) {
  delete process.env.CSC_LINK;
  delete process.env.CSC_KEY_PASSWORD;
  console.log("[landed] Using Developer ID certificate from Keychain (no .p12 needed).\n");
} else if (existsSync(process.env.CSC_LINK?.trim() ?? "")) {
  console.error("[landed] .p12 found but CSC_KEY_PASSWORD is wrong or missing.");
  console.error("[landed] Fix CSC_KEY_PASSWORD in .release-secrets.local, or re-export from Keychain.\n");
}

const required = [
  ["APPLE_ID", "Apple ID for your Developer account"],
  ["APPLE_APP_SPECIFIC_PASSWORD", "App-specific password — add to .release-secrets.local"],
  ["APPLE_TEAM_ID", "Team ID from developer.apple.com/account"],
];

if (useP12) {
  required.push(["CSC_KEY_PASSWORD", "P12 export password — add to .release-secrets.local"]);
} else if (!useKeychain) {
  required.push(["CSC_KEY_PASSWORD", "P12 export password, or install cert in Keychain Access"]);
}

const missing = required.filter(([key]) => !process.env[key]?.trim());
if (missing.length) {
  console.error("[landed] Missing release signing secrets.\n");
  console.error("Edit desktop/.release-secrets.local and fill in the empty password lines, then save.\n");
  for (const [key, hint] of missing) {
    console.error(`  ${key}  — ${hint}`);
  }
  process.exit(1);
}

const p12 = process.env.CSC_LINK?.trim();
if (useP12 && p12 && !existsSync(p12)) {
  console.error(`[landed] Certificate file not found: ${p12}`);
  console.error("[landed] Check CSC_LINK in .release-secrets.local (Desktop filename may differ).");
  process.exit(1);
}

console.log("[landed] Building signed + notarized Landed.dmg (secrets stay local — not committed).\n");

const result = spawnSync("npm", ["run", "package:mac"], {
  cwd: desktopRoot,
  stdio: "inherit",
  env: { ...process.env, LANDED_RELEASE_SIGN: "1" },
  shell: true,
});

process.exit(result.status ?? 1);
