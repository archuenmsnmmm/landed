import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { APP_VERSION } from "../../lib/version";
import { LANDED_MARKETING_ORIGIN } from "../../lib/landed-urls";
import { legalLinks, openLegalLink } from "../../lib/legal-urls";
import { signOutLanded } from "../../lib/sign-out-landed";
import { applyContentProtection } from "../../services/content-protection";
import { useAppStore } from "../../store/useAppStore";
import {
  canUseDetectabilityToggle,
  normalizedInvisibleSetting,
} from "../../store/types";
import { AccountPanel } from "../settings/AccountPanel";
import { BillingPanel } from "../settings/BillingPanel";
import { UpgradeModal } from "../pricing/UpgradeModal";
import { Switch } from "../ui";

const SUPPORT_EMAIL = "landed.support@gmail.com";
const HELP_CENTER_URL = `${LANDED_MARKETING_ORIGIN}/help-center`;

export type SettingsSection =
  | "account"
  | "general"
  | "language"
  | "billing"
  | "about";

const TABS: { id: SettingsSection; label: string; icon: string }[] = [
  { id: "account", label: "Account", icon: "account" },
  { id: "general", label: "General", icon: "settings" },
  { id: "language", label: "Language", icon: "language" },
  { id: "billing", label: "Billing", icon: "billing" },
  { id: "about", label: "About", icon: "about" },
];

const LANGUAGES = [
  "English",
  "Spanish",
  "French",
  "German",
  "Portuguese",
  "Chinese",
  "Japanese",
];

/** Light settings surfaces */
const SHELL_BG = "#fafafa";
const PANEL_BG = "#ffffff";
const PANEL_BORDER = "rgba(0,0,0,0.08)";

function NavIcon({ name, className = "h-5 w-5" }: { name: string; className?: string }) {
  switch (name) {
    case "account":
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
        </svg>
      );
    case "settings":
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      );
    case "language":
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
        </svg>
      );
    case "billing":
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
      );
    case "about":
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    default:
      return null;
  }
}

function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-5">
      <h2 className="text-[17px] font-semibold tracking-[-0.01em] text-zinc-900">{title}</h2>
      {subtitle ? (
        <p className="mt-1 text-[13px] leading-relaxed text-zinc-500">{subtitle}</p>
      ) : null}
    </div>
  );
}

function SettingsRow({
  icon,
  title,
  description,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  action: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-4 py-4">
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-zinc-600"
        style={{ background: PANEL_BG, border: `1px solid ${PANEL_BORDER}` }}
      >
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-medium text-zinc-900">{title}</p>
        <p className="mt-0.5 text-[12px] leading-relaxed text-zinc-500">{description}</p>
      </div>
      <div className="shrink-0">{action}</div>
    </div>
  );
}

function GeneralPanel({ onRequestUpgrade }: { onRequestUpgrade: () => void }) {
  const { settings, updateSettings, plan } = useAppStore();
  const detectabilityUnlocked = canUseDetectabilityToggle(plan);
  const invisible = normalizedInvisibleSetting(plan, settings.invisible);

  const handleInvisible = (value: boolean) => {
    if (value && !detectabilityUnlocked) {
      onRequestUpgrade();
      return;
    }
    updateSettings({ invisible: value });
    void applyContentProtection(plan, value);
  };

  return (
    <div className="space-y-8">
      <section>
        <SectionHeader
          title="Updates"
          subtitle="Check for the latest Landed desktop release"
        />
        <SettingsRow
          icon={
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          }
          title="Landed Version"
          description={`You are currently using Landed version ${APP_VERSION}`}
          action={
            <span
              className="rounded-lg px-3.5 py-1.5 text-[12px] font-medium text-zinc-600"
              style={{ background: PANEL_BG, border: `1px solid ${PANEL_BORDER}` }}
            >
              v{APP_VERSION}
            </span>
          }
        />
      </section>

      <section>
        <SectionHeader
          title="General"
          subtitle="Customize how Landed works for you"
        />
        <div className="divide-y divide-zinc-200/80">
          <SettingsRow
            icon={
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            }
            title="Hide overlay from screen share"
            description={
              detectabilityUnlocked
                ? invisible
                  ? "The overlay is hidden from Zoom, Meet, Teams, and recordings"
                  : "The overlay is visible to screen-sharing software"
                : "Not available on your plan"
            }
            action={
              <Switch
                checked={invisible}
                checkedClassName="bg-blue-500"
                uncheckedClassName="bg-zinc-300"
                onClick={() => handleInvisible(!invisible)}
              />
            }
          />

          <SettingsRow
            icon={
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5.636 5.636a9 9 0 1012.728 0M12 3v9" />
              </svg>
            }
            title="Launch Landed at login"
            description="Landed will open automatically when you log in"
            action={
              <Switch
                checked={!!settings.autoLaunch}
                checkedClassName="bg-blue-500"
                uncheckedClassName="bg-zinc-300"
                onClick={() => updateSettings({ autoLaunch: !settings.autoLaunch })}
              />
            }
          />
        </div>
      </section>
    </div>
  );
}

