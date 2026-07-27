import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { execSync, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const desktopRoot = path.join(__dirname, "..");
const secretsPath = path.join(desktopRoot, ".release-secrets.local");

function loadLocalSecrets() {
  if (!existsSync(secretsPath)) return;
  for (const line of readFileSync(secretsPath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (key && !process.env[key]) process.env[key] = value;
  }
}

function run(command, args, { label = command, retries = 1 } = {}) {
  let lastError;
  for (let attempt = 1; attempt <= retries; attempt += 1) {
    if (attempt > 1) {
      console.log(`[notarize] Retry ${attempt}/${retries} for ${label}…`);
    }
    const result = spawnSync(command, args, {
      cwd: desktopRoot,
      stdio: "inherit",
      env: process.env,
      shell: false,
    });
    if (result.status === 0) return;
    lastError = new Error(`${label} failed with exit ${result.status ?? 1}`);
    if (attempt < retries) {
      execSync("sleep 15", { stdio: "ignore" });
    }
  }
  throw lastError;
}

function isDeveloperIdSigned(appPath) {
  const out = execSync(`codesign -dvv "${appPath}" 2>&1`, { encoding: "utf8" });
  return out.includes("Authority=Developer ID Application");
}

function isNotarized(appPath) {
  try {
    execSync(`spctl -a -vv -t install "${appPath}"`, { stdio: "pipe" });
    return true;
  } catch {
    return false;
  }
}

export function notarizeMacApp(appPath, { retries = 3 } = {}) {
  if (process.platform !== "darwin") {
    throw new Error("Notarization requires macOS");
  }
  if (!existsSync(appPath)) {
    throw new Error(`App not found: ${appPath}`);
  }
  if (!isDeveloperIdSigned(appPath)) {
    throw new Error("App is not Developer ID signed");
  }
  if (isNotarized(appPath)) {
    console.log("[notarize] Already notarized:", appPath);
    return;
  }

  loadLocalSecrets();

  const appleId = process.env.APPLE_ID?.trim();
  const password = process.env.APPLE_APP_SPECIFIC_PASSWORD?.trim();
  const teamId = process.env.APPLE_TEAM_ID?.trim();
  if (!appleId || !password || !teamId) {
    throw new Error("Missing APPLE_ID, APPLE_APP_SPECIFIC_PASSWORD, or APPLE_TEAM_ID");
  }

  const zipPath = path.join(tmpdir(), `landed-notarize-${Date.now()}.zip`);
  try {
    console.log("[notarize] Submitting to Apple…");
    execSync(`ditto -c -k --keepParent "${appPath}" "${zipPath}"`, { stdio: "inherit" });
    run(
      "xcrun",
      [
        "notarytool",
        "submit",
        zipPath,
        "--apple-id",
        appleId,
        "--password",
        password,
        "--team-id",
        teamId,
        "--wait",
      ],
      { label: "notarytool submit", retries },
    );
    run("xcrun", ["stapler", "staple", appPath], { label: "stapler staple" });
    execSync(`spctl -a -vv -t install "${appPath}"`, { stdio: "inherit" });
    console.log("[notarize] OK:", appPath);
  } finally {
    rmSync(zipPath, { force: true });
  }
}

export function createReleaseDmg(appPath, dmgPath) {
  const staging = mkdtempSync(path.join(tmpdir(), "landed-dmg-"));
  try {
    execSync(`ditto "${appPath}" "${path.join(staging, "Landed.app")}"`, { stdio: "inherit" });
    execSync(`ln -s /Applications "${path.join(staging, "Applications")}"`, { stdio: "inherit" });
    rmSync(dmgPath, { force: true });
    execSync(
      `hdiutil create -volname "Landed" -srcfolder "${staging}" -ov -format UDZO "${dmgPath}"`,
      { stdio: "inherit" },
    );
    console.log("[notarize] Wrote", dmgPath);
  } finally {
    rmSync(staging, { recursive: true, force: true });
  }
}

if (process.argv[1]?.endsWith("notarize-mac-app.mjs")) {
  const appPath =
    process.argv[2] ?? path.join(desktopRoot, "release", "mac-arm64", "Landed.app");
  const dmgPath = path.join(desktopRoot, "release", "Landed.dmg");
  try {
    notarizeMacApp(appPath);
    createReleaseDmg(appPath, dmgPath);
  } catch (err) {
    console.error("[notarize]", err instanceof Error ? err.message : err);
    process.exit(1);
  }
}
