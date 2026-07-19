import { execSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, rmSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const desktopRoot = path.join(__dirname, "..");
const iconPng = path.join(desktopRoot, "build/icon.png");

export function buildIcnsFromPng(destIcnsPath) {
  if (!existsSync(iconPng)) return false;

  const outDir = path.join(desktopRoot, ".icon-build");
  const iconsetDir = path.join(outDir, "icon.iconset");
  mkdirSync(iconsetDir, { recursive: true });

  const sizes = [
    [16, "icon_16x16.png"],
    [32, "icon_16x16@2x.png"],
    [32, "icon_32x32.png"],
    [64, "icon_32x32@2x.png"],
    [128, "icon_128x128.png"],
    [256, "icon_128x128@2x.png"],
    [256, "icon_256x256.png"],
    [512, "icon_256x256@2x.png"],
    [512, "icon_512x512.png"],
    [1024, "icon_512x512@2x.png"],
  ];

  for (const [size, name] of sizes) {
    const out = path.join(iconsetDir, name);
    execSync(`sips -z ${size} ${size} "${iconPng}" --out "${out}"`, { stdio: "ignore" });
    // Ensure premultiplied-friendly transparent corners (match Discord icns).
    execSync(
      `sips -s format png -s formatOptions best "${out}" --out "${out}"`,
      { stdio: "ignore" },
    );
  }

  execSync(`iconutil -c icns "${iconsetDir}" -o "${destIcnsPath}"`, { stdio: "ignore" });
  rmSync(outDir, { recursive: true, force: true });
  return true;
}

export function installAppIcon(appPath) {
  const icnsPath = path.join(desktopRoot, "build/icon.icns");
  if (!buildIcnsFromPng(icnsPath)) return;

  const resourcesDir = path.join(appPath, "Contents/Resources");
  copyFileSync(icnsPath, path.join(resourcesDir, "icon.icns"));
  copyFileSync(icnsPath, path.join(resourcesDir, "electron.icns"));
  if (existsSync(iconPng)) {
    copyFileSync(iconPng, path.join(resourcesDir, "icon.png"));
  }

  const plist = path.join(appPath, "Contents/Info.plist");
  const appName = path.basename(appPath);
  const iconFile = appName === "Landed.app" && appPath.includes(".landed-dev") ? "electron" : "icon";

  try {
    execSync(`/usr/libexec/PlistBuddy -c 'Set :CFBundleIconFile ${iconFile}' "${plist}"`, {
      stdio: "ignore",
    });
  } catch {
    execSync(
      `/usr/libexec/PlistBuddy -c 'Add :CFBundleIconFile string ${iconFile}' "${plist}"`,
      { stdio: "ignore" },
    );
  }
}
