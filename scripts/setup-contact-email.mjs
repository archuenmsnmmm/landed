#!/usr/bin/env node
/**
 * Generate CONTACT_WEBHOOK_SECRET and open Google Apps Script for contact email setup.
 * Gmail app passwords are often unavailable — this uses Apps Script + GmailApp instead.
 *
 * Usage:
 *   node scripts/setup-contact-email.mjs
 *   CONTACT_APPS_SCRIPT_URL=https://script.google.com/... node scripts/setup-contact-email.mjs --vercel
 */
import { randomBytes } from "node:crypto";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const repoRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const templatePath = path.join(repoRoot, "scripts/gmail-apps-script-contact.gs");
const envPath = path.join(repoRoot, ".env");
const deployToVercel = process.argv.includes("--vercel");

function loadEnv(file) {
  if (!existsSync(file)) return {};
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

function upsertEnv(key, value) {
  const line = `${key}=${value}`;
  if (!existsSync(envPath)) {
    writeFileSync(envPath, `${line}\n`, "utf8");
    return;
  }
  const text = readFileSync(envPath, "utf8");
  const re = new RegExp(`^${key}=.*$`, "m");
  writeFileSync(envPath, re.test(text) ? text.replace(re, line) : `${text.trimEnd()}\n${line}\n`, "utf8");
}

function addVercelEnv(key, value) {
  const result = spawnSync("npx", ["vercel@latest", "env", "add", key, "production", "--yes"], {
    cwd: repoRoot,
    input: value,
    encoding: "utf8",
    stdio: ["pipe", "inherit", "inherit"],
  });
  if (result.status !== 0) {
    console.error(`[setup] Failed to set Vercel env ${key}`);
    process.exit(result.status ?? 1);
  }
  console.log(`[setup] Vercel env set: ${key}`);
}

const env = loadEnv(envPath);
let secret = env.CONTACT_WEBHOOK_SECRET?.trim();
if (!secret || secret.length < 16) {
  secret = randomBytes(24).toString("hex");
  upsertEnv("CONTACT_WEBHOOK_SECRET", secret);
  console.log("[setup] Generated CONTACT_WEBHOOK_SECRET in .env");
}

const script = readFileSync(templatePath, "utf8").replace(
  'const WEBHOOK_SECRET = "YOUR_WEBHOOK_SECRET";',
  `const WEBHOOK_SECRET = "${secret}";`,
);
const outPath = path.join(repoRoot, "scripts/gmail-apps-script-contact.ready.gs");
writeFileSync(outPath, script, "utf8");

console.log("\n=== Landed contact email (Google Apps Script) ===\n");
console.log("Gmail app passwords are blocked on your account — use this instead.\n");
console.log("1. Open https://script.google.com/create (signed into your sending Gmail)");
console.log(`2. Paste the contents of:\n   ${outPath}`);
console.log("3. Deploy → New deployment → Web app");
console.log("   Execute as: Me");
console.log("   Who has access: Anyone");
console.log("4. Copy the web app URL and run:");
console.log("   CONTACT_APPS_SCRIPT_URL='https://script.google.com/...' node scripts/setup-contact-email.mjs --vercel\n");

const appsScriptUrl = process.env.CONTACT_APPS_SCRIPT_URL?.trim() || env.CONTACT_APPS_SCRIPT_URL?.trim();
if (deployToVercel && appsScriptUrl) {
  upsertEnv("CONTACT_APPS_SCRIPT_URL", appsScriptUrl);
  addVercelEnv("CONTACT_WEBHOOK_SECRET", secret);
  addVercelEnv("CONTACT_APPS_SCRIPT_URL", appsScriptUrl);
  console.log("[setup] Done — redeploy with: npx vercel --prod --yes");
} else if (deployToVercel) {
  console.error("[setup] Set CONTACT_APPS_SCRIPT_URL first, then re-run with --vercel");
  process.exit(1);
}

if (process.platform === "darwin") {
  spawnSync("open", ["https://script.google.com/create"], { stdio: "ignore" });
  spawnSync("open", [outPath], { stdio: "ignore" });
}
