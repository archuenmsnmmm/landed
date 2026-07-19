#!/usr/bin/env node
/**
 * One-shot BlackHole + Landed Audio setup for macOS.
 * Opens the BlackHole installer (requires your password in the GUI),
 * then creates Landed Audio / Landed Input devices and switches system output.
 */
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const desktopRoot = path.join(__dirname, "..");
const pkgPath = "/tmp/BlackHole2ch.pkg";
const pkgUrl = "https://existential.audio/downloads/BlackHole2ch.v0.6.0.pkg";
const swiftScript = path.join(__dirname, "setup-landed-audio.swift");

function run(cmd, args, opts = {}) {
  const result = spawnSync(cmd, args, { stdio: "inherit", ...opts });
  return result.status ?? 1;
}

function hasBlackHole() {
  const result = spawnSync("system_profiler", ["SPAudioDataType"], { encoding: "utf8" });
  return /BlackHole 2ch/i.test(result.stdout ?? "");
}

function downloadPkg() {
  if (existsSync(pkgPath)) {
    const check = spawnSync("file", [pkgPath], { encoding: "utf8" });
    if (check.stdout?.includes("xar archive")) return true;
  }
  console.log(`Downloading BlackHole from ${pkgUrl} …`);
  return run("curl", ["-fsSL", "-o", pkgPath, pkgUrl]) === 0;
}

function setLandedCallAudioMode() {
  const flagPath = path.join(
    process.env.HOME ?? "",
    "Library/Application Support/landed-desktop/use-call-audio.flag",
  );
  mkdirSync(path.dirname(flagPath), { recursive: true });
  writeFileSync(flagPath, "auto\n");
  console.log("Landed will use auto audio mode (mic + call) on next launch.");
}

console.log("\n=== Landed BlackHole setup ===\n");

if (!hasBlackHole()) {
  if (!downloadPkg()) {
    console.error("Failed to download BlackHole.");
    process.exit(1);
  }
  console.log("\nOpening BlackHole installer — enter your Mac password and complete the install.");
  console.log("You may need to reboot after install (BlackHole installer may prompt).\n");
  run("open", [pkgPath]);
  console.log("After BlackHole is installed, run this again:\n  npm run setup:blackhole\n");
  process.exit(0);
}

console.log("BlackHole 2ch detected.\nCreating Landed Audio + Landed Input devices…\n");
const status = run("swift", [swiftScript]);
if (status !== 0) {
  console.error("\nDevice setup failed. Open Audio MIDI Setup manually if needed.");
  run("open", ["-a", "Audio MIDI Setup"]);
  process.exit(status);
}

setLandedCallAudioMode();

console.log("\nOpening Sound settings — confirm output is Landed Audio.\n");
run("open", ["x-apple.systempreferences:com.apple.Sound-Settings.extension"]);

console.log("Setup complete. Restart Landed (npm run dev) and start a session.\n");
