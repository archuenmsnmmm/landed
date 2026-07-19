import {
  app,
  BrowserWindow,
  clipboard,
  desktopCapturer,
  globalShortcut,
  ipcMain,
  nativeImage,
  screen,
  session,
  shell,
  systemPreferences,
} from "electron";
import path from "node:path";
import fs from "node:fs";
import os from "node:os";
import http from "node:http";
import { execFile, spawnSync } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

function parseEnvFile(contents: string): Record<string, string> {
  const vars: Record<string, string> = {};
  for (const line of contents.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    vars[key] = value;
  }
  return vars;
}

function loadOpenAIKey(): string | undefined {
  return (
    loadEnvVar("VITE_OPENAI_API_KEY") ||
    loadEnvVar("OPENAI_API_KEY") ||
    process.env.OPENAI_API_KEY?.trim() ||
    undefined
  );
}

/** Production billing API — never depends on local Next.js. */
const DEFAULT_BILLING_API_BASE = "https://landed-ai.com";

function loadEnvVar(key: string): string | undefined {
  const candidates = [
    path.join(app.getPath("userData"), ".env"),
    path.join(process.resourcesPath, ".env"),
    path.join(app.getAppPath(), "../../.env"),
    path.join(__dirname, "../../.env"), // desktop/.env
    path.join(__dirname, "../../../.env"), // repo root .env
    path.join(process.cwd(), ".env"),
    path.join(process.cwd(), "../.env"),
  ];

  for (const file of candidates) {
    try {
      if (!fs.existsSync(file)) continue;
      const value = parseEnvFile(fs.readFileSync(file, "utf8"))[key]?.trim();
      if (value) return value;
    } catch {
      // ignore
    }
  }

  return process.env[key]?.trim() || undefined;
}

function loadBillingApiBase(): string {
  const raw = loadEnvVar("VITE_API_BASE_URL")?.replace(/\/$/, "");
  // Ignore localhost even in DEV — desktop checkout must hit the deployed API.
  if (raw && !raw.includes("localhost") && !raw.includes("127.0.0.1")) return raw;
  return DEFAULT_BILLING_API_BASE;
}

const isDev = !!process.env.ELECTRON_RENDERER_URL;

function setDockIcon(): void {
  if (process.platform !== "darwin" || !app.dock) return;

  const candidates = [
    path.join(process.resourcesPath, "icon.png"),
    path.join(process.resourcesPath, "icon.icns"),
    path.join(app.getAppPath(), "build/icon.png"),
    path.join(__dirname, "../../build/icon.png"),
    path.join(__dirname, "../../../build/icon.png"),
  ];

  for (const iconPath of candidates) {
    if (!fs.existsSync(iconPath)) continue;
    const image = nativeImage.createFromPath(iconPath);
    if (image.isEmpty()) continue;
    app.dock.setIcon(image);
    return;
  }
}

app.setName("Landed");

// Prevent dev crashes when stdout/stderr pipe closes (EPIPE on console.warn).
for (const stream of [process.stdout, process.stderr]) {
  stream?.on?.("error", (err: NodeJS.ErrnoException) => {
    if (err.code === "EPIPE") return;
  });
}

// Dev and packaged builds share the same app name — separate userData so both can run.
if (isDev) {
  app.setPath("userData", path.join(app.getPath("appData"), "landed-desktop-dev"));
}

const gotSingleInstanceLock = app.requestSingleInstanceLock();
if (!gotSingleInstanceLock) {
  app.quit();
}

/** Desktop OAuth lands here so the browser never needs to open landed:// directly. */
const OAUTH_LOOPBACK_PORT = 42817;
const OAUTH_LOOPBACK_PATH = "/auth/callback";

function startOAuthLoopbackServer(): void {
  const server = http.createServer((req, res) => {
    const url = req.url ?? "";
    if (!url.startsWith(OAUTH_LOOPBACK_PATH)) {
      res.writeHead(404);
      res.end();
      return;
    }

    const suffix = url.slice(OAUTH_LOOPBACK_PATH.length);
    handleDeepLink(`landed://auth/callback${suffix}`);

    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(`<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><title>Signed in — Landed</title></head>
<body style="font-family:system-ui,sans-serif;text-align:center;padding:48px 24px;color:#18181b">
  <h1 style="font-size:24px;font-weight:600">Signed in</h1>
  <p style="margin-top:12px;color:#52525b">Return to Landed — you can close this tab.</p>
</body>
</html>`);
  });

  server.on("error", (err: NodeJS.ErrnoException) => {
    if (err.code === "EADDRINUSE") {
      console.warn(
        `[landed] OAuth loopback :${OAUTH_LOOPBACK_PORT} in use — restart Landed if Google sign-in fails`,
      );
      return;
    }
    console.error("[landed] OAuth loopback server error:", err);
  });

  server.listen(OAUTH_LOOPBACK_PORT, "127.0.0.1", () => {
    console.log(
      `[landed] OAuth callback http://127.0.0.1:${OAUTH_LOOPBACK_PORT}${OAUTH_LOOPBACK_PATH}`,
    );
  });
}

// Register custom protocol for OAuth callbacks (landed://auth/callback)
if (process.defaultApp) {
  if (process.argv.length >= 2) {
    app.setAsDefaultProtocolClient("landed", process.execPath, [
      path.resolve(process.argv[1] ?? ""),
    ]);
  }
} else {
  app.setAsDefaultProtocolClient("landed");
}

let dashboardWindow: BrowserWindow | null = null;
let overlayWindow: BrowserWindow | null = null;
let micHelperWindow: BrowserWindow | null = null;
let isOverlayHidden = false;
let overlayPendingShow = false;
let contentProtection = false;
let sessionActive = false;

const FREE_QUESTION_LIMIT = 15;
const FREE_OVERLAY_LIMIT_SECONDS = 10 * 60;
const PLAN_STATE_PATH = () => path.join(app.getPath("userData"), "plan-state.json");

interface PlanLimitsState {
  plan: string;
  freeOverlaySecondsUsed: number;
  freeQuestionsUsed: number;
}

function migrateLegacyFreeSessionsUsed(freeSessionsUsed: number): number {
  if (freeSessionsUsed >= 3) return FREE_OVERLAY_LIMIT_SECONDS;
  return Math.min(freeSessionsUsed * 600, FREE_OVERLAY_LIMIT_SECONDS);
}

function resolveFreeOverlaySecondsUsed(
  freeOverlaySecondsUsed: number | undefined,
  legacyFreeSessionsUsed: number | undefined,
): number {
  if (typeof freeOverlaySecondsUsed === "number" && freeOverlaySecondsUsed > 0) {
    return Math.max(0, freeOverlaySecondsUsed);
  }
  if (typeof legacyFreeSessionsUsed === "number" && legacyFreeSessionsUsed > 0) {
    return migrateLegacyFreeSessionsUsed(legacyFreeSessionsUsed);
  }
  return Math.max(0, freeOverlaySecondsUsed ?? 0);
}

function resolveFreeQuestionsUsed(
  freeQuestionsUsed: number | undefined,
  freeOverlaySecondsUsed: number,
): number {
  if (typeof freeQuestionsUsed === "number" && freeQuestionsUsed > 0) {
    return Math.min(FREE_QUESTION_LIMIT, Math.max(0, freeQuestionsUsed));
  }
  if (freeOverlaySecondsUsed >= FREE_OVERLAY_LIMIT_SECONDS) {
    return FREE_QUESTION_LIMIT;
  }
  return Math.max(0, freeQuestionsUsed ?? 0);
}

function readPlanLimits(): PlanLimitsState {
  try {
    const file = PLAN_STATE_PATH();
    if (fs.existsSync(file)) {
      const parsed = JSON.parse(fs.readFileSync(file, "utf8")) as Partial<PlanLimitsState> & {
        freeSessionsUsed?: number;
      };
      const freeOverlaySecondsUsed = resolveFreeOverlaySecondsUsed(
        parsed.freeOverlaySecondsUsed,
        parsed.freeSessionsUsed,
      );
      return {
        plan: parsed.plan ?? "free",
        freeOverlaySecondsUsed,
        freeQuestionsUsed: resolveFreeQuestionsUsed(
          parsed.freeQuestionsUsed,
          freeOverlaySecondsUsed,
        ),
      };
    }
  } catch {
    // ignore corrupt state
  }
  return { plan: "free", freeOverlaySecondsUsed: 0, freeQuestionsUsed: 0 };
}

