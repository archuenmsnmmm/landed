import { contextBridge, desktopCapturer, ipcRenderer } from "electron";

export interface LiveTranscriptPayload {
  lines: Array<{
    id: string;
    speaker: "You" | "Prospect" | "Other";
    text: string;
    timestamp: number;
  }>;
  interim: string;
  error: string | null;
  hearingAudio: boolean;
  isSpeaking?: boolean;
  hasMic: boolean;
  hasSystemAudio: boolean;
  aiReady: boolean;
  audioSource: "desktop-capture" | "microphone" | null;
  isDemo?: boolean;
}

export interface LandedAPI {
  getSettings: () => Promise<{
    contentProtection: boolean;
    platform: string;
    sessionActive: boolean;
    useCallAudio?: boolean;
  }>;
  setContentProtection: (enabled: boolean, plan?: string) => Promise<boolean>;
  resize: (width: number, height: number) => Promise<void>;
  setOverlayMode: (mode: "pill" | "active") => Promise<void>;
  setIgnoreMouseEvents: (ignore: boolean, options?: { forward?: boolean }) => Promise<void>;
  ready: () => Promise<void>;
  moveBy: (dx: number, dy: number) => Promise<void>;
  onNudgeOverlay: (callback: (dx: number, dy: number) => void) => () => void;
  hide: () => Promise<void>;
  show: () => Promise<void>;
  getDisplays: () => Promise<
    Array<{
      id: number;
      label: string;
      bounds: { x: number; y: number; width: number; height: number };
    }>
  >;
  moveToDisplay: (displayId: number) => Promise<boolean>;
  startSession: (opts?: { demo?: boolean }) => Promise<boolean>;
  stopSession: () => Promise<boolean>;
  requestEndSession: () => Promise<boolean>;
  openDashboard: () => Promise<boolean>;
  toggleDashboard: () => Promise<boolean>;
  focusDashboard: (path?: string) => Promise<boolean>;
  hideDashboard: () => Promise<boolean>;
  openSettings: (section?: string) => Promise<boolean>;
  onOpenSettings: (callback: (section: string) => void) => () => void;
  consumePendingSettings: () => Promise<string | null>;
  quit: () => Promise<void>;
  getPermissionStatus: () => Promise<{
    accessibility: boolean;
    microphone: boolean;
    screen: boolean;
  }>;
  openPermissionSettings: (
    key: "accessibility" | "microphone" | "screen",
  ) => Promise<boolean>;
  setDashboardLayout: (layout: "onboarding" | "dashboard" | "paywall") => Promise<boolean>;
  onAssist: (callback: () => void) => () => void;
  onClearSession: (callback: () => void) => () => void;
  onVisibility: (callback: (visible: boolean) => void) => () => void;
  onShortcutToggle: (callback: () => void) => () => void;
  triggerShortcutToggle: () => Promise<boolean>;
  onSessionStarted: (callback: () => void) => () => void;
  onSessionStopped: (callback: () => void) => () => void;
  onRequestEndSession: (callback: () => void) => () => void;
  onNavigate: (callback: (path: string) => void) => () => void;
  onStoreChanged: (callback: () => void) => () => void;
  notifyStoreChanged: () => Promise<boolean>;
  syncPlanLimits: (state: {
    plan: string;
    freeOverlaySecondsUsed: number;
    freeQuestionsUsed: number;
  }) => Promise<boolean>;
  onAuthCallback?: (callback: (url: string) => void) => () => void;
  onBillingCallback?: (callback: (url: string) => void) => () => void;
  openExternal?: (url: string) => Promise<void>;
  getDesktopAudioSources: () => Promise<Array<{ id: string; name: string }>>;
  ensureMicrophone: () => Promise<boolean>;
  getOpenAIKey: () => Promise<string | undefined>;
  getApiBaseUrl: () => Promise<string>;
  copyText: (text: string) => Promise<boolean>;
  onMicGranted: (callback: () => void) => () => void;
  sampleBackdrop: (rect: {
    x: number;
    y: number;
    width: number;
    height: number;
  }) => Promise<{ luminance: number; isDark: boolean }>;
  captureScreen: (options?: {
    light?: boolean;
    displayId?: string | number;
    windowId?: string;
    region?: { x: number; y: number; width: number; height: number };
  }) => Promise<string | null>;
  captureFrame: (options?: {
    light?: boolean;
    displayId?: string | number;
    windowId?: string;
    region?: { x: number; y: number; width: number; height: number };
  }) => Promise<{
    imageBase64: string;
    width: number;
    height: number;
    sourceId: string;
    sourceType: "display" | "window" | "region";
    sourceName?: string;
  } | null>;
  listWindows: () => Promise<
    Array<{ id: string; name: string; thumbnailDataUrl?: string }>
  >;
  triggerMock: () => void;
  onTriggerMock: (callback: () => void) => () => void;
  ensureAudioSetup: () => Promise<boolean>;
  getMicAppName: () => Promise<string>;
  showMicHelper: () => Promise<boolean>;
  hideMicHelper: () => Promise<boolean>;
  onRequestMicPermission: (callback: () => void) => () => void;
  pushLiveTranscript: (state: LiveTranscriptPayload) => void;
  onLiveTranscript: (callback: (state: LiveTranscriptPayload) => void) => () => void;
  requestLiveTranscript: () => void;
  onRequestLiveTranscript: (callback: () => void) => () => void;
  setSessionListening: (listening: boolean) => void;
  onSessionListening: (callback: (listening: boolean) => void) => () => void;
  onClearLiveTranscript: (callback: () => void) => () => void;
  clearLiveTranscript: () => void;
  requestMeetingSummary: (payload: {
    meetingId: string;
    transcript: LiveTranscriptPayload["lines"];
  }) => void;
  onGenerateMeetingSummary: (
    callback: (payload: {
      meetingId: string;
      transcript: LiveTranscriptPayload["lines"];
    }) => void | Promise<void>,
  ) => () => void;
}

