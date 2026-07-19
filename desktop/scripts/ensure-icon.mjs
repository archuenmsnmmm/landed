import { execSync } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const desktopRoot = path.join(__dirname, "..");
const buildDir = path.join(desktopRoot, "build");
const iconPng = path.join(buildDir, "icon.png");
const iconIco = path.join(buildDir, "icon.ico");

function ensureIco() {
  if (existsSync(iconIco)) return;
  if (!existsSync(iconPng)) return;
  try {
    execSync(
      `python3 -c "from PIL import Image; img=Image.open('${iconPng}').convert('RGBA'); img.save('${iconIco}', format='ICO', sizes=[(16,16),(24,24),(32,32),(48,48),(64,64),(128,128),(256,256)])"`,
      { stdio: "inherit" },
    );
    console.log("[landed] Created build/icon.ico");
  } catch {
    console.warn("[landed] Could not create icon.ico — install Pillow or commit build/icon.ico");
  }
}

if (existsSync(iconPng)) {
  ensureIco();
  console.log("[landed] Using existing build/icon.png");
  process.exit(0);
}

mkdirSync(buildDir, { recursive: true });

// Minimal 1×1 PNG, scaled up with sips (no Python/Pillow required).
const tinyPng = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
  "base64",
);
writeFileSync(iconPng, tinyPng);

try {
  execSync(`sips -z 1024 1024 "${iconPng}" --out "${iconPng}"`, { stdio: "ignore" });
  console.log("[landed] Created placeholder build/icon.png");
} catch {
  console.warn("[landed] Could not scale icon — using 1×1 placeholder");
}

ensureIco();