function writePlanLimits(state: PlanLimitsState): void {
  try {
    fs.writeFileSync(PLAN_STATE_PATH(), JSON.stringify(state), "utf8");
  } catch {
    // ignore write failures
  }
}

function isPaidPlan(plan: string): boolean {
  return plan !== "free";
}

function canStartSessionFromLimits(state: PlanLimitsState): boolean {
  return (
    isPaidPlan(state.plan) || state.freeQuestionsUsed < FREE_QUESTION_LIMIT
  );
}

function canDisableContentProtection(state: PlanLimitsState): boolean {
  return (
    state.plan === "pro" ||
    state.plan === "lifetime" ||
    state.plan === "solo" ||
    state.plan === "undetectable"
  );
}

function consumeCallAudioSetupFlag(): boolean {
  const flagPath = path.join(app.getPath("userData"), "use-call-audio.flag");
  if (!fs.existsSync(flagPath)) return false;
  try {
    fs.unlinkSync(flagPath);
  } catch {
    // ignore
  }
  return true;
}

function runLandedAudioSetup(): boolean {
  if (process.platform !== "darwin") return true;

  const candidates = [
    path.join(app.getAppPath(), "scripts/setup-landed-audio.swift"),
    path.join(__dirname, "../../scripts/setup-landed-audio.swift"),
  ];
  const scriptPath = candidates.find((p) => fs.existsSync(p));
  if (!scriptPath) return false;

  const result = spawnSync("swift", [scriptPath], { encoding: "utf8" });
  if (result.status === 0) {
    console.log("[landed] Audio routing ready");
    return true;
  }

  console.warn("[landed] Audio setup:", result.stderr || result.stdout);
  return false;
}

function getRendererIndexPath(): string {
  return path.join(app.getAppPath(), "out/renderer/index.html");
}

function getRendererUrl(route: string): string {
  if (isDev) {
    return `${process.env.ELECTRON_RENDERER_URL}#${route}`;
  }
  return getRendererIndexPath();
}

function bindWindowTitle(win: BrowserWindow, title = "Landed"): void {
  win.setTitle(title);
  win.on("page-title-updated", (event) => {
    event.preventDefault();
    if (!win.isDestroyed()) win.setTitle(title);
  });
}

function loadRoute(win: BrowserWindow, route: string): void {
  if (isDev) {
    win.loadURL(getRendererUrl(route));
    return;
  }

  const hash = route.startsWith("/") ? route : `/${route}`;
  win.loadFile(getRendererIndexPath(), { hash });
}

function sendWhenReady(win: BrowserWindow | null, channel: string, ...args: unknown[]): void {
  if (!win || win.isDestroyed()) return;
  const deliver = () => {
    if (!win.isDestroyed()) win.webContents.send(channel, ...args);
  };
  if (win.webContents.isLoading()) {
    win.webContents.once("did-finish-load", deliver);
  } else {
    deliver();
  }
}

/** Stashed until the dashboard renderer mounts and consumes it. */
let pendingSettingsSection: string | null = null;
/** True while the settings host should stay visible (blocks session-start hide races). */
let settingsVisible = false;

function applySettingsWindowLayout(): void {
  if (!dashboardWindow || dashboardWindow.isDestroyed()) return;
  dashboardWindow.setMinimumSize(960, 640);
  dashboardWindow.setSize(1180, 780, true);
  dashboardWindow.setBackgroundColor("#fafafa");
  dashboardWindow.center();
}

function deliverOpenSettings(section: string): void {
  pendingSettingsSection = section;
  settingsVisible = true;
  createDashboardWindow();
  applySettingsWindowLayout();

  const win = dashboardWindow;
  if (!win || win.isDestroyed()) return;

  const send = () => {
    if (!dashboardWindow || dashboardWindow.isDestroyed()) return;
    applySettingsWindowLayout();
    dashboardWindow.webContents.send("landed:open-settings", section);
  };

  // Single delivery — pending section covers late React mount. Retries remounted
  // the modal and looked like open → blank → open.
  if (win.webContents.isLoading()) {
    sendWhenReady(win, "landed:navigate", "/");
    win.webContents.once("did-finish-load", send);
  } else {
    send();
  }

  showDashboardWindow();
}

/** Show the host window (auth / onboarding / paywall / settings). */
function showDashboardWindow(): void {
  if (!dashboardWindow || dashboardWindow.isDestroyed()) return;
  dashboardWindow.center();
  dashboardWindow.show();
  dashboardWindow.focus();
  if (process.platform === "darwin") {
    app.dock?.show();
  }
}

