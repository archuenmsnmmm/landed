/**
 * Apply pending Supabase migrations when SUPABASE_DB_PASSWORD is set.
 *
 * Usage:
 *   SUPABASE_DB_PASSWORD='...' node scripts/apply-supabase-migrations.mjs
 *
 * Password: Supabase Dashboard → Project Settings → Database → Database password
 */
import { readFileSync, readdirSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const projectRef = "epeitwkgbfabevxyznrh";
const password = process.env.SUPABASE_DB_PASSWORD?.trim();

if (!password) {
  console.error(
    "Set SUPABASE_DB_PASSWORD (Supabase Dashboard → Settings → Database → Database password).",
  );
  process.exit(1);
}

const hosts = [
  `db.${projectRef}.supabase.co`,
  `aws-0-us-east-1.pooler.supabase.com`,
  `aws-0-eu-west-1.pooler.supabase.com`,
  `aws-0-eu-west-2.pooler.supabase.com`,
];

let dbUrl;
for (const host of hosts) {
  const user = host.includes("pooler") ? `postgres.${projectRef}` : "postgres";
  const port = host.includes("pooler") ? "6543" : "5432";
  const candidate = `postgresql://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}:${port}/postgres`;
  const probe = spawnSync(
    "node",
    [
      "-e",
      `fetch('https://${projectRef}.supabase.co/rest/v1/').catch(()=>{}); process.exit(0);`,
    ],
    { stdio: "ignore" },
  );
  void probe;
  dbUrl = candidate;
  break;
}

const result = spawnSync(
  "supabase",
  ["db", "push", "--db-url", dbUrl, "--yes"],
  {
    cwd: repoRoot,
    stdio: "inherit",
    env: {
      ...process.env,
      SUPABASE_DB_PASSWORD: password,
    },
  },
);

if (result.status !== 0) {
  const direct = `postgresql://postgres:${encodeURIComponent(password)}@db.${projectRef}.supabase.co:5432/postgres`;
  console.log("[supabase] Retrying with direct connection…");
  const retry = spawnSync(
    "supabase",
    ["db", "push", "--db-url", direct, "--yes"],
    { cwd: repoRoot, stdio: "inherit", env: process.env },
  );
  process.exit(retry.status ?? 1);
}

console.log("[supabase] Migrations applied.");
