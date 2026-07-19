import { OVERLAY_KEYBINDS, shortcutModLabel } from "../../lib/keybinds";
import { APP_VERSION } from "../../lib/version";
import { useEffect, useState } from "react";
import { PageHeader, SelectRow, Toggle } from "../../components/ui";
import { useContentProtectionSync } from "../../hooks/useContentProtectionSync";
import { useAppStore } from "../../store/useAppStore";
import {
  canUseDetectabilityToggle,
  normalizedInvisibleSetting,
} from "../../store/types";

const LANGUAGES = [
  "English",
  "Spanish",
  "French",
  "German",
  "Portuguese",
  "Chinese",
  "Japanese",
];

export function SettingsPage() {
  const { settings, updateSettings, plan } = useAppStore();
  const detectabilityUnlocked = canUseDetectabilityToggle(plan);
  const invisible = normalizedInvisibleSetting(plan, settings.invisible);
  const [displays, setDisplays] = useState<
    Array<{ id: number; label: string }>
  >([]);

  useEffect(() => {
    window.landed?.getDisplays().then(setDisplays);
  }, []);

  useContentProtectionSync();

  useEffect(() => {
    if (settings.displayId != null) {
      window.landed?.moveToDisplay(settings.displayId);
    }
  }, [settings.displayId]);

  return (
    <div className="max-w-xl">
      <PageHeader
        title="Settings"
        description="Configure Landed for technical interviews — shortcuts, languages, and overlay display."
      />

      <section className="space-y-3">
        <h2 className="text-[12px] font-semibold uppercase tracking-wider text-zinc-400">
          Overlay display
        </h2>
        <Toggle
          label="Hide overlay from screen share"
          checked={invisible}
          disabled={!detectabilityUnlocked}
          onChange={(v) => {
            if (!detectabilityUnlocked) return;
            updateSettings({ invisible: v });
          }}
        />
        {!detectabilityUnlocked && (
          <p className="text-[12px] text-zinc-500">
            The overlay is visible on screen share on your current plan.
          </p>
        )}
        <Toggle
          label="Hide from taskbar during sessions"
          checked={settings.hideFromTaskbar}
          onChange={(v) => updateSettings({ hideFromTaskbar: v })}
        />
        <Toggle
          label="Capture screen when you ask"
          checked={settings.screenshotCapture}
          onChange={(v) => updateSettings({ screenshotCapture: v })}
        />
        <p className="text-[12px] text-zinc-500">
          When on, Landed reads what’s on your display each time you send a question.
        </p>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="text-[12px] font-semibold uppercase tracking-wider text-zinc-400">
          Language
        </h2>
        <SelectRow
          label="Answer language"
          value={settings.outputLanguage}
          options={LANGUAGES}
          onChange={(v) => updateSettings({ outputLanguage: v })}
        />
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="text-[12px] font-semibold uppercase tracking-wider text-zinc-400">
          Display
        </h2>
        {displays.length > 0 && (
          <label className="flex items-center justify-between gap-4 rounded-xl border border-zinc-200 bg-white px-4 py-3">
            <span className="text-[14px] text-zinc-800">Monitor</span>
            <select
              value={settings.displayId ?? displays[0]?.id ?? ""}
              onChange={(e) =>
                updateSettings({ displayId: Number(e.target.value) })
              }
              className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-[13px]"
            >
              {displays.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.label}
                </option>
              ))}
            </select>
          </label>
        )}
        <Toggle
          label="Disable auto launch on login"
          checked={!settings.autoLaunch}
          onChange={(v) => updateSettings({ autoLaunch: !v })}
        />
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="text-[12px] font-semibold uppercase tracking-wider text-zinc-400">
          Keyboard shortcuts
        </h2>
        <div className="rounded-xl border border-zinc-200 bg-white divide-y divide-zinc-100">
          {OVERLAY_KEYBINDS.map((bind) => (
            <div
              key={bind.description}
              className="flex items-center justify-between px-4 py-3"
            >
              <span className="text-[13px] text-zinc-700">{bind.description}</span>
              <kbd className="rounded bg-zinc-100 px-2 py-1 text-[11px] font-medium text-zinc-600">
                {bind.keys(shortcutModLabel())}
              </kbd>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="text-[12px] font-semibold uppercase tracking-wider text-zinc-400">
          App
        </h2>
        <div className="rounded-xl border border-zinc-200 bg-white px-4 py-3 text-[13px] text-zinc-600">
          Landed v{APP_VERSION}
        </div>
        <button
          type="button"
          onClick={() => {
            if (typeof window.landed?.quit === "function") {
              void window.landed.quit();
              return;
            }
            window.close();
          }}
          className="w-full rounded-xl border border-zinc-200 py-3 text-[13px] font-medium text-zinc-700 hover:bg-zinc-50"
        >
          Quit Landed
        </button>
      </section>
    </div>
  );
}