function createDashboardWindow(): void {
  // Overlay-first: creating the host must not force it visible. Auth/onboarding/
  // paywall/settings call showDashboardWindow() when they need UI.
  if (dashboardWindow) {
    return;
  }

  dashboardWindow = new BrowserWindow({
    width: 1180,
    height: 780,
    minWidth: 960,
    minHeight: 640,
    title: "Landed",
    ...(process.platform === "darwin"
      ? {
          titleBarStyle: "hiddenInset" as const,
          trafficLightPosition: { x: 16, y: 16 },
        }
      : {}),
    backgroundColor: "#ffffff",
    show: false,
    webPreferences: {
      preload: path.join(__dirname, "../preload/index.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      backgroundThrottling: false,
    },
  });

  bindWindowTitle(dashboardWindow);

  dashboardWindow.webContents.setBackgroundThrottling(false);

  loadRoute(dashboardWindow, "/auth");

  dashboardWindow.webContents.on("did-fail-load", (_event, code, description, url) => {
    console.error("[landed] Dashboard failed to load:", code, description, url);
  });

  dashboardWindow.webContents.on("before-input-event", (_event, input) => {
    if (isHideShowShortcutInput(input)) handleHideShowShortcut();
  });

  dashboardWindow.on("closed", () => {
    dashboardWindow = null;
  });
}

const OVERLAY_TOP_MARGIN = 20;

type OverlayMode = "pill" | "active";
let overlayMode: OverlayMode = "pill";
let overlayFullscreenHooksInstalled = false;
let overlayPinTimer: ReturnType<typeof setInterval> | null = null;

/** Keep the overlay above fullscreen apps / Spaces until the session is quit. */
function ensureOverlayAboveFullscreen(): void {
  if (!overlayWindow || overlayWindow.isDestroyed()) return;
  // skipTransformProcessType avoids Dock/process-type churn that can briefly
  // hide the window when joining all Spaces (Electron #26350).
  overlayWindow.setVisibleOnAllWorkspaces(true, {
    visibleOnFullScreen: true,
    skipTransformProcessType: true,
  });
  // screen-saver is above most fullscreen spaces on macOS.
  overlayWindow.setAlwaysOnTop(true, "screen-saver", 1);
  if (process.platform === "darwin") {
    overlayWindow.setFullScreenable(false);
  }
}

function startOverlayPinLoop(): void {
  if (overlayPinTimer) return;
  // macOS occasionally drops always-on-top after other apps enter fullscreen;
  // re-pin while the session is alive so the overlay stays until quit.
  overlayPinTimer = setInterval(() => {
    if (!overlayWindow || overlayWindow.isDestroyed() || !sessionActive) {
      stopOverlayPinLoop();
      return;
    }
    if (overlayWindow.isVisible()) ensureOverlayAboveFullscreen();
  }, 1500);
}

function stopOverlayPinLoop(): void {
  if (!overlayPinTimer) return;
  clearInterval(overlayPinTimer);
  overlayPinTimer = null;
}

function installOverlayFullscreenHooks(): void {
  if (overlayFullscreenHooksInstalled) return;
  overlayFullscreenHooksInstalled = true;

  // macOS can drop collection behavior after Space / display changes — reassert.
  screen.on("display-metrics-changed", () => {
    if (!overlayWindow || !sessionActive) return;
    ensureOverlayAboveFullscreen();
    if (overlayMode === "active") {
      setOverlayMode("active");
    } else if (overlayMode === "pill" && overlayWindow.isVisible()) {
      repositionOverlayTopCenter();
    }
  });
}

function repositionOverlayTopCenter(): void {
  if (!overlayWindow || overlayMode !== "pill") return;
  const display = screen.getDisplayMatching(overlayWindow.getBounds());
  const { workArea } = display;
  const [width] = overlayWindow.getSize();
  const x = Math.round(workArea.x + (workArea.width - width) / 2);
  const y = Math.round(workArea.y + OVERLAY_TOP_MARGIN);
  overlayWindow.setPosition(x, y);
}

function setOverlayMode(mode: OverlayMode): void {
  if (!overlayWindow) return;
  overlayMode = mode;
  const display = screen.getDisplayMatching(overlayWindow.getBounds());
  // Active mode covers the full display (not workArea) so it still fills
  // true fullscreen Spaces where the menu bar / dock are gone.
  const area = mode === "active" ? display.bounds : display.workArea;

  if (mode === "active") {
    overlayWindow.setMinimumSize(320, 200);
    overlayWindow.setMaximumSize(area.width, area.height);
    overlayWindow.setSize(area.width, area.height, false);
    overlayWindow.setPosition(area.x, area.y);
    overlayWindow.setIgnoreMouseEvents(true, { forward: true });
    ensureOverlayAboveFullscreen();
    return;
  }

  overlayWindow.setIgnoreMouseEvents(false);
  overlayWindow.setMinimumSize(120, 32);
  // Tall enough for coding write-ups (problem / thoughts / solution / complexity).
  overlayWindow.setMaximumSize(720, 640);
  repositionOverlayTopCenter();
  ensureOverlayAboveFullscreen();
}

function createOverlayWindow(): void {
  if (overlayWindow) {
    revealOverlay();
    return;
  }

  const overlayWidth = 120;
  const overlayHeight = 56;

  overlayWindow = new BrowserWindow({
    width: overlayWidth,
    height: overlayHeight,
    frame: false,
    transparent: true,
    backgroundColor: "#00000000",
    alwaysOnTop: true,
    hasShadow: false,
    resizable: false,
    skipTaskbar: true,
    focusable: true,
    show: false,
    fullscreenable: false,
    minWidth: 120,
    minHeight: 32,
    maxWidth: 520,
    ...(process.platform === "darwin"
      ? {
          // NSPanel-style window: stays above fullscreen apps on modern macOS.
          type: "panel",
          roundedCorners: false,
        }
      : {}),
    webPreferences: {
      preload: path.join(__dirname, "../preload/index.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      backgroundThrottling: false,
    },
  });

  overlayWindow.webContents.setBackgroundThrottling(false);
  ensureOverlayAboveFullscreen();
  installOverlayFullscreenHooks();
  startOverlayPinLoop();

  const limits = readPlanLimits();
  const initialProtection = canDisableContentProtection(limits)
    ? contentProtection
    : false;
  contentProtection = initialProtection;
  overlayWindow.setContentProtection(initialProtection);

  loadRoute(overlayWindow, "/overlay");
  repositionOverlayTopCenter();

  overlayWindow.webContents.on("did-finish-load", () => {
    overlayWindow?.setBackgroundColor("#00000000");
    ensureOverlayAboveFullscreen();
    repositionOverlayTopCenter();
  });

  overlayWindow.on("blur", () => {
    if (!sessionActive) return;
    ensureOverlayAboveFullscreen();
  });

  overlayWindow.on("closed", () => {
    stopOverlayPinLoop();
    overlayWindow = null;
    sessionActive = false;
  });
}

function revealOverlay(): void {
  if (!overlayWindow) return;
  overlayPendingShow = false;
  overlayWindow.setBackgroundColor("#00000000");
  ensureOverlayAboveFullscreen();
  startOverlayPinLoop();
  if (overlayMode === "pill") {
    repositionOverlayTopCenter();
  } else if (overlayMode === "active") {
    setOverlayMode("active");
  }
  overlayWindow.showInactive();
  // Re-pin after show — macOS sometimes resets level on showInactive.
  ensureOverlayAboveFullscreen();
  isOverlayHidden = false;
  overlayWindow.webContents.send("landed:visibility", true);
}

function showOverlay(): void {
  if (!overlayWindow) createOverlayWindow();
  if (!overlayWindow) return;

  if (overlayWindow.webContents.isLoading()) {
    overlayPendingShow = true;
    overlayWindow.webContents.once("did-finish-load", () => {
      if (overlayPendingShow) {
        // Wait for renderer to size the window before revealing.
        setTimeout(() => {
          if (overlayPendingShow) revealOverlay();
        }, 300);
      }
    });
    return;
  }

  revealOverlay();
}

function hideOverlay(): void {
  overlayWindow?.hide();
  isOverlayHidden = true;
  overlayWindow?.webContents.send("landed:visibility", false);
}

function closeOverlay(): void {
  stopOverlayPinLoop();
  overlayWindow?.close();
  overlayWindow = null;
  sessionActive = false;
  overlayMode = "pill";
}

let lastHideShowShortcutAt = 0;

function handleHideShowShortcut(): void {
  const now = Date.now();
  if (now - lastHideShowShortcutAt < 120) return;
  lastHideShowShortcutAt = now;

  dashboardWindow?.webContents.send("landed:shortcut-toggle");

  if (!overlayWindow || !sessionActive) return;
  overlayWindow.webContents.send("landed:shortcut-toggle");
}

function isHideShowShortcutInput(input: Electron.Input): boolean {
  if (input.type !== "keyDown") return false;
  const mod = process.platform === "darwin" ? input.meta : input.control;
  return mod && (input.key === "\\" || input.code === "Backslash");
}

function moveOverlay(dx: number, dy: number): void {
  if (!overlayWindow) return;
  const [x, y] = overlayWindow.getPosition();
  overlayWindow.setPosition(x + dx, y + dy);
}

function registerShortcuts(): void {
  const hideShowAccelerator = "CommandOrControl+\\";
  if (!globalShortcut.register(hideShowAccelerator, handleHideShowShortcut)) {
    console.warn(
      `[landed] Failed to register global shortcut: ${hideShowAccelerator}`,
    );
  }

  globalShortcut.register("CommandOrControl+Enter", () => {
    if (sessionActive) overlayWindow?.webContents.send("landed:assist");
  });

  globalShortcut.register("CommandOrControl+Left", () => {
    if (sessionActive && overlayMode === "active") {
      overlayWindow?.webContents.send("landed:nudge-overlay", -40, 0);
      return;
    }
    moveOverlay(-40, 0);
  });

  globalShortcut.register("CommandOrControl+Right", () => {
    if (sessionActive && overlayMode === "active") {
      overlayWindow?.webContents.send("landed:nudge-overlay", 40, 0);
      return;
    }
    moveOverlay(40, 0);
  });

  globalShortcut.register("CommandOrControl+R", () => {
    if (sessionActive) overlayWindow?.webContents.send("landed:clear-session");
  });
}

async function requestMicAccess(): Promise<boolean> {
  if (process.platform !== "darwin") return true;
  const status = systemPreferences.getMediaAccessStatus("microphone");
  if (status === "granted") return true;
  if (status === "denied") return false;
  return systemPreferences.askForMediaAccess("microphone");
}

async function fixMicAccess(): Promise<boolean> {
  const granted = await requestMicAccess();
  if (!granted) return false;
  dashboardWindow?.webContents.send("landed:mic-granted");
  overlayWindow?.webContents.send("landed:mic-granted");
  micHelperWindow?.webContents.send("landed:mic-granted");
  return true;
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * Reject solid black/white frames that mean capture failed.
 * Do NOT reject dark UIs (LeetCode) — those have real variance from text.
 * Fullscreen transparent Electron windows often composite as solid white in
 * screencapture — those MUST be rejected so we retry after hiding the overlay.
 */
function captureStats(img: Electron.NativeImage): {
  mean: number;
  variance: number;
  samples: number;
} {
  const bitmap = img.getBitmap();
  const { width, height } = img.getSize();
  let sum = 0;
  let sumSq = 0;
  let samples = 0;
  const step = Math.max(4, Math.floor((width * height) / 1200)) * 4;
  for (let i = 0; i + 3 < bitmap.length; i += step) {
    const lum = (bitmap[i]! + bitmap[i + 1]! + bitmap[i + 2]!) / 3;
    sum += lum;
    sumSq += lum * lum;
    samples += 1;
  }
  if (samples < 1) return { mean: 0, variance: 0, samples: 0 };
  const mean = sum / samples;
  const variance = sumSq / samples - mean * mean;
  return { mean, variance, samples };
}

function isBlankCapture(img: Electron.NativeImage): boolean {
  if (!img || img.isEmpty()) return true;
  const { width, height } = img.getSize();
  if (width < 8 || height < 8) return true;

  const { mean, variance, samples } = captureStats(img);
  if (samples < 8) return true;
  // Solid white (failed transparent overlay capture) or solid black.
  if (variance < 12 && (mean > 245 || mean < 8)) return true;
  // Near-white compositor garbage with tiny UI chrome still looks "empty" to vision.
  if (mean > 235 && variance < 80) return true;
  if (mean < 12 && variance < 40) return true;
  return variance < 4;
}

type CaptureFrameResult = {
  imageBase64: string;
  width: number;
  height: number;
  sourceId: string;
  sourceType: "display" | "window" | "region";
  sourceName?: string;
};

function frameFromJpegBase64(
  jpeg: string,
  meta: Omit<CaptureFrameResult, "imageBase64">,
): CaptureFrameResult | null {
  if (!jpeg || jpeg.length < 2_000) return null;
  const img = nativeImage.createFromBuffer(Buffer.from(jpeg, "base64"));
  if (isBlankCapture(img)) return null;
  const size = img.getSize();
  const stats = captureStats(img);
  console.log(
    `[landed] Capture frame ${meta.sourceId}: ${size.width}x${size.height}, ` +
      `${Math.round(jpeg.length / 1024)}KB, mean=${stats.mean.toFixed(1)} var=${stats.variance.toFixed(1)}`,
  );
  try {
    fs.writeFileSync(
      path.join(os.tmpdir(), "landed-last-capture.jpg"),
      Buffer.from(jpeg, "base64"),
    );
  } catch {
    // ignore debug write failures
  }
  return {
    imageBase64: jpeg,
    width: size.width || meta.width,
    height: size.height || meta.height,
    sourceId: meta.sourceId,
    sourceType: meta.sourceType,
    sourceName: meta.sourceName,
  };
}

function displayForCapture(): Electron.Display {
  const anchor = overlayWindow?.getBounds() ?? screen.getCursorScreenPoint();
  return "width" in anchor
    ? screen.getDisplayMatching(anchor)
    : screen.getDisplayNearestPoint(anchor);
}

/** macOS CLI capture of a specific display rect — overlay must already be gone. */
async function captureViaScreencapture(
  display: Electron.Display,
): Promise<string | null> {
  if (process.platform !== "darwin") return null;
  const tmp = path.join(
    os.tmpdir(),
    `landed-screen-${process.pid}-${Date.now()}.jpg`,
  );
  const { x, y, width, height } = display.bounds;
  try {
    // -R uses display coordinates; works for the monitor under the overlay.
    await execFileAsync(
      "screencapture",
      ["-x", "-t", "jpg", "-R", `${x},${y},${width},${height}`, tmp],
      { timeout: 8000 },
    );
    const buf = fs.readFileSync(tmp);
    if (buf.length < 800) return null;
    const img = nativeImage.createFromBuffer(buf);
    if (isBlankCapture(img)) return null;
    return img.toJPEG(85).toString("base64");
  } catch (err) {
    console.warn("[landed] screencapture -R failed, trying full screen:", err);
    try {
      await execFileAsync("screencapture", ["-x", "-t", "jpg", tmp], {
        timeout: 8000,
      });
      const buf = fs.readFileSync(tmp);
      if (buf.length < 800) return null;
      const img = nativeImage.createFromBuffer(buf);
      if (isBlankCapture(img)) return null;
      return img.toJPEG(85).toString("base64");
    } catch (err2) {
      console.warn("[landed] screencapture failed:", err2);
      return null;
    }
  } finally {
    try {
      fs.unlinkSync(tmp);
    } catch {
      // ignore
    }
  }
}

async function captureViaDesktopCapturer(
  display: Electron.Display,
): Promise<string | null> {
  const frame = await captureDisplayFrame(display);
  return frame?.imageBase64 ?? null;
}

function pickScreenSource(
  list: Electron.DesktopCapturerSource[],
  display: Electron.Display,
): Electron.DesktopCapturerSource | undefined {
  const byId = list.find((s) => s.display_id === String(display.id));
  if (byId) return byId;
  // Some Electron builds leave display_id empty — match by label / order.
  const byName = list.find((s) =>
    s.name.toLowerCase().includes(`display ${display.id}`),
  );
  if (byName) return byName;
  return list.find((s) => s.id.startsWith("screen:")) ?? list[0];
}

async function captureDisplayFrame(
  display: Electron.Display,
): Promise<CaptureFrameResult | null> {
  const scale = display.scaleFactor || 1;
  const thumbW = Math.min(Math.round(display.bounds.width * scale), 1920);
  const thumbH = Math.min(Math.round(display.bounds.height * scale), 1080);

  const list = await desktopCapturer.getSources({
    types: ["screen"],
    thumbnailSize: { width: thumbW, height: thumbH },
  });

  if (!list.length) {
    console.warn("[landed] desktopCapturer returned 0 screen sources");
    return null;
  }

  const source = pickScreenSource(list, display);
  if (!source?.thumbnail || source.thumbnail.isEmpty()) {
    console.warn("[landed] desktopCapturer thumbnail empty for", display.id);
    return null;
  }
  if (isBlankCapture(source.thumbnail)) {
    const stats = captureStats(source.thumbnail);
    console.warn(
      `[landed] desktopCapturer blank frame display=${display.id} mean=${stats.mean.toFixed(1)} var=${stats.variance.toFixed(1)}`,
    );
    return null;
  }

  const size = source.thumbnail.getSize();
  const imageBase64 = source.thumbnail.toJPEG(85).toString("base64");
  const stats = captureStats(source.thumbnail);
  console.log(
    `[landed] desktopCapturer ${display.id}: ${size.width}x${size.height}, ` +
      `${Math.round(imageBase64.length / 1024)}KB, mean=${stats.mean.toFixed(1)} var=${stats.variance.toFixed(1)}`,
  );
  try {
    fs.writeFileSync(
      path.join(os.tmpdir(), "landed-last-capture.jpg"),
      Buffer.from(imageBase64, "base64"),
    );
  } catch {
    // ignore
  }
  return {
    imageBase64,
    width: size.width,
    height: size.height,
    sourceId: `display:${display.id}`,
    sourceType: "display",
    sourceName: source.name || `Display ${display.id}`,
  };
}

async function captureWindowFrame(
  windowId: string,
): Promise<CaptureFrameResult | null> {
  const list = await desktopCapturer.getSources({
    types: ["window"],
    thumbnailSize: { width: 1600, height: 900 },
    fetchWindowIcons: false,
  });
  const source = list.find((s) => s.id === windowId);
  if (!source?.thumbnail || isBlankCapture(source.thumbnail)) return null;
  const size = source.thumbnail.getSize();
  return {
    imageBase64: source.thumbnail.toJPEG(85).toString("base64"),
    width: size.width,
    height: size.height,
    sourceId: `window:${windowId}`,
    sourceType: "window",
    sourceName: source.name,
  };
}

async function listCaptureWindows(): Promise<
  Array<{ id: string; name: string; thumbnailDataUrl?: string }>
> {
  const list = await desktopCapturer.getSources({
    types: ["window"],
    thumbnailSize: { width: 240, height: 135 },
    fetchWindowIcons: false,
  });
  return list
    .filter((s) => s.name && !/^Landed/i.test(s.name))
    .slice(0, 40)
    .map((s) => ({
      id: s.id,
      name: s.name,
      thumbnailDataUrl: s.thumbnail?.isEmpty()
        ? undefined
        : s.thumbnail.toDataURL(),
    }));
}

async function captureRegionFrame(region: {
  x: number;
  y: number;
  width: number;
  height: number;
}): Promise<CaptureFrameResult | null> {
  if (process.platform !== "darwin") {
    // Fallback: capture nearest display and let renderer crop later if needed.
    const display = screen.getDisplayNearestPoint({
      x: region.x,
      y: region.y,
    });
    return captureDisplayFrame(display);
  }

  const tmp = path.join(
    os.tmpdir(),
    `landed-region-${process.pid}-${Date.now()}.jpg`,
  );
  try {
    await execFileAsync(
      "screencapture",
      [
        "-x",
        "-t",
        "jpg",
        "-R",
        `${Math.round(region.x)},${Math.round(region.y)},${Math.round(region.width)},${Math.round(region.height)}`,
        tmp,
      ],
      { timeout: 8000 },
    );
    const buf = fs.readFileSync(tmp);
    if (buf.length < 400) return null;
    const img = nativeImage.createFromBuffer(buf);
    if (isBlankCapture(img)) return null;
    const size = img.getSize();
    return {
      imageBase64: img.toJPEG(85).toString("base64"),
      width: size.width,
      height: size.height,
      sourceId: "region",
      sourceType: "region",
      sourceName: "Custom region",
    };
  } catch (err) {
    console.warn("[landed] region capture failed:", err);
    return null;
  } finally {
    try {
      fs.unlinkSync(tmp);
    } catch {
      // ignore
    }
  }
}

type OverlayCaptureSnapshot = {
  bounds: Electron.Rectangle;
  opacity: number;
  protection: boolean;
  wasVisible: boolean;
  mode: OverlayMode;
};

/**
 * Capture the real display UNDER the overlay.
 *
 * Critical: active-mode overlay is a fullscreen transparent BrowserWindow.
 * On macOS that composites as a near-solid WHITE frame in screencapture —
 * which we used to reject as blank, so asks got no screenshot at all.
 * Shrink/hide the overlay before grabbing, and prefer desktopCapturer
 * (honors setContentProtection) over screencapture.
 */
/**
 * Light capture: keep the overlay visible, briefly enable content protection,
 * and grab via desktopCapturer. Does NOT hide/show the window — callers that
 * need a hide-and-capture fallback should do that explicitly.
 */
async function captureLightScreenJpeg(): Promise<string | null> {
  const overlay = overlayWindow;
  const display = displayForCapture();
  const prevProtection = contentProtection;

  try {
    if (overlay && !overlay.isDestroyed()) {
      overlay.setContentProtection(true);
    }
    await sleep(40);
    const jpeg = await captureViaDesktopCapturer(display);
    if (jpeg) {
      console.log(
        `[landed] Light screen capture ok (${Math.round(jpeg.length / 1024)} KB base64)`,
      );
      return jpeg;
    }
  } catch (err) {
    console.warn("[landed] Light screen capture failed:", err);
  } finally {
    if (overlay && !overlay.isDestroyed()) {
      overlay.setContentProtection(prevProtection);
    }
  }

  return null;
}

async function captureActiveScreenJpeg(): Promise<string | null> {
  const overlay = overlayWindow;
  const display = displayForCapture();
  let snapshot: OverlayCaptureSnapshot | null = null;
  const micWasVisible =
    !!micHelperWindow &&
    !micHelperWindow.isDestroyed() &&
    micHelperWindow.isVisible();

  try {
    if (overlay && !overlay.isDestroyed()) {
      snapshot = {
        bounds: overlay.getBounds(),
        opacity: overlay.getOpacity(),
        protection: contentProtection,
        wasVisible: overlay.isVisible(),
        mode: overlayMode,
      };

      // 1) Exclude from capture APIs
      overlay.setContentProtection(true);
      // 2) Leave fullscreen transparent mode — that is what paints white
      if (overlayMode === "active") {
        overlayMode = "pill";
        overlay.setIgnoreMouseEvents(false);
        overlay.setMinimumSize(120, 32);
        overlay.setMaximumSize(720, 640);
        overlay.setSize(120, 56, false);
      }
      overlay.setOpacity(0);
      overlay.setIgnoreMouseEvents(true, { forward: false });
      overlay.setBounds({ x: -20000, y: -20000, width: 120, height: 56 });
      overlay.hide();
    }
    if (micWasVisible) {
      micHelperWindow?.hide();
    }

    await sleep(300);

    // desktopCapturer first — respects content protection / exclusion.
    let jpeg = await captureViaDesktopCapturer(display);
    if (!jpeg && process.platform === "darwin") {
      jpeg = await captureViaScreencapture(display);
    }
    if (!jpeg) {
      await sleep(200);
      jpeg = await captureViaDesktopCapturer(display);
      if (!jpeg && process.platform === "darwin") {
        jpeg = await captureViaScreencapture(display);
      }
    }
    if (!jpeg) {
      console.warn("[landed] Screen capture returned empty/blank frame.");
    } else {
      console.log(
        `[landed] Screen capture ok (${Math.round(jpeg.length / 1024)} KB base64)`,
      );
    }
    return jpeg;
  } catch (err) {
    console.warn("[landed] Screen capture failed:", err);
    return null;
  } finally {
    if (overlay && !overlay.isDestroyed() && snapshot) {
      overlay.setContentProtection(snapshot.protection);
      overlay.setOpacity(snapshot.opacity || 1);
      if (snapshot.mode === "active") {
        setOverlayMode("active");
        if (snapshot.wasVisible) {
          overlay.showInactive();
        }
        ensureOverlayAboveFullscreen();
      } else {
        overlayMode = "pill";
        overlay.setBounds(snapshot.bounds);
        repositionOverlayTopCenter();
        if (snapshot.wasVisible) {
          overlay.showInactive();
          ensureOverlayAboveFullscreen();
        }
        overlay.setIgnoreMouseEvents(false);
      }
    }
    if (micWasVisible) {
      micHelperWindow?.showInactive();
    }
  }
}

type CaptureScreenOptions = {
  /** Skip overlay hide/move — for background OCR while the session is live. */
  light?: boolean;
  displayId?: string | number;
  windowId?: string;
  region?: { x: number; y: number; width: number; height: number };
};

function resolveCaptureDisplay(
  displayId?: string | number,
): Electron.Display {
  if (displayId !== undefined && displayId !== null && `${displayId}` !== "") {
    const id = Number(displayId);
    const match = screen.getAllDisplays().find((d) => d.id === id);
    if (match) return match;
  }
  return displayForCapture();
}

async function captureScreenJpeg(
  options?: CaptureScreenOptions,
): Promise<string | null> {
  const frame = await captureScreenFrame(options);
  return frame?.imageBase64 ?? null;
}

/**
 * Rich capture used by the screen assistant (preview + vision).
 * Light captures keep the overlay visible; full captures hide it briefly
 * so the frame is never a white transparent composite.
 */
async function captureScreenFrame(
  options?: CaptureScreenOptions,
): Promise<CaptureFrameResult | null> {
  if (options?.windowId) {
    // Window capture via desktopCapturer — briefly protect overlay.
    const overlay = overlayWindow;
    const prev = contentProtection;
    try {
      if (overlay && !overlay.isDestroyed()) overlay.setContentProtection(true);
      await sleep(40);
      return await captureWindowFrame(options.windowId);
    } finally {
      if (overlay && !overlay.isDestroyed()) overlay.setContentProtection(prev);
    }
  }

  if (options?.region) {
    return withOverlayHiddenForCapture(async () =>
      captureRegionFrame(options.region!),
    );
  }

  if (options?.light) {
    const jpeg = await captureLightScreenJpeg();
    if (!jpeg) return null;
    const display = resolveCaptureDisplay(options.displayId);
    return {
      imageBase64: jpeg,
      width: Math.min(display.bounds.width, 1920),
      height: Math.min(display.bounds.height, 1080),
      sourceId: `display:${display.id}`,
      sourceType: "display",
      sourceName: `Display ${display.id}`,
    };
  }

  return withOverlayHiddenForCapture(async () => {
    const display = resolveCaptureDisplay(options?.displayId);
    const meta = {
      width: display.bounds.width,
      height: display.bounds.height,
      sourceId: `display:${display.id}`,
      sourceType: "display" as const,
      sourceName: `Display ${display.id}`,
    };

    // Prefer desktopCapturer first — it honors setContentProtection and avoids
    // the macOS white-frame bug from capturing a transparent Electron overlay.
    let frame = await captureDisplayFrame(display);
    if (!frame && process.platform === "darwin") {
      const jpeg = await captureViaScreencapture(display);
      if (jpeg) frame = frameFromJpegBase64(jpeg, meta);
    }
    if (!frame) {
      await sleep(400);
      frame = await captureDisplayFrame(display);
      if (!frame && process.platform === "darwin") {
        const jpeg = await captureViaScreencapture(display);
        if (jpeg) frame = frameFromJpegBase64(jpeg, meta);
      }
    }

    // Last resort: try every display and keep the most detailed frame.
    if (!frame) {
      let best: CaptureFrameResult | null = null;
      let bestVar = -1;
      for (const d of screen.getAllDisplays()) {
        const candidate =
          (await captureDisplayFrame(d)) ??
          (process.platform === "darwin"
            ? frameFromJpegBase64(await captureViaScreencapture(d) ?? "", {
                width: d.bounds.width,
                height: d.bounds.height,
                sourceId: `display:${d.id}`,
                sourceType: "display",
                sourceName: `Display ${d.id}`,
              })
            : null);
        if (!candidate) continue;
        const img = nativeImage.createFromBuffer(
          Buffer.from(candidate.imageBase64, "base64"),
        );
        const { variance } = captureStats(img);
        if (variance > bestVar) {
          bestVar = variance;
          best = candidate;
        }
      }
      frame = best;
    }

    if (!frame) {
      const perm = getPermissionStatus();
      console.warn(
        `[landed] Screen frame capture empty/blank (screenStatus=${perm.screenStatus ?? "unknown"})`,
      );
    }
    return frame;
  });
}

async function withOverlayHiddenForCapture<T>(
  grab: () => Promise<T>,
): Promise<T> {
  const overlay = overlayWindow;
  let snapshot: OverlayCaptureSnapshot | null = null;
  const micWasVisible =
    !!micHelperWindow &&
    !micHelperWindow.isDestroyed() &&
    micHelperWindow.isVisible();

  try {
    if (overlay && !overlay.isDestroyed()) {
      snapshot = {
        bounds: overlay.getBounds(),
        opacity: overlay.getOpacity(),
        protection: contentProtection,
        wasVisible: overlay.isVisible(),
        mode: overlayMode,
      };
      overlay.setContentProtection(true);
      if (overlayMode === "active") {
        overlayMode = "pill";
        overlay.setIgnoreMouseEvents(false);
        overlay.setMinimumSize(120, 32);
        overlay.setMaximumSize(720, 640);
        overlay.setSize(120, 56, false);
      }
      overlay.setOpacity(0);
      overlay.setIgnoreMouseEvents(true, { forward: false });
      overlay.setBounds({ x: -20000, y: -20000, width: 120, height: 56 });
      overlay.hide();
    }
    if (micWasVisible) micHelperWindow?.hide();

    // Also hide the assistant dashboard so we capture the user's real screen.
    const dashboardWasVisible =
      !!dashboardWindow &&
      !dashboardWindow.isDestroyed() &&
      dashboardWindow.isVisible();
    if (dashboardWasVisible) {
      dashboardWindow?.hide();
    }

    // Give macOS compositor time to drop the transparent fullscreen layer.
    await sleep(550);
    try {
      return await grab();
    } finally {
      if (dashboardWasVisible) {
        dashboardWindow?.showInactive();
      }
    }
  } finally {
    if (overlay && !overlay.isDestroyed() && snapshot) {
      overlay.setContentProtection(snapshot.protection);
      overlay.setOpacity(snapshot.opacity || 1);
      if (snapshot.mode === "active") {
        setOverlayMode("active");
        if (snapshot.wasVisible) overlay.showInactive();
        ensureOverlayAboveFullscreen();
      } else {
        overlayMode = "pill";
        overlay.setBounds(snapshot.bounds);
        repositionOverlayTopCenter();
        if (snapshot.wasVisible) {
          overlay.showInactive();
          ensureOverlayAboveFullscreen();
        }
        overlay.setIgnoreMouseEvents(false);
      }
    }
    if (micWasVisible) micHelperWindow?.showInactive();
  }
}

async function sampleBackdropLuminanceAsync(rect: {
  x: number;
  y: number;
  width: number;
  height: number;
}): Promise<{ luminance: number; isDark: boolean }> {
  if (process.platform !== "darwin") {
    return { luminance: 0.6, isDark: false };
  }

  try {
    const display = screen.getDisplayNearestPoint({ x: rect.x, y: rect.y });
    // Tiny thumbnail only — full-resolution grabs allocate multi‑MB bitmaps
    // and can freeze the machine when the overlay is open.
    const list = await desktopCapturer.getSources({
      types: ["screen"],
      thumbnailSize: { width: 64, height: 64 },
    });

    const source =
      list.find((s) => s.display_id === String(display.id)) ?? list[0];
    if (!source?.thumbnail || source.thumbnail.isEmpty()) {
      return { luminance: 0.55, isDark: false };
    }

    const img = source.thumbnail;
    const bitmap = img.getBitmap();
    const w = img.getSize().width;
    const h = img.getSize().height;

    const relX = ((rect.x - display.bounds.x) / display.bounds.width) * w;
    const relY = ((rect.y - display.bounds.y) / display.bounds.height) * h;
    const relW = (rect.width / display.bounds.width) * w;
    const relH = (rect.height / display.bounds.height) * h;

    const x0 = Math.max(0, Math.floor(relX));
    const y0 = Math.max(0, Math.floor(relY));
    const x1 = Math.min(w - 1, Math.floor(relX + relW));
    const y1 = Math.min(h - 1, Math.floor(relY + relH));

    let sum = 0;
    let count = 0;
    for (let y = y0; y <= y1; y += 4) {
      for (let x = x0; x <= x1; x += 4) {
        const i = (y * w + x) * 4;
        const b = bitmap[i] ?? 0;
        const g = bitmap[i + 1] ?? 0;
        const r = bitmap[i + 2] ?? 0;
        sum += 0.2126 * r + 0.7152 * g + 0.0722 * b;
        count += 1;
      }
    }

    const luminance = count ? sum / count / 255 : 0.5;
    return { luminance, isDark: luminance < 0.42 };
  } catch {
    return { luminance: 0.55, isDark: false };
  }
}

function micAppDisplayName(): string {
  return "Landed";
}

function createMicHelperWindow(): BrowserWindow {
  if (micHelperWindow) return micHelperWindow;

  micHelperWindow = new BrowserWindow({
    width: 420,
    height: 320,
    show: false,
    skipTaskbar: true,
    title: "Landed Microphone",
    backgroundColor: "#09090b",
    webPreferences: {
      preload: path.join(__dirname, "../preload/index.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      backgroundThrottling: false,
    },
  });

  micHelperWindow.webContents.setBackgroundThrottling(false);

  loadRoute(micHelperWindow, "/mic-helper");

  micHelperWindow.on("closed", () => {
    micHelperWindow = null;
  });

  return micHelperWindow;
}

function showMicHelperWindow(): void {
  const win = createMicHelperWindow();
  win.show();
  win.focus();
  win.webContents.send("landed:request-mic-permission");
}

function hideMicHelperWindow(): void {
  micHelperWindow?.hide();
}

type PermissionKey = "accessibility" | "microphone" | "screen";

/**
 * Fast, synchronous permission snapshot.
 * Avoid desktopCapturer.getSources here — it blocks the main process for
 * hundreds of ms and makes every button that awaits IPC feel dead.
 */
function getPermissionStatus(): {
  accessibility: boolean;
  microphone: boolean;
  screen: boolean;
  screenStatus?: string;
} {
  if (process.platform !== "darwin") {
    return {
      accessibility: true,
      microphone: true,
      screen: true,
      screenStatus: "granted",
    };
  }

  const mic = systemPreferences.getMediaAccessStatus("microphone");
  const screenStatus = systemPreferences.getMediaAccessStatus("screen");
  console.log(`[landed] Permission screen=${screenStatus} mic=${mic}`);

  return {
    accessibility: systemPreferences.isTrustedAccessibilityClient(false),
    microphone: mic === "granted",
    screen: screenStatus === "granted",
    screenStatus,
  };
}

function openPermissionSettings(key: PermissionKey): void {
  if (process.platform === "win32") {
    const urls: Record<PermissionKey, string> = {
      accessibility: "ms-settings:privacy-accessibility",
      microphone: "ms-settings:privacy-microphone",
      screen: "ms-settings:privacy",
    };
    void shell.openExternal(urls[key]);
    return;
  }

  if (process.platform !== "darwin") return;

  const urls: Record<PermissionKey, string> = {
    accessibility:
      "x-apple.systempreferences:com.apple.preference.security?Privacy_Accessibility",
    microphone:
      "x-apple.systempreferences:com.apple.preference.security?Privacy_Microphone",
    screen:
      "x-apple.systempreferences:com.apple.preference.security?Privacy_ScreenCapture",
  };

  if (key === "accessibility") {
    systemPreferences.isTrustedAccessibilityClient(true);
  } else if (key === "microphone") {
    void systemPreferences.askForMediaAccess("microphone");
  } else if (key === "screen") {
    void desktopCapturer.getSources({
      types: ["screen"],
      thumbnailSize: { width: 1, height: 1 },
    });
  }

  void shell.openExternal(urls[key]);
}

function setupMediaPermissions(): void {
  const ses = session.defaultSession;

  ses.setPermissionRequestHandler((_webContents, permission, callback) => {
    callback(permission === "media" || permission === "display-capture");
  });

  ses.setPermissionCheckHandler((_webContents, permission) => {
    return permission === "media" || (permission as string) === "display-capture";
  });

  if (process.platform === "darwin") {
    ses.setDisplayMediaRequestHandler(
      async (_request, callback) => {
        const sources = await desktopCapturer.getSources({
          types: ["screen", "window"],
          thumbnailSize: { width: 0, height: 0 },
        });

        if (!sources.length) {
          callback({});
          return;
        }

        // Prefer a full screen source over a random window.
        const screenSource =
          sources.find((s) => s.id.startsWith("screen:")) ?? sources[0];

        callback({
          video: screenSource,
          audio: "loopback",
        });
      },
      { useSystemPicker: false },
    );
  }
}

app.whenReady().then(async () => {
  setDockIcon();
  setupMediaPermissions();
  startOAuthLoopbackServer();
  const startupUrl = process.argv.find((arg) => arg.startsWith("landed://"));
  if (startupUrl) handleDeepLink(startupUrl);

  // Register IPC before any BrowserWindow loads — otherwise early renderer
  // invokes (overlay-ready, get-settings) hang with no handler.
  ipcMain.handle("landed:ensure-microphone", async () => fixMicAccess());

  // Never expose OpenAI keys from packaged builds — production uses /api/*.
  ipcMain.handle("landed:get-openai-key", () =>
    isDev ? loadOpenAIKey() : undefined,
  );

  ipcMain.handle("landed:get-api-base-url", () => loadBillingApiBase());

  ipcMain.handle("landed:copy-text", (_event, text: string) => {
    if (typeof text !== "string") return false;
    const trimmed = text.trim();
    if (!trimmed) return false;
    clipboard.writeText(trimmed);
    return true;
  });

  ipcMain.handle(
    "landed:sample-backdrop",
    async (_event, rect: { x: number; y: number; width: number; height: number }) =>
      sampleBackdropLuminanceAsync(rect),
  );

  ipcMain.handle(
    "landed:capture-screen",
    async (_event, options?: CaptureScreenOptions) => captureScreenJpeg(options),
  );

  ipcMain.handle(
    "landed:capture-frame",
    async (_event, options?: CaptureScreenOptions) => captureScreenFrame(options),
  );

  ipcMain.handle("landed:list-windows", async () => listCaptureWindows());

  ipcMain.handle("landed:ensure-audio-setup", async () => true);

  ipcMain.handle("landed:get-mic-app-name", () => micAppDisplayName());

  ipcMain.handle("landed:show-mic-helper", () => {
    showMicHelperWindow();
    return true;
  });

  ipcMain.handle("landed:hide-mic-helper", () => {
    hideMicHelperWindow();
    return true;
  });

  ipcMain.on("landed:trigger-mock", () => {
    micHelperWindow?.webContents.send("landed:trigger-mock");
    dashboardWindow?.webContents.send("landed:trigger-mock");
  });

  ipcMain.on("landed:request-live-transcript", () => {
    micHelperWindow?.webContents.send("landed:request-live-transcript");
    dashboardWindow?.webContents.send("landed:request-live-transcript");
  });

  /** Prefer mic-helper as transcription source; dashboard only as fallback. */
  ipcMain.on("landed:live-transcript-push", (event, payload) => {
    const fromMicHelper =
      micHelperWindow &&
      !micHelperWindow.isDestroyed() &&
      event.sender.id === micHelperWindow.webContents.id;
    if (!fromMicHelper && micHelperWindow && !micHelperWindow.isDestroyed()) {
      return;
    }
    overlayWindow?.webContents.send("landed:live-transcript", payload);
    dashboardWindow?.webContents.send("landed:live-transcript", payload);
  });

  ipcMain.on("landed:session-listening", (_event, listening: boolean) => {
    micHelperWindow?.webContents.send("landed:session-listening", listening);
    dashboardWindow?.webContents.send("landed:session-listening", listening);
    overlayWindow?.webContents.send("landed:session-listening", listening);
  });

  ipcMain.on("landed:clear-live-transcript", () => {
    micHelperWindow?.webContents.send("landed:clear-live-transcript");
    dashboardWindow?.webContents.send("landed:clear-live-transcript");
  });

  ipcMain.on("landed:generate-meeting-summary", (_event, payload) => {
    createDashboardWindow();
    sendWhenReady(dashboardWindow, "landed:generate-meeting-summary", payload);
  });

  ipcMain.handle("landed:get-settings", () => ({
    contentProtection,
    platform: process.platform,
    sessionActive,
    useCallAudio: consumeCallAudioSetupFlag(),
  }));

  ipcMain.handle(
    "landed:set-content-protection",
    (_event, enabled: boolean, plan?: string) => {
      const limits = readPlanLimits();
      const activePlan = plan ?? limits.plan;

      if (plan && plan !== limits.plan) {
        writePlanLimits({ ...limits, plan });
      }

      if (
        enabled &&
        activePlan !== "undetectable" &&
        activePlan !== "pro" &&
        activePlan !== "lifetime" &&
        activePlan !== "solo"
      ) {
        enabled = false;
      }

      contentProtection = enabled;
      overlayWindow?.setContentProtection(enabled);
      return contentProtection;
    },
  );

  ipcMain.handle("landed:resize", (_event, width: number, height: number) => {
    if (!overlayWindow) return;
    // Active mode owns the full work area — ignore content-driven resizes.
    if (overlayMode === "active") return;
    const display = screen.getDisplayMatching(overlayWindow.getBounds());
    const { workArea } = display;
    const nextW = Math.max(120, Math.min(Math.round(width), 720, workArea.width));
    const nextH = Math.max(32, Math.min(Math.round(height), 640, workArea.height));
    overlayWindow.setSize(nextW, nextH, false);
    repositionOverlayTopCenter();
  });

  ipcMain.handle("landed:set-overlay-mode", (_event, mode: OverlayMode) => {
    setOverlayMode(mode);
  });

  ipcMain.handle("landed:overlay-ready", () => {
    if (overlayPendingShow) revealOverlay();
    if (sessionActive) {
      sendWhenReady(overlayWindow, "landed:session-started");
      sendWhenReady(micHelperWindow, "landed:session-started");
    }
  });

  ipcMain.handle(
    "landed:set-ignore-mouse-events",
    (_event, ignore: boolean, options?: { forward?: boolean }) => {
      if (!overlayWindow) return;
      if (ignore) {
        overlayWindow.setIgnoreMouseEvents(true, { forward: options?.forward ?? true });
      } else {
        overlayWindow.setIgnoreMouseEvents(false);
      }
    },
  );

  ipcMain.handle("landed:move-by", (_event, dx: number, dy: number) => {
    moveOverlay(dx, dy);
  });

  ipcMain.handle("landed:hide", () => hideOverlay());

  ipcMain.handle("landed:show", () => showOverlay());

  ipcMain.handle("landed:trigger-shortcut-toggle", () => {
    handleHideShowShortcut();
    return true;
  });

  ipcMain.handle("landed:get-displays", () =>
    screen.getAllDisplays().map((d, i) => ({
      id: d.id,
      label: `Display ${i + 1}`,
      bounds: d.bounds,
    })),
  );

  ipcMain.handle("landed:move-to-display", (_event, displayId: number) => {
    const display = screen.getAllDisplays().find((d) => d.id === displayId);
    if (!display || !overlayWindow) return false;
    if (overlayMode === "active") {
      overlayWindow.setMaximumSize(display.bounds.width, display.bounds.height);
      overlayWindow.setSize(display.bounds.width, display.bounds.height, false);
      overlayWindow.setPosition(display.bounds.x, display.bounds.y);
    } else {
      overlayWindow.setPosition(display.bounds.x + 24, display.bounds.y + 48);
    }
    ensureOverlayAboveFullscreen();
    return true;
  });

  ipcMain.handle("landed:start-session", async (_event, opts?: { demo?: boolean }) => {
    if (sessionActive) {
      createDashboardWindow();
      createOverlayWindow();
      showOverlay();
      // Overlay-only — keep settings host hidden unless user has it open.
      if (!settingsVisible) {
        dashboardWindow?.hide();
      }
      return true;
    }

    const limits = readPlanLimits();
    if (!canStartSessionFromLimits(limits)) {
      return false;
    }

    const isDemo = Boolean(opts?.demo);
    // Mic helper is optional until permission is granted.
    const micGranted = isDemo ? true : false;
    sessionActive = true;
    createDashboardWindow();
    createMicHelperWindow();
    createOverlayWindow();
    // Stay in pill mode until the overlay renderer activates listening and
    // switches to active mode — fullscreen transparent windows with no UI
    // corrupt macOS compositing.
    showOverlay();
    sendWhenReady(micHelperWindow, "landed:session-started");
    sendWhenReady(dashboardWindow, "landed:session-started");
    sendWhenReady(overlayWindow, "landed:session-started");
    sendWhenReady(dashboardWindow, "landed:navigate", "/");
    micHelperWindow?.webContents.setBackgroundThrottling(false);
    dashboardWindow?.webContents.setBackgroundThrottling(false);
    // Host window is settings-only; hide it while the overlay runs — unless
    // settings was just opened (gear click racing auto-session start).
    if (!settingsVisible) {
      dashboardWindow?.hide();
    }
    if (micGranted) {
      showMicHelperWindow();
    }
    return true;
  });

  ipcMain.handle("landed:stop-session", () => {
    sessionActive = false;
    overlayMode = "pill";
    closeOverlay();
    hideMicHelperWindow();
    micHelperWindow?.webContents.send("landed:session-stopped");
    dashboardWindow?.webContents.send("landed:session-stopped");
    return true;
  });

  ipcMain.handle("landed:request-end-session", () => {
    sendWhenReady(overlayWindow, "landed:request-end-session");
    return true;
  });

  ipcMain.handle("landed:open-dashboard", () => {
    // No dashboard home — open settings.
    deliverOpenSettings("general");
    return true;
  });

  ipcMain.handle("landed:toggle-dashboard", () => {
    if (dashboardWindow && !dashboardWindow.isDestroyed() && dashboardWindow.isVisible()) {
      if (!dashboardWindow.isFocused()) {
        settingsVisible = true;
        showDashboardWindow();
        return true;
      }
      settingsVisible = false;
      dashboardWindow.hide();
      return false;
    }
    deliverOpenSettings("general");
    return true;
  });

  ipcMain.handle("landed:focus-dashboard", (_event, path?: string) => {
    const route = typeof path === "string" ? path : "";
    if (!route || route === "/" || route.startsWith("/assistant")) {
      // Overlay-only product: keep host hidden; show overlay if running.
      createDashboardWindow();
      if (sessionActive) {
        createOverlayWindow();
        showOverlay();
      }
      if (!settingsVisible) {
        dashboardWindow?.hide();
      }
      sendWhenReady(dashboardWindow, "landed:navigate", "/");
      return true;
    }
    if (route.startsWith("/settings")) {
      deliverOpenSettings(
        route.includes("billing") ? "billing" : "general",
      );
      return true;
    }
    if (
      route.startsWith("/paywall") ||
      route.startsWith("/auth") ||
      route.startsWith("/login") ||
      route.startsWith("/signup") ||
      route.startsWith("/onboarding") ||
      route.startsWith("/welcome") ||
      route.startsWith("/try")
    ) {
      createDashboardWindow();
      sendWhenReady(dashboardWindow, "landed:navigate", route);
      showDashboardWindow();
      return true;
    }
    // Unknown routes → settings (no dashboard home).
    deliverOpenSettings("general");
    return true;
  });

  ipcMain.handle("landed:open-settings", (_event, section?: string) => {
    deliverOpenSettings(typeof section === "string" && section ? section : "general");
    return true;
  });

  ipcMain.handle("landed:hide-dashboard", () => {
    settingsVisible = false;
    if (dashboardWindow && !dashboardWindow.isDestroyed()) {
      dashboardWindow.hide();
    }
    return true;
  });

  ipcMain.handle("landed:consume-pending-settings", () => {
    const section = pendingSettingsSection;
    pendingSettingsSection = null;
    return section;
  });

  ipcMain.handle("landed:notify-store-changed", () => {
    dashboardWindow?.webContents.send("landed:store-changed");
    overlayWindow?.webContents.send("landed:store-changed");
    return true;
  });

  ipcMain.handle(
    "landed:sync-plan-limits",
    (_event, state: PlanLimitsState) => {
      const freeOverlaySecondsUsed = Math.max(
        0,
        state.freeOverlaySecondsUsed ?? 0,
      );
      const next: PlanLimitsState = {
        plan: state.plan ?? "free",
        freeOverlaySecondsUsed,
        freeQuestionsUsed: resolveFreeQuestionsUsed(
          state.freeQuestionsUsed,
          freeOverlaySecondsUsed,
        ),
      };
      writePlanLimits(next);

      // Do not close the overlay here — the final reserved ask may still be
      // in flight. Renderer enforceHardPaywall owns the hard stop after it.
      if (sessionActive && !canStartSessionFromLimits(next)) {
        sendWhenReady(dashboardWindow, "landed:navigate", "/paywall");
      }

      return true;
    },
  );

  ipcMain.handle("landed:quit", () => {
    sessionActive = false;
    for (const win of BrowserWindow.getAllWindows()) {
      if (win.isDestroyed()) continue;
      win.removeAllListeners("close");
      win.destroy();
    }
    app.quit();
    // If something still blocks graceful quit (macOS overlay/helper windows), force exit.
    setTimeout(() => {
      app.exit(0);
    }, 750);
    return true;
  });

  ipcMain.handle("landed:open-external", (_event, url: string) => {
    return shell.openExternal(url);
  });

  ipcMain.handle("landed:get-permission-status", () => getPermissionStatus());

  ipcMain.handle("landed:open-permission-settings", (_event, key: PermissionKey) => {
    openPermissionSettings(key);
    return true;
  });

  ipcMain.handle(
    "landed:set-dashboard-layout",
    (_event, layout: "onboarding" | "dashboard" | "paywall") => {
      if (!dashboardWindow) return false;
      if (layout === "onboarding") {
        dashboardWindow.setMinimumSize(400, 540);
        dashboardWindow.setSize(440, 600, true);
        dashboardWindow.setBackgroundColor("#ffffff");
        dashboardWindow.center();
      } else if (layout === "paywall") {
        dashboardWindow.setMinimumSize(980, 640);
        dashboardWindow.setSize(1120, 760, true);
        dashboardWindow.setBackgroundColor("#ffffff");
        dashboardWindow.center();
      } else {
        // Settings host window
        applySettingsWindowLayout();
      }
      return true;
    },
  );

  createDashboardWindow();
  createMicHelperWindow();
  registerShortcuts();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createDashboardWindow();
      return;
    }
    // Dock click → focus overlay if running, otherwise settings.
    createDashboardWindow();
    if (sessionActive) {
      createOverlayWindow();
      showOverlay();
      if (settingsVisible) {
        showDashboardWindow();
      } else {
        dashboardWindow?.hide();
      }
      return;
    }
    deliverOpenSettings("general");
  });
});

// Handle deep links: landed://auth/callback, landed://billing/success, landed://open, etc.
function handleDeepLink(url: string) {
  if (!url.startsWith("landed://")) return;
  const path = url.slice("landed://".length).split("?")[0]?.replace(/\/$/, "") ?? "";
  if (path.startsWith("billing/")) {
    sendWhenReady(dashboardWindow, "landed:billing-callback", url);
  } else if (path.startsWith("auth/")) {
    sendWhenReady(dashboardWindow, "landed:auth-callback", url);
  } else if (path === "open") {
    // Open / focus the dashboard.
  }
  if (!dashboardWindow) createDashboardWindow();
  else {
    dashboardWindow.show();
    if (dashboardWindow.isMinimized()) dashboardWindow.restore();
    dashboardWindow.focus();
  }
}

// macOS: open-url fired when app is already running
app.on("open-url", (event, url) => {
  event.preventDefault();
  handleDeepLink(url);
});

// Windows/Linux: second instance carries the URL as argv
app.on("second-instance", (_event, argv) => {
  const url = argv.find((a) => a.startsWith("landed://"));
  if (url) handleDeepLink(url);
  if (process.platform === "darwin") app.dock?.show();
  if (dashboardWindow) {
    dashboardWindow.show();
    if (dashboardWindow.isMinimized()) dashboardWindow.restore();
    dashboardWindow.focus();
    return;
  }
  createDashboardWindow();
});

app.on("will-quit", () => {
  globalShortcut.unregisterAll();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
