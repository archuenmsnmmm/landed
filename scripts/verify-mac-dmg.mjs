import { existsSync } from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

/**
 * Verify a Mac DMG contains an openable Landed.app.
 *
 * @param {string} dmgPath
 * @param {{ requireNotarized?: boolean }} options
 */
export function verifyMacDmg(dmgPath, { requireNotarized = false } = {}) {
  if (process.platform !== "darwin") {
    console.warn("[verify-mac-dmg] Skipping verification (not on macOS).");
    return;
  }

  if (!existsSync(dmgPath)) {
    throw new Error(`DMG not found: ${dmgPath}`);
  }

  const mountPoint = `/tmp/landed-verify-${Date.now()}`;
  try {
    execSync(`hdiutil attach "${dmgPath}" -nobrowse -mountpoint "${mountPoint}" -quiet`, {
      stdio: "pipe",
    });

    const appPath = path.join(mountPoint, "Landed.app");
    if (!existsSync(appPath)) {
      throw new Error("Landed.app not found inside DMG");
    }

    execSync(`codesign --verify --deep --strict "${appPath}"`, { stdio: "pipe" });

    const codesign = execSync(`codesign -dvv "${appPath}" 2>&1`, { encoding: "utf8" });
    const developerIdSigned = codesign.includes("Authority=Developer ID Application");

    if (requireNotarized) {
      if (!developerIdSigned) {
        throw new Error("DMG is not Developer ID signed — web downloads require notarization");
      }
      execSync(`spctl -a -vv -t install "${appPath}"`, { stdio: "pipe" });
      console.log("[verify-mac-dmg] OK: notarized Developer ID build.");
      return;
    }

    if (developerIdSigned) {
      execSync(`spctl -a -vv -t install "${appPath}"`, { stdio: "pipe" });
      console.log("[verify-mac-dmg] OK: notarized Developer ID build.");
    } else {
      console.log("[verify-mac-dmg] OK: valid ad-hoc signature (not for public web upload).");
    }
  } finally {
    try {
      execSync(`hdiutil detach "${mountPoint}" -quiet`, { stdio: "pipe" });
    } catch {
      // ignore
    }
  }
}

if (process.argv[1]?.endsWith("verify-mac-dmg.mjs")) {
  const dmgPath = process.argv[2];
  const requireNotarized = process.argv.includes("--notarized");
  if (!dmgPath) {
    console.error("Usage: node scripts/verify-mac-dmg.mjs /path/to/Landed.dmg [--notarized]");
    process.exit(1);
  }
  try {
    verifyMacDmg(dmgPath, { requireNotarized });
  } catch (err) {
    console.error("[verify-mac-dmg]", err instanceof Error ? err.message : err);
    process.exit(1);
  }
}
