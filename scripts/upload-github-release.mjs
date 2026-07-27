import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { ensureNodePath, repoRoot } from "./ensure-node-path.mjs";
import { verifyMacDmg } from "./verify-mac-dmg.mjs";

ensureNodePath();

const dmgPath = path.join(repoRoot, "desktop", "release", "Landed.dmg");
const repo =
  process.env.GITHUB_RELEASE_REPO?.trim() ||
  process.env.GITHUB_REPOSITORY?.trim() ||
  "archuenmsnmmm/landed";

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
  console.error("[upload-github-release] Not found:", dmgPath);
  console.error("[upload-github-release] Run: npm run desktop:package");
  process.exit(1);
}

const tag =
  process.argv.find((arg) => arg.startsWith("--tag="))?.slice(6)?.trim() ||
  process.env.DOWNLOAD_RELEASE_TAG?.trim() ||
  `v${JSON.parse(readFileSync(path.join(repoRoot, "package.json"), "utf8")).version}`;

verifyMacDmg(dmgPath, { requireNotarized: true });

console.log(`[upload-github-release] Uploading ${path.basename(dmgPath)} to ${repo} ${tag}…`);

const result = spawnSync(
  "gh",
  ["release", "upload", tag, dmgPath, "--repo", repo, "--clobber"],
  { cwd: repoRoot, stdio: "inherit", env: process.env },
);

if (result.status !== 0) {
  console.error("[upload-github-release] Upload failed.");
  process.exit(result.status ?? 1);
}

console.log("[upload-github-release] Done.");
console.log(`  https://github.com/${repo}/releases/tag/${tag}`);