function OutlineActionButton({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-medium text-zinc-800 transition-colors hover:bg-zinc-100"
      style={{ border: `1px solid ${PANEL_BORDER}` }}
    >
      {label}
      <svg className="h-3 w-3 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7 17L17 7M7 7h10v10" />
      </svg>
    </button>
  );
}

function LanguagePanel() {
  const { settings, updateSettings } = useAppStore();

  return (
    <div>
      <SectionHeader
        title="Language"
        subtitle="Language for answers, code solutions, and live transcription"
      />
      <div className="space-y-3">
        <label
          className="flex items-center justify-between gap-4 rounded-2xl px-4 py-3.5"
          style={{ background: PANEL_BG, border: `1px solid ${PANEL_BORDER}` }}
        >
          <span className="text-[13px] text-zinc-800">Answer language</span>
          <select
            value={settings.outputLanguage}
            onChange={(e) => updateSettings({ outputLanguage: e.target.value })}
            className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-[12px] text-zinc-900 outline-none focus:border-zinc-400"
          >
            {LANGUAGES.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
        </label>
        <label
          className="flex items-center justify-between gap-4 rounded-2xl px-4 py-3.5"
          style={{ background: PANEL_BG, border: `1px solid ${PANEL_BORDER}` }}
        >
          <span className="text-[13px] text-zinc-800">Interview audio language</span>
          <select
            value={settings.meetingLanguage}
            onChange={(e) => updateSettings({ meetingLanguage: e.target.value })}
            className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-[12px] text-zinc-900 outline-none focus:border-zinc-400"
          >
            {LANGUAGES.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
        </label>
        <label
          className="flex items-center justify-between gap-4 rounded-2xl px-4 py-3.5"
          style={{ background: PANEL_BG, border: `1px solid ${PANEL_BORDER}` }}
        >
          <span className="text-[13px] text-zinc-800">Code language</span>
          <select
            value={settings.codeLanguage || "Auto"}
            onChange={(e) => updateSettings({ codeLanguage: e.target.value })}
            className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-[12px] text-zinc-900 outline-none focus:border-zinc-400"
          >
            {[
              "Auto",
              "Python",
              "JavaScript",
              "TypeScript",
              "Java",
              "C++",
              "C#",
              "Go",
              "Rust",
              "Swift",
              "Kotlin",
            ].map((l) => (
              <option key={l} value={l}>
                {l === "Auto" ? "Auto (match screen)" : l}
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  );
}

function AboutPanel() {
  return (
    <div>
      <SectionHeader
        title="About"
        subtitle="Release notes, support, and app information."
      />
      <div className="divide-y divide-zinc-200/80">
        <SettingsRow
          icon={
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
            </svg>
          }
          title="Help Center"
          description="Guides, FAQs, and troubleshooting for Landed"
          action={
            <OutlineActionButton
              label="Open"
              onClick={() => void window.landed?.openExternal?.(HELP_CENTER_URL)}
            />
          }
        />
        <SettingsRow
          icon={
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
            </svg>
          }
          title="Contact Support"
          description="Email us and we'll get back within 24 hours"
          action={
            <OutlineActionButton
              label="Email"
              onClick={() =>
                void window.landed?.openExternal?.(
                  `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent("Landed support")}`,
                )
              }
            />
          }
        />
        <SettingsRow
          icon={
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          }
          title="Landed Version"
          description="You are currently using this Landed desktop build"
          action={
            <span className="text-[13px] font-medium text-zinc-500">{APP_VERSION}</span>
          }
        />
        {(
          [
            ["Privacy Policy", "How we handle your data", legalLinks.privacy],
            ["Terms of Service", "Rules for using Landed", legalLinks.terms],
            ["Acceptable Use", "What is and isn’t allowed", legalLinks.acceptableUse],
          ] as const
        ).map(([title, description, href]) => (
          <SettingsRow
            key={title}
            icon={
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
            }
            title={title}
            description={description}
            action={
              <OutlineActionButton label="Open" onClick={() => openLegalLink(href)} />
            }
          />
        ))}
      </div>
    </div>
  );
}

function resolveSection(section?: string): SettingsSection {
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

export function SettingsModal({
  onClose,
  initialSection = "general",
  /** Fill the host window (no floating modal chrome). */
  embedded = false,
}: {
  onClose: () => void;
  initialSection?: SettingsSection | string;
  embedded?: boolean;
}) {
  const navigate = useNavigate();
  const userEmail = useAppStore((s) => s.user?.email);
  const [section, setSection] = useState<SettingsSection>(
    resolveSection(initialSection),
  );
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  useEffect(() => {
    setSection(resolveSection(initialSection));
  }, [initialSection]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const handleSignOut = () => {
    onClose();
    void signOutLanded({
      navigate: (path) => navigate(path, { replace: true }),
    });
  };

  const handleQuit = () => {
    const quit = window.landed?.quit;
    if (typeof quit === "function") {
      void quit();
      return;
    }
    window.close();
  };

  const shell = (
    <div
      className={`no-drag flex flex-col overflow-hidden ${
        embedded
          ? "h-full w-full"
          : "relative z-10 h-[min(640px,calc(100vh-48px))] w-full max-w-[820px] rounded-2xl border border-zinc-200 shadow-xl shadow-zinc-900/10"
      } ${section === "billing" && !embedded ? "max-w-[min(1080px,calc(100vw-48px))] h-[min(720px,calc(100vh-48px))]" : ""}`}
      style={{ background: SHELL_BG }}
    >
      <header className="shrink-0 border-b border-zinc-200/90 bg-white px-4 pb-3 pt-3.5">
        <div className="relative mb-3 flex min-h-5 items-center justify-center">
          <button
            type="button"
            onClick={onClose}
            className="absolute left-0 top-0 flex h-7 w-7 items-center justify-center rounded-lg text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
            aria-label="Close settings"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <div className="flex flex-col items-center px-10">
            <p className="text-[13px] font-medium text-zinc-900">Landed Settings</p>
            {userEmail ? (
              <p className="mt-0.5 max-w-[320px] truncate text-[11px] text-zinc-500">
                Logged in as {userEmail}
              </p>
            ) : null}
          </div>
        </div>

        <nav className="flex items-stretch justify-center gap-1 px-1">
          {TABS.map((tab) => {
            const active = section === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSection(tab.id)}
                className={`flex min-w-[72px] flex-1 flex-col items-center gap-1.5 rounded-xl px-2.5 py-2.5 transition-colors ${
                  active
                    ? "bg-zinc-100 text-zinc-900"
                    : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-800"
                }`}
              >
                <NavIcon name={tab.icon} />
                <span className="text-[11px] font-medium">{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-7 py-6">
        {section === "account" ? (
          <AccountPanel onOpenBilling={() => setSection("billing")} />
        ) : null}
        {section === "general" ? (
          <GeneralPanel onRequestUpgrade={() => setUpgradeOpen(true)} />
        ) : null}
        {section === "language" ? <LanguagePanel /> : null}
        {section === "billing" ? <BillingPanel /> : null}
        {section === "about" ? <AboutPanel /> : null}
      </div>

      <footer className="flex shrink-0 items-center justify-between gap-3 border-t border-zinc-200/90 bg-white px-5 py-3">
        <button
          type="button"
          onClick={handleSignOut}
          className="rounded-lg px-3 py-1.5 text-[12px] font-medium text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
        >
          Sign out
        </button>
        <button
          type="button"
          onClick={handleQuit}
          className="rounded-lg px-3 py-1.5 text-[12px] font-medium text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
        >
          Quit Landed
        </button>
      </footer>

      {upgradeOpen ? (
        <UpgradeModal onClose={() => setUpgradeOpen(false)} />
      ) : null}
    </div>
  );

  if (embedded) {
    return shell;
  }

  return createPortal(
    <div className="no-drag pointer-events-auto fixed inset-0 z-[100] flex items-center justify-center p-6">
      <div
        className="absolute inset-0 bg-zinc-900/25 backdrop-blur-[2px]"
        onClick={onClose}
      />
      {shell}
    </div>,
    document.body,
  );
}
