import { cpSync, existsSync, mkdirSync, readdirSync, rmSync } from "node:fs";
import path from "node:path";
import { repoRoot } from "./ensure-node-path.mjs";

const rendererOut = path.join(repoRoot, "desktop", "out", "renderer");
const indexDest = path.join(repoRoot, "index.html");
const assetsDest = path.join(repoRoot, "assets");

export function syncDesktopRenderer() {
  if (!existsSync(rendererOut)) {
    console.warn(
      "[sync-renderer] desktop/out/renderer missing — run npm run desktop:build or desktop:package first",
    );
    return false;
  }

  cpSync(path.join(rendererOut, "index.html"), indexDest);
  rmSync(assetsDest, { recursive: true, force: true });
  mkdirSync(assetsDest, { recursive: true });
  cpSync(path.join(rendererOut, "assets"), assetsDest, { recursive: true });

  const assetCount = readdirSync(assetsDest).length;
  console.log(`[sync-renderer] Updated index.html + ${assetCount} assets at repo root`);
  return true;
}

if (process.argv[1]?.endsWith("sync-desktop-renderer.mjs")) {
  syncDesktopRenderer();
}
