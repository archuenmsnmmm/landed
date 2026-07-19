import { existsSync } from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

/** Remove com.apple.quarantine so Gatekeeper can evaluate a signed/notarized app. */
export function clearMacQuarantine(appPath) {
  if (process.platform !== "darwin" || !existsSync(appPath)) return;
  execSync(`xattr -cr "${appPath}"`, { stdio: "ignore" });
}

function isDeveloperIdSigned(appPath) {
  try {
    const out = execSync(`codesign -dvv "${appPath}" 2>&1`, { encoding: "utf8" });
    return out.includes("Authority=Developer ID Application");
  } catch {
    return false;
  }
}

/**
 * Strip quarantine and, for unsigned local builds only, ad-hoc sign so dev copies open.
 * Never re-sign Developer ID builds — that invalidates notarization and triggers Gatekeeper.
 */
function hasAnySignature(appPath) {
  try {
    const out = execSync(`codesign -dv "${appPath}" 2>&1`, { encoding: "utf8" });
    return /Signature=|Authority=/.test(out);
  } catch {
    return false;
  }
}

export function signMacApp(appPath, { force = false } = {}) {
  if (process.platform !== "darwin" || !existsSync(appPath)) return;

  clearMacQuarantine(appPath);

  if (isDeveloperIdSigned(appPath)) {
    console.log("[landed] Developer ID signed — quarantine cleared, not re-signing:", appPath);
    return;
  }

  // Re-signing ad-hoc on every `desktop:dev` changes the code identity and
  // silently breaks macOS Screen Recording permission for this binary.
  if (!force && hasAnySignature(appPath)) {
    console.log("[landed] Already ad-hoc signed — skipping re-sign (keeps Screen Recording TCC):", appPath);
    return;
  }

  console.log("[landed] Ad-hoc signing unsigned build:", appPath);

  const frameworks = path.join(appPath, "Contents/Frameworks/Electron Framework.framework");
  if (existsSync(frameworks)) {
    execSync(`codesign --force --sign - "${frameworks}"`, { stdio: "ignore" });
  }

  for (const name of ["Electron Helper.app", "Landed Helper.app"]) {
    const helper = path.join(appPath, "Contents/Frameworks", name);
    if (existsSync(helper)) {
      clearMacQuarantine(helper);
      execSync(`codesign --force --sign - "${helper}"`, { stdio: "ignore" });
    }
  }

  execSync(`codesign --force --deep --sign - "${appPath}"`, { stdio: "ignore" });
}

if (process.argv[1]?.endsWith("sign-mac-app.mjs")) {
  const appPath = process.argv[2];
  if (!appPath) {
    console.error("Usage: node scripts/sign-mac-app.mjs /path/to/App.app");
    process.exit(1);
  }
  signMacApp(appPath);
}
