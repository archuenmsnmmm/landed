import { readFileSync, writeFileSync, statSync } from "node:fs";
import { createRequire } from "node:module";
import { existsSync, mkdirSync, rmSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";
import { installAppIcon } from "./build-icns.mjs";
import { signMacApp } from "./sign-mac-app.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const desktopRoot = path.join(__dirname, "..");
const outDir = path.join(desktopRoot, ".landed-dev");
const iconScript = path.join(desktopRoot, "scripts/generate-app-icon.py");
const legacyDevApp = path.join(outDir, "Electron.app");
const destApp = path.join(outDir, "Landed.app");

if (process.platform !== "darwin") {
  process.exit(0);
}

function tryGenerateIcons() {
  const iconSource = path.join(desktopRoot, "build/icon-source.png");
  const iconPng = path.join(desktopRoot, "build/icon.png");
  if (!existsSync(iconScript)) return;
  if (!existsSync(iconSource) && !existsSync(iconPng)) {
    console.warn("[landed] Skipping icon generation — add desktop/build/icon-source.png");
    return;
  }
  try {
    execSync(`python3 "${iconScript}"`, { stdio: "inherit" });
  } catch {
    console.warn("[landed] Icon generation skipped (install Xcode CLT + Pillow for icons)");
  }
}

const require = createRequire(import.meta.url);
const electronDist = path.join(desktopRoot, "node_modules/electron/dist");
const plist = () => path.join(destApp, "Contents/Info.plist");

const stampFile = path.join(outDir, ".stamp");
const iconStampFile = path.join(outDir, ".icon-stamp");
const electronVersion = require(path.join(desktopRoot, "node_modules/electron/package.json")).version;

function iconSourceStamp() {
  const iconSource = path.join(desktopRoot, "build/icon-source.png");
  const iconPng = path.join(desktopRoot, "build/icon.png");
  const target = existsSync(iconSource) ? iconSource : iconPng;
  if (!existsSync(target)) return "missing";
  const { mtimeMs, size } = statSync(target);
  return `${target}:${size}:${mtimeMs}`;
}

function ensureDevAppBundle() {
  if (existsSync(destApp)) return;
  if (existsSync(legacyDevApp)) {
    execSync(`mv "${legacyDevApp}" "${destApp}"`, { stdio: "inherit" });
  }
}

function installDevElectronLauncher() {
  const launcherScript = path.join(__dirname, "install-dev-electron-launcher.sh");
  const electronBin = path.join(destApp, "Contents/MacOS/Electron");
  if (!existsSync(electronBin)) return;
  execSync(`bash "${launcherScript}" "${path.dirname(electronBin)}"`, { stdio: "inherit" });
}

function isAlreadySigned(appPath) {
  // Ad-hoc Electron apps often fail `codesign --verify --strict`, so only check
  // that a signature record exists. Re-signing every launch breaks TCC.
  try {
    const out = execSync(`codesign -dv "${appPath}" 2>&1`, { encoding: "utf8" });
    return /Signature=|Authority=/.test(out);
  } catch {
    return false;
  }
}

function refreshDevAppBundle() {
  tryGenerateIcons();
  installAppIcon(destApp);
  installDevElectronLauncher();
  try {
    execSync(
      `/usr/libexec/PlistBuddy -c 'Set :CFBundleDisplayName "Landed"' "${plist()}"`,
      { stdio: "ignore" },
    );
    execSync(
      `/usr/libexec/PlistBuddy -c 'Set :CFBundleName "Landed"' "${plist()}"`,
      { stdio: "ignore" },
    );
  } catch {
    // ignore plist update failures
  }
  writeFileSync(iconStampFile, iconSourceStamp());
  // Do NOT ad-hoc re-sign on every launch — that changes the code identity and
  // silently invalidates macOS Screen Recording permission for this app.
  if (!isAlreadySigned(destApp)) {
    signMacApp(destApp);
  } else {
    console.log("[landed] Dev app already signed — skipping re-sign (keeps Screen Recording TCC)");
  }
}

if (existsSync(stampFile) && (existsSync(destApp) || existsSync(legacyDevApp))) {
  ensureDevAppBundle();
  const stamp = readFileSync(stampFile, "utf8");
  if (stamp === electronVersion) {
    refreshDevAppBundle();
    console.log("[landed] Refreshed Landed dev app at", destApp);
    process.exit(0);
  }
}

if (existsSync(outDir)) rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });

execSync(`cp -a "${electronDist}/." "${outDir}/"`, { stdio: "inherit" });
ensureDevAppBundle();

const setPlist = (key, value) => {
  execSync(`/usr/libexec/PlistBuddy -c 'Set :${key} "${value}"' "${plist()}"`, { stdio: "ignore" });
};

const addPlist = (key, type, value) => {
  const raw = value.replace(/^"|"$/g, "");
  try {
    execSync(`/usr/libexec/PlistBuddy -c 'Add :${key} ${type} "${raw}"' "${plist()}"`, {
      stdio: "ignore",
    });
  } catch {
    setPlist(key, raw);
  }
};

setPlist("CFBundleDisplayName", "Landed");
setPlist("CFBundleName", "Landed");
// Same bundle id as production so Screen Recording permission matches /Applications/Landed.
setPlist("CFBundleIdentifier", "com.landed.app");
setPlist("CFBundleIconFile", "electron");
addPlist(
  "NSMicrophoneUsageDescription",
  "string",
  "Landed needs microphone access to transcribe your voice during sales calls.",
);
addPlist(
  "NSScreenCaptureDescription",
  "string",
  "Landed uses Screen Recording to see what’s on your display when you ask, and to capture call audio from Zoom, Meet, or Teams.",
);

signMacApp(destApp);
installAppIcon(destApp);
installDevElectronLauncher();

setPlist("CFBundleDisplayName", "Landed");
setPlist("CFBundleName", "Landed");

writeFileSync(stampFile, electronVersion);
writeFileSync(iconStampFile, iconSourceStamp());
writeFileSync(path.join(outDir, "absolute-path.txt"), outDir);
console.log("[landed] Prepared Landed app at", destApp);
