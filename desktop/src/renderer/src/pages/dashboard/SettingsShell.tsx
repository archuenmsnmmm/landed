import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ScreenPermissionBanner } from "../../components/ScreenPermissionBanner";
import { MeetingSummaryWorker } from "../../components/MeetingSummaryWorker";
import {
  SettingsModal,
  type SettingsSection,
} from "../../components/dashboard/SettingsModal";
import { useBillingSync } from "../../hooks/useBillingSync";
import { useContentProtectionSync } from "../../hooks/useContentProtectionSync";
import { useStartLandedSession } from "../../hooks/useStartLandedSession";
import {
  rehydrateAppStoreFromStorage,
  syncPlanLimitsToMain,
  useAppStore,
} from "../../store/useAppStore";

function resolveSettingsSection(section?: string | null): SettingsSection {
  if (
    section === "account" ||
    section === "general" ||
    section === "language" ||
    section === "billing" ||
    section === "about"
  ) {
    return section;
  }
  return "general";
}

/**
 * Post-auth host window: settings only.
 * The product UI is the overlay; this window stays hidden unless settings are open.
 */
export function SettingsShell() {
  const navigate = useNavigate();
  const { setSessionActive } = useAppStore();
  const pendingSettingsSection = useAppStore((s) => s.pendingSettingsSection);
  const clearPendingSettingsOpen = useAppStore((s) => s.clearPendingSettingsOpen);
  const { startSession, canStart, sessionActive } = useStartLandedSession();
  const autoStartedRef = useRef(false);
  const settingsOpenRef = useRef(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsSection, setSettingsSection] =
    useState<SettingsSection>("general");

  useContentProtectionSync();
  useBillingSync();

  const openSettings = (section?: string | null) => {
    const next = resolveSettingsSection(section);
    // Already open: only switch tab — never remount (that caused stutter / blank flashes).
    if (settingsOpenRef.current) {
      setSettingsSection(next);
      void window.landed?.setDashboardLayout?.("dashboard");
      return;
    }
    settingsOpenRef.current = true;
    setSettingsSection(next);
    setSettingsOpen(true);
    void window.landed?.setDashboardLayout?.("dashboard");
  };

  const closeSettings = () => {
    settingsOpenRef.current = false;
    setSettingsOpen(false);
    void window.landed?.hideDashboard?.();
  };

  useEffect(() => {
    let cancelled = false;

    // Listen first so gear-click IPC during mount is never dropped.
    const unsub = window.landed?.onOpenSettings?.((next) => {
      if (!cancelled) openSettings(next);
    });

    void (async () => {
      void window.landed?.setDashboardLayout?.("dashboard");

      // Prefer pending section from main before any hide — avoids show→hide races.
      const pending = await window.landed?.consumePendingSettings?.();
      if (cancelled) return;
      if (pending) {
        openSettings(pending);
      } else if (!settingsOpenRef.current) {
        // Returning-user launch: never flash this host — overlay starts in background.
        void window.landed?.hideDashboard?.();
      }

      void rehydrateAppStoreFromStorage().then(() => {
        syncPlanLimitsToMain();
      });
      void window.landed?.getSettings?.().then((settings) => {
        if (settings.useCallAudio) {
          useAppStore.getState().setAudioCaptureMode("auto");
        }
      });
    })();

    return () => {
      cancelled = true;
      unsub?.();
    };
  }, []);

  // Overlay-first: start session with host kept hidden.
  useEffect(() => {
    if (autoStartedRef.current || sessionActive || !canStart) {
      if (sessionActive && !settingsOpenRef.current) {
        void window.landed?.hideDashboard?.();
      }
      return;
    }
    autoStartedRef.current = true;
    void startSession({ quiet: true })
      .catch((err) => {
        console.warn("[landed] Background session start failed:", err);
      })
      .finally(() => {
        if (!settingsOpenRef.current) {
          void window.landed?.hideDashboard?.();
        }
      });
  }, [canStart, sessionActive, startSession]);

  useEffect(() => {
    if (!pendingSettingsSection) return;
    openSettings(pendingSettingsSection);
    clearPendingSettingsOpen();
  }, [pendingSettingsSection, clearPendingSettingsOpen]);

  useEffect(() => {
    return window.landed?.onNavigate?.((path) => {
      void rehydrateAppStoreFromStorage().then(() => {
        const next = path.startsWith("/") ? path : `/${path}`;
        if (next.startsWith("/settings") || next.includes("billing")) {
          openSettings(next.includes("billing") ? "billing" : "general");
          return;
        }
        if (next === "/" || next.startsWith("/assistant")) {
          if (!settingsOpenRef.current) {
            void window.landed?.hideDashboard?.();
          }
          return;
        }
        navigate(next);
      });
    });
  }, [navigate]);

  useEffect(() => {
    return window.landed?.onStoreChanged?.(() => {
      void rehydrateAppStoreFromStorage();
    });
  }, []);

  useEffect(() => {
    return window.landed?.onSessionStarted?.(() => {
      setSessionActive(true);
      if (!settingsOpenRef.current) {
        void window.landed?.hideDashboard?.();
      }
    });
  }, [setSessionActive]);

  useEffect(() => {
    return window.landed?.onSessionStopped?.(() => {
      void rehydrateAppStoreFromStorage().then(() => {
        setSessionActive(false);
      });
    });
  }, [setSessionActive]);

  useEffect(() => {
    void window.landed?.getSettings?.().then((s) => {
      if (!s.sessionActive) setSessionActive(false);
    });
  }, [setSessionActive]);

  return (
    <div
      className="flex h-screen flex-col"
      style={{ background: settingsOpen ? "#fafafa" : "transparent" }}
    >
      <MeetingSummaryWorker />
      {settingsOpen ? (
        <>
          <ScreenPermissionBanner />
          <div className="min-h-0 flex-1">
            <SettingsModal
              embedded
              initialSection={settingsSection}
              onClose={closeSettings}
            />
          </div>
        </>
      ) : null}
    </div>
  );
}