const landedAPI: LandedAPI = {
  syncPlanLimits: (state: {
    plan: string;
    freeOverlaySecondsUsed: number;
    freeQuestionsUsed: number;
  }) => ipcRenderer.invoke("landed:sync-plan-limits", state),
  getSettings: () => ipcRenderer.invoke("landed:get-settings"),
  setContentProtection: (enabled, plan) =>
    ipcRenderer.invoke("landed:set-content-protection", enabled, plan),
  resize: (width, height) => ipcRenderer.invoke("landed:resize", width, height),
  setOverlayMode: (mode) => ipcRenderer.invoke("landed:set-overlay-mode", mode),
  setIgnoreMouseEvents: (ignore, options) =>
    ipcRenderer.invoke("landed:set-ignore-mouse-events", ignore, options),
  ready: () => ipcRenderer.invoke("landed:overlay-ready"),
  moveBy: (dx, dy) => ipcRenderer.invoke("landed:move-by", dx, dy),
  onNudgeOverlay: (callback) => {
    const handler = (_event: Electron.IpcRendererEvent, dx: number, dy: number) =>
      callback(dx, dy);
    ipcRenderer.on("landed:nudge-overlay", handler);
    return () => ipcRenderer.removeListener("landed:nudge-overlay", handler);
  },
  hide: () => ipcRenderer.invoke("landed:hide"),
  show: () => ipcRenderer.invoke("landed:show"),
  getDisplays: () => ipcRenderer.invoke("landed:get-displays"),
  moveToDisplay: (displayId) =>
    ipcRenderer.invoke("landed:move-to-display", displayId),
  startSession: (opts?: { demo?: boolean }) =>
    ipcRenderer.invoke("landed:start-session", opts),
  stopSession: () => ipcRenderer.invoke("landed:stop-session"),
  requestEndSession: () => ipcRenderer.invoke("landed:request-end-session"),
  openDashboard: () => ipcRenderer.invoke("landed:open-dashboard"),
  toggleDashboard: () => ipcRenderer.invoke("landed:toggle-dashboard"),
  focusDashboard: (path) => ipcRenderer.invoke("landed:focus-dashboard", path),
  hideDashboard: () => ipcRenderer.invoke("landed:hide-dashboard"),
  openSettings: (section) =>
    ipcRenderer.invoke("landed:open-settings", section),
  onOpenSettings: (callback) => {
    const handler = (_event: Electron.IpcRendererEvent, section: string) =>
      callback(section || "general");
    ipcRenderer.on("landed:open-settings", handler);
    return () => ipcRenderer.removeListener("landed:open-settings", handler);
  },
  consumePendingSettings: () =>
    ipcRenderer.invoke("landed:consume-pending-settings"),
  quit: () => ipcRenderer.invoke("landed:quit"),
  getPermissionStatus: () => ipcRenderer.invoke("landed:get-permission-status"),
  openPermissionSettings: (key) =>
    ipcRenderer.invoke("landed:open-permission-settings", key),
  setDashboardLayout: (layout) =>
    ipcRenderer.invoke("landed:set-dashboard-layout", layout),
  onAssist: (callback) => {
    const handler = () => callback();
    ipcRenderer.on("landed:assist", handler);
    return () => ipcRenderer.removeListener("landed:assist", handler);
  },
  onClearSession: (callback) => {
    const handler = () => callback();
    ipcRenderer.on("landed:clear-session", handler);
    return () => ipcRenderer.removeListener("landed:clear-session", handler);
  },
  onVisibility: (callback) => {
    const handler = (_event: Electron.IpcRendererEvent, visible: boolean) =>
      callback(visible);
    ipcRenderer.on("landed:visibility", handler);
    return () => ipcRenderer.removeListener("landed:visibility", handler);
  },
  onShortcutToggle: (callback) => {
    const handler = () => callback();
    ipcRenderer.on("landed:shortcut-toggle", handler);
    return () => ipcRenderer.removeListener("landed:shortcut-toggle", handler);
  },
  triggerShortcutToggle: () =>
    ipcRenderer.invoke("landed:trigger-shortcut-toggle"),
  onSessionStarted: (callback) => {
    const handler = () => callback();
    ipcRenderer.on("landed:session-started", handler);
    return () => ipcRenderer.removeListener("landed:session-started", handler);
  },
  onSessionStopped: (callback) => {
    const handler = () => callback();
    ipcRenderer.on("landed:session-stopped", handler);
    return () => ipcRenderer.removeListener("landed:session-stopped", handler);
  },
  onRequestEndSession: (callback) => {
    const handler = () => callback();
    ipcRenderer.on("landed:request-end-session", handler);
    return () => ipcRenderer.removeListener("landed:request-end-session", handler);
  },
  onNavigate: (callback) => {
    const handler = (_event: Electron.IpcRendererEvent, path: string) =>
      callback(path);
    ipcRenderer.on("landed:navigate", handler);
    return () => ipcRenderer.removeListener("landed:navigate", handler);
  },
  onStoreChanged: (callback) => {
    const handler = () => callback();
    ipcRenderer.on("landed:store-changed", handler);
    return () => ipcRenderer.removeListener("landed:store-changed", handler);
  },
  notifyStoreChanged: () => ipcRenderer.invoke("landed:notify-store-changed"),
  openExternal: (url) => ipcRenderer.invoke("landed:open-external", url),
  getDesktopAudioSources: async () => {
    const sources = await desktopCapturer.getSources({
      types: ["screen"],
      thumbnailSize: { width: 1, height: 1 },
    });
    return sources.map(({ id, name }) => ({ id, name }));
  },
  ensureMicrophone: () => ipcRenderer.invoke("landed:ensure-microphone"),
  getOpenAIKey: () => ipcRenderer.invoke("landed:get-openai-key"),
  getApiBaseUrl: () => ipcRenderer.invoke("landed:get-api-base-url"),
  copyText: (text: string) => ipcRenderer.invoke("landed:copy-text", text),
  onMicGranted: (callback) => {
    const handler = () => callback();
    ipcRenderer.on("landed:mic-granted", handler);
    return () => ipcRenderer.removeListener("landed:mic-granted", handler);
  },
  sampleBackdrop: (rect) => ipcRenderer.invoke("landed:sample-backdrop", rect),
  captureScreen: (options) =>
    ipcRenderer.invoke("landed:capture-screen", options),
  captureFrame: (options) =>
    ipcRenderer.invoke("landed:capture-frame", options),
  listWindows: () => ipcRenderer.invoke("landed:list-windows"),
  triggerMock: () => {
    ipcRenderer.send("landed:trigger-mock");
  },
  onTriggerMock: (callback) => {
    const handler = () => callback();
    ipcRenderer.on("landed:trigger-mock", handler);
    return () => ipcRenderer.removeListener("landed:trigger-mock", handler);
  },
  ensureAudioSetup: () => ipcRenderer.invoke("landed:ensure-audio-setup"),
  getMicAppName: () => ipcRenderer.invoke("landed:get-mic-app-name"),
  showMicHelper: () => ipcRenderer.invoke("landed:show-mic-helper"),
  hideMicHelper: () => ipcRenderer.invoke("landed:hide-mic-helper"),
  onRequestMicPermission: (callback) => {
    const handler = () => callback();
    ipcRenderer.on("landed:request-mic-permission", handler);
    return () => ipcRenderer.removeListener("landed:request-mic-permission", handler);
  },
  pushLiveTranscript: (state) => {
    ipcRenderer.send("landed:live-transcript-push", state);
  },
  onLiveTranscript: (callback) => {
    const handler = (_event: Electron.IpcRendererEvent, state: LiveTranscriptPayload) =>
      callback(state);
    ipcRenderer.on("landed:live-transcript", handler);
    return () => ipcRenderer.removeListener("landed:live-transcript", handler);
  },
  requestLiveTranscript: () => {
    ipcRenderer.send("landed:request-live-transcript");
  },
  onRequestLiveTranscript: (callback) => {
    const handler = () => callback();
    ipcRenderer.on("landed:request-live-transcript", handler);
    return () => ipcRenderer.removeListener("landed:request-live-transcript", handler);
  },
  setSessionListening: (listening) => {
    ipcRenderer.send("landed:session-listening", listening);
  },
  onSessionListening: (callback) => {
    const handler = (_event: Electron.IpcRendererEvent, listening: boolean) =>
      callback(listening);
    ipcRenderer.on("landed:session-listening", handler);
    return () => ipcRenderer.removeListener("landed:session-listening", handler);
  },
  onClearLiveTranscript: (callback) => {
    const handler = () => callback();
    ipcRenderer.on("landed:clear-live-transcript", handler);
    return () => ipcRenderer.removeListener("landed:clear-live-transcript", handler);
  },
  clearLiveTranscript: () => {
    ipcRenderer.send("landed:clear-live-transcript");
  },
  requestMeetingSummary: (payload) => {
    ipcRenderer.send("landed:generate-meeting-summary", payload);
  },
  onGenerateMeetingSummary: (callback) => {
    const handler = (
      _event: Electron.IpcRendererEvent,
      payload: { meetingId: string; transcript: LiveTranscriptPayload["lines"] },
    ) => {
      void callback(payload);
    };
    ipcRenderer.on("landed:generate-meeting-summary", handler);
    return () => ipcRenderer.removeListener("landed:generate-meeting-summary", handler);
  },
  onAuthCallback: (callback) => {
    const handler = (_event: Electron.IpcRendererEvent, url: string) =>
      callback(url);
    ipcRenderer.on("landed:auth-callback", handler);
    return () => ipcRenderer.removeListener("landed:auth-callback", handler);
  },
  onBillingCallback: (callback) => {
    const handler = (_event: Electron.IpcRendererEvent, url: string) =>
      callback(url);
    ipcRenderer.on("landed:billing-callback", handler);
    return () => ipcRenderer.removeListener("landed:billing-callback", handler);
  },
};

contextBridge.exposeInMainWorld("landed", landedAPI);

declare global {
  interface Window {
    landed: LandedAPI;
  }
}
