import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const require = createRequire(import.meta.url);
const npmExecPath = process.env.npm_execpath ?? require.resolve("npm/bin/npm-cli.js");

const children = [];
let shuttingDown = false;

function spawnNpm(args, { cwd = root, name, critical = true } = {}) {
  const child = spawn(process.execPath, [npmExecPath, ...args], {
    cwd,
    stdio: "inherit",
    env: process.env,
  });
  children.push({ child, name });
  child.on("exit", (code, signal) => {
    if (shuttingDown) return;
    if (!critical) {
      console.warn(
        `[dev-desktop] ${name} exited (${signal ?? code ?? 0}) — desktop keeps running (billing uses deployed API).`,
      );
      return;
    }
    shuttingDown = true;
    console.error(`[dev-desktop] ${name} exited (${signal ?? code ?? 0})`);
    shutdown(code ?? 1);
  });
  return child;
}

function shutdown(code = 0) {
  if (shuttingDown) return;
  shuttingDown = true;
  for (const { child } of children) {
    if (!child.killed) child.kill("SIGTERM");
  }
  setTimeout(() => process.exit(code), 250);
}

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));

async function waitForBillingApi(maxMs = 60_000) {
  // /api/stripe/status is admin-gated (404 without secret) — probe a public route instead.
  const url = "http://localhost:3000/api/pricing";
  const started = Date.now();
  while (Date.now() - started < maxMs) {
    try {
      const res = await fetch(url);
      if (res.ok) {
        console.log("[dev-desktop] Billing API ready on http://localhost:3000");
        return;
      }
    } catch {
      // server still starting
    }
    await new Promise((r) => setTimeout(r, 400));
  }
  console.warn(
    "[dev-desktop] Billing API did not become ready in time — checkout may fail until `npm run dev` is running.",
  );
}

console.log("[dev-desktop] Starting Next.js (optional local API)…");
spawnNpm(["run", "dev"], { name: "next", critical: false });

// Don't block the desktop app on local billing — checkout uses the deployed API.
void waitForBillingApi().catch(() => undefined);

console.log("[dev-desktop] Starting desktop app…");
spawnNpm(["run", "dev"], { cwd: path.join(root, "desktop"), name: "desktop" });
