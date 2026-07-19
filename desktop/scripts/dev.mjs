import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { signMacApp } from "./sign-mac-app.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const desktopRoot = path.join(__dirname, "..");
const landedDevDir = path.join(desktopRoot, ".landed-dev");
const landedApp = path.join(landedDevDir, "Landed.app");
const landedExec = path.join(landedApp, "Contents", "MacOS", "Electron");

const env = { ...process.env };
// Cursor sets this and breaks Electron's main-process APIs.
delete env.ELECTRON_RUN_AS_NODE;

if (process.platform === "darwin" && existsSync(landedExec)) {
  signMacApp(landedApp);
  env.ELECTRON_EXEC_PATH = landedExec;
  env.ELECTRON_OVERRIDE_DIST_PATH = landedDevDir;
  console.log("[landed] Using branded Landed app for mic permissions:", landedExec);
} else if (process.platform === "darwin") {
  console.warn("[landed] Branded app missing — run: node scripts/prepare-dev-app.mjs");
}

const child = spawn("electron-vite", ["dev"], {
  cwd: desktopRoot,
  stdio: "inherit",
  env,
  shell: true,
});

child.on("exit", (code) => process.exit(code ?? 0));
