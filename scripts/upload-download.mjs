import { existsSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { ensureNodePath, repoRoot } from "./ensure-node-path.mjs";
import { verifyMacDmg } from "./verify-mac-dmg.mjs";

ensureNodePath();

const dmgPath = path.join(repoRoot, "public", "downloads", "Landed.dmg");
const blobPathname = "downloads/Landed.dmg";

function loadEnv() {
  for (const rel of [".env.local", ".env"]) {
    const envPath = path.join(repoRoot, rel);
    if (!existsSync(envPath)) continue;
    for (const line of readFileSync(envPath, "utf8").split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      const value = trimmed.slice(eq + 1).trim();
      if (key && !process.env[key]) process.env[key] = value;
    }
  }
}

loadEnv();

if (!existsSync(dmgPath)) {
  console.error("[upload-download] Not found:", dmgPath);
  console.error("[upload-download] Run: npm run sync-downloads");
  process.exit(1);
}

const token = process.env.BLOB_READ_WRITE_TOKEN?.trim();
if (!token) {
  console.error("[upload-download] Missing BLOB_READ_WRITE_TOKEN.");
  console.error("[upload-download] Run: npx vercel env pull .env.local");
  process.exit(1);
}

verifyMacDmg(dmgPath, { requireNotarized: true });

const size = statSync(dmgPath).size;
console.log(
  `[upload-download] Uploading Landed.dmg (${(size / 1024 / 1024).toFixed(1)} MB) to Vercel Blob…`,
);

const result = spawnSync(
  "npx",
  [
    "vercel",
    "blob",
    "put",
    dmgPath,
    "--pathname",
    blobPathname,
    "--access",
    "public",
    "--allow-overwrite",
    "true",
    "--rw-token",
    token,
  ],
  { cwd: repoRoot, stdio: "inherit", env: process.env, shell: true },
);

if (result.status !== 0) {
  console.error("[upload-download] Upload failed.");
  process.exit(result.status ?? 1);
}

console.log("[upload-download] Done. Update NEXT_PUBLIC_MAC_DOWNLOAD_URL if the URL changed.");
