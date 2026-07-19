import { spawnSync } from "node:child_process";
import { cpSync, existsSync, readFileSync, rmSync } from "node:fs";
import path from "node:path";
import { clearMacQuarantine } from "../desktop/scripts/sign-mac-app.mjs";
import { ensureNodePath, repoRoot } from "./ensure-node-path.mjs";
import { syncDesktopRenderer } from "./sync-desktop-renderer.mjs";

ensureNodePath();

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

const desktopRoot = path.join(repoRoot, "desktop");
const releaseSecretsPath = path.join(desktopRoot, ".release-secrets.local");
const appVersion = JSON.parse(
  readFileSync(path.join(repoRoot, "package.json"), "utf8"),
).version;
const installedApp = "/Applications/Landed.app";
const skipPackage = process.argv.includes("--skip-package");
const skipOpen = process.argv.includes("--skip-open");

function run(command, args, { cwd = repoRoot, label = command } = {}) {
  console.log(`[update] ${label}…`);
  const result = spawnSync(command, args, {
    cwd,
    stdio: "inherit",
    env: process.env,
    shell: false,
  });
  if (result.status !== 0) {
    console.error(`[update] Failed: ${label}`);
    process.exit(result.status ?? 1);
  }
}

function runNpm(args, cwd, label) {
  run("npm", args, { cwd, label });
}

function quitLanded() {
  if (process.platform !== "darwin") return;
  spawnSync("osascript", [
    "-e",
    'tell application "Landed" to quit',
  ], { stdio: "ignore" });
  spawnSync("pkill", ["-x", "Landed"], { stdio: "ignore" });
  spawnSync("pkill", ["-f", "Landed.app/Contents/MacOS"], { stdio: "ignore" });
}

function clearQuarantine(appPath) {
  try {
    clearMacQuarantine(appPath);
  } catch (err) {
    console.warn(`[update] Could not clear quarantine on ${appPath}.`);
    if (err instanceof Error && err.message) {
      console.warn(`[update] ${err.message}`);
    }
  }
}

function hasReleaseSecrets() {
  if (!existsSync(releaseSecretsPath)) return false;
  const text = readFileSync(releaseSecretsPath, "utf8");
  return (
    /APPLE_ID=.+/.test(text) &&
    /APPLE_APP_SPECIFIC_PASSWORD=.+/.test(text) &&
    /APPLE_TEAM_ID=.+/.test(text)
  );
}

if (!skipPackage) {
  const packageScript = hasReleaseSecrets() ? "package:mac:release" : "package:mac";
  runNpm(["run", packageScript], desktopRoot, `Build Mac installer (${packageScript})`);
} else {
  runNpm(["run", "build"], desktopRoot, "Build desktop app");
}

run("node", ["scripts/sync-downloads.mjs"], repoRoot, "Sync web download files");
syncDesktopRenderer();

if (!skipPackage && process.env.BLOB_READ_WRITE_TOKEN?.trim()) {
  run("node", ["scripts/upload-download.mjs"], repoRoot, "Upload Mac DMG to Vercel Blob");
}

const packagedApp = path.join(desktopRoot, "release", "mac-arm64", "Landed.app");
let appToOpen = packagedApp;

if (process.platform === "darwin" && existsSync(packagedApp)) {
  quitLanded();
  console.log(`[update] Installing ${installedApp}…`);
  if (existsSync(installedApp)) {
    rmSync(installedApp, { recursive: true, force: true });
  }
  const copy = spawnSync("ditto", [packagedApp, installedApp], { stdio: "inherit" });
  if (copy.status === 0) {
    clearQuarantine(installedApp);
    appToOpen = installedApp;
    console.log(`[update] Installed ${installedApp}`);
  } else {
    console.warn("[update] Could not install to /Applications — using packaged build instead");
  }
} else if (process.platform === "darwin") {
  console.warn("[update] Packaged Landed.app not found — skipped /Applications install");
}

console.log("[update] Done.");
console.log("  • Web dev downloads: public/downloads/Landed.dmg");
if (process.env.BLOB_READ_WRITE_TOKEN?.trim()) {
  console.log("  • Site download:     Vercel Blob (notarized DMG uploaded)");
} else {
  console.log("  • Site download:     run npm run upload-download after packaging");
}
console.log("  • Static renderer:   index.html + assets/");
console.log(`  • GitHub release:    push tag v${appVersion} to publish installers`);

if (!skipOpen && process.platform === "darwin") {
  if (existsSync(appToOpen)) {
    run("open", ["-a", appToOpen], repoRoot, "Open Landed");
  } else {
    runNpm(["run", "open-app:dev"], desktopRoot, "Open dev Landed app");
  }
}
