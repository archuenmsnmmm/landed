import { spawnSync } from "node:child_process";
import { copyFileSync, existsSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const desktopRoot = path.join(__dirname, "..");
const envPath = path.join(desktopRoot, ".env");
const envExamplePath = path.join(desktopRoot, ".env.example");
const writeCiEnv = path.join(__dirname, "write-ci-env.mjs");

function hasPackagingSecrets() {
  return Boolean(
    process.env.VITE_SUPABASE_URL?.trim() &&
      process.env.VITE_SUPABASE_ANON_KEY?.trim(),
  );
}

if (hasPackagingSecrets()) {
  const result = spawnSync("node", [writeCiEnv], {
    cwd: desktopRoot,
    stdio: "inherit",
    env: process.env,
  });
  if (result.status !== 0) process.exit(result.status ?? 1);
} else if (!existsSync(envPath)) {
  if (existsSync(envExamplePath)) {
    copyFileSync(envExamplePath, envPath);
    console.log("[landed] Copied .env.example → .env for packaging");
    console.warn(
      "[landed] Placeholder .env — set production keys in desktop/.env or CI secrets before release.",
    );
  } else {
    writeFileSync(envPath, "# CI packaging placeholder\n", "utf8");
    console.log("[landed] Created empty .env for packaging");
  }
}
