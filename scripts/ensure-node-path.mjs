import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

/** Prefer the repo-local Node toolchain when the shell PATH is bare (e.g. Cursor agents). */
export function ensureNodePath() {
  const toolsDir = path.join(root, ".tools");
  if (!existsSync(toolsDir)) return;

  const bins = [];
  const toolsBin = path.join(toolsDir, "bin");
  if (existsSync(toolsBin)) bins.push(toolsBin);

  for (const name of ["node-v22.14.0-darwin-arm64", "node-v22.14.0-darwin-x64"]) {
    const nodeBin = path.join(toolsDir, name, "bin");
    if (existsSync(path.join(nodeBin, "node"))) {
      bins.push(nodeBin);
      break;
    }
  }

  if (bins.length === 0) return;
  process.env.PATH = `${bins.join(":")}:${process.env.PATH ?? ""}`;
}

export const repoRoot = root;
