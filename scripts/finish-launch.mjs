#!/usr/bin/env node
/**
 * Finish remaining launch steps when credentials are available.
 *   node scripts/finish-launch.mjs
 */
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

function run(cmd, args, opts = {}) {
  console.log(`\n> ${cmd} ${args.join(" ")}`);
  const result = spawnSync(cmd, args, {
    cwd: repoRoot,
    stdio: "inherit",
    ...opts,
  });
  return result.status ?? 1;
}

function ghHasWorkflowScope() {
  const result = spawnSync("gh", ["auth", "status"], { encoding: "utf8" });
  return result.stdout?.includes("workflow") ?? false;
}

let failed = false;

if (ghHasWorkflowScope()) {
  const push = run("git", ["add", ".github/"]);
  if (push === 0) {
    run("git", [
      "commit",
      "-m",
      "Add CI and desktop release GitHub Actions workflows.",
    ]);
    if (run("git", ["push", "origin", "main"]) !== 0) failed = true;
  }
} else {
  console.log(
    "\n[finish] GitHub workflow scope missing. Run:\n  gh auth refresh -h github.com -s workflow,repo\nThen re-run this script.",
  );
  failed = true;
}

if (process.env.SUPABASE_DB_PASSWORD?.trim()) {
  if (run("node", ["scripts/apply-supabase-migrations.mjs"]) !== 0) failed = true;
}

if (run("node", ["scripts/check-supabase-schema.mjs"]) !== 0) {
  if (!process.env.SUPABASE_DB_PASSWORD?.trim()) {
    console.log(
      "\n[finish] Schema check failed. Apply migrations:\n  SUPABASE_DB_PASSWORD='your-db-password' node scripts/apply-supabase-migrations.mjs",
    );
  }
  failed = true;
}

if (!failed) {
  console.log("\n[finish] Launch setup complete.");
} else {
  process.exit(1);
}
