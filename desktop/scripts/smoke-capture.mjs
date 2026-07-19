/**
 * Build smoke test: verify capture IPC is in the bundle.
 * Run from desktop/: node scripts/smoke-capture.mjs
 */
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const desktopRoot = path.join(__dirname, "..");
const mainJs = path.join(desktopRoot, "out/main/index.js");
const preloadJs = path.join(desktopRoot, "out/preload/index.js");

if (!existsSync(mainJs)) {
  console.error("[smoke] Build missing. Run: npm run build");
  process.exit(1);
}

const main = readFileSync(mainJs, "utf8");
for (const needle of [
  "landed:capture-frame",
  "landed:list-windows",
  "captureScreenFrame",
  "listCaptureWindows",
]) {
  if (!main.includes(needle)) {
    console.error(`[smoke] FAIL: missing ${needle} in out/main/index.js`);
    process.exit(1);
  }
}

const preload = readFileSync(preloadJs, "utf8");
for (const needle of ["captureFrame", "listWindows", "landed:capture-frame"]) {
  if (!preload.includes(needle)) {
    console.error(`[smoke] FAIL: missing ${needle} in preload`);
    process.exit(1);
  }
}

console.log("[smoke] ok — capture IPC present in build");
console.log("[smoke] Use: npm run desktop:dev  (not the marketing site at :3000)");
