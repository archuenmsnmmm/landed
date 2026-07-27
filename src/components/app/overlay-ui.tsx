"use client";

import Image from "next/image";
import type { CSSProperties, ReactNode } from "react";
import { useStreamingDisplayText } from "@/hooks/useStreamingDisplayText";
import type { PillThemeStyles } from "@/lib/pill-theme";

export function LandedMark({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <Image
      src="/landed-mark.png"
      alt=""
      width={20}
      height={20}
      aria-hidden
      draggable={false}
      className={`${className} object-contain`}
    />
  );
}

export function ListeningPill({
  statusText,
  theme,
}: {
  statusText: string;
  theme: PillThemeStyles;
}) {
  return (
    <div className="overflow-hidden rounded-full" style={theme.glass}>
      <div className="flex min-w-[340px] max-w-[520px] items-center gap-3 px-3.5 py-2.5">
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
          style={{
            background: "rgba(0,0,0,0.86)",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.10), 0 2px 10px rgba(0,0,0,0.22)",
          }}
        >
          <LandedMark className="h-4 w-4" />
        </div>
        <span className={`shrink-0 text-[15px] font-semibold tracking-tight ${theme.status}`}>
          {statusText}
        </span>
      </div>
    </div>
  );
}

/** How long a suggestion stays visible — linger long enough to read and say the line. */
export function getSuggestionReadDurationMs(
  text: string,
  opts?: { isQuestion?: boolean },
): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  const isQuestion = !!opts?.isQuestion;
  const minMs = isQuestion ? 14_000 : 9_000;
  const maxMs = isQuestion ? 48_000 : 30_000;
  const perWordMs = isQuestion ? 550 : 450;
  const baseMs = isQuestion ? 7_000 : 4_500;
  return Math.min(maxMs, Math.max(minMs, baseMs + words * perWordMs));
}

export function SuggestionPill({
  suggestion,
  loading,
  visible = true,
  dealHealth,
  theme,
}: {
  suggestion: string;
  loading: boolean;
  visible?: boolean;
  dealHealth?: number | null;
  theme: PillThemeStyles;
}) {
  const streamed = useStreamingDisplayText(suggestion, loading && !!suggestion);
  const healthColor =
    dealHealth == null
      ? theme.label
      : dealHealth >= 70
        ? "text-emerald-700"
        : dealHealth >= 45
          ? "text-amber-700"
          : "text-red-700";

  return (
    <div
      className={`w-[340px] max-w-[520px] overflow-hidden rounded-2xl transition-all duration-300 ${
        visible ? "translate-y-0 opacity-100" : "pointer-events-none -translate-y-1 opacity-0"
      }`}
      style={theme.glass}
    >
      <div className="px-4 py-3">
        <div className="mb-1.5 flex items-center justify-between gap-2">
          <p className={`text-[11px] font-medium uppercase tracking-wider ${theme.label}`}>
            Say this
          </p>
          {dealHealth != null && !loading ? (
            <p className={`text-[11px] font-semibold ${healthColor}`}>Readiness {dealHealth}</p>
          ) : null}
        </div>
        {loading && !suggestion ? (
          <div className="flex items-center gap-2">
            <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-zinc-500" />
            <span className={`text-[14px] ${theme.body}`}>Thinking…</span>
          </div>
        ) : (
          <p className={`whitespace-pre-wrap text-[15px] font-medium leading-relaxed ${theme.body}`}>
            {streamed || suggestion}
            {loading && suggestion ? (
              <span className="ml-0.5 inline-block h-4 w-[2px] animate-pulse bg-zinc-700" />
            ) : null}
          </p>
        )}
        {dealHealth != null && !loading ? (
          <div className="mt-3">
            <div className="h-1 rounded-full bg-black/10">
              <div
                className="h-full rounded-full bg-landed-500 transition-all duration-500"
                style={{ width: `${dealHealth}%` }}
              />
            </div>
          </div>
        ) : null}
        {!loading && suggestion ? (
          <p className={`mt-2 text-[10px] leading-snug ${theme.label}`}>
            This is an AI-powered conversation, not human. It may make mistakes.{" "}
            <a
              href="/legal/terms#ai-disclaimer"
              className="font-medium text-[#4A90E2] underline decoration-[#4A90E2]/40 underline-offset-2 hover:decoration-[#4A90E2]"
            >
              Learn More
            </a>
          </p>
        ) : null}
      </div>
    </div>
  );
}

function SideIconButton({
  title,
  onClick,
  children,
  bg,
  border,
}: {
  title: string;
  onClick?: () => void;
  children: ReactNode;
  bg?: string;
  border?: string;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className="flex shrink-0 items-center justify-center rounded-full transition-all hover:bg-white/70 active:scale-95"
      style={{
        height: 44,
        width: 44,
        background: bg ?? "rgba(255,255,255,0.55)",
        border: border ?? "1.5px solid rgba(0,0,0,0.10)",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.85)",
      }}
    >
      {children}
    </button>
  );
}

export function ControlButtons({
  onAssist,
  onFollowUp,
  onEndSession,
  followUpLoading,
  theme,
}: {
  onAssist: () => void;
  onFollowUp: () => void;
  onEndSession: () => void;
  followUpLoading?: boolean;
  theme: PillThemeStyles;
}) {
  const iconClass = "text-zinc-800";
  const sideBg = "rgba(255,255,255,0.55)";
  const sideBorder = "1.5px solid rgba(0,0,0,0.10)";

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="rounded-full" style={{ minWidth: 320, ...(theme.glass as CSSProperties) }}>
        <div className="flex items-center justify-center gap-4 px-5 py-2">
          <SideIconButton title="End session" onClick={onEndSession} bg={sideBg} border={sideBorder}>
            <svg className={`h-[18px] w-[18px] ${iconClass}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </SideIconButton>

          <div className="shrink-0 rounded-full p-[3px]" style={{ border: "1.5px solid rgba(255,255,255,0.55)" }}>
            <button
              type="button"
              onClick={onAssist}
              title="Get AI suggestion"
              className="flex items-center justify-center rounded-full transition-all hover:scale-[1.03] active:scale-95"
              style={{
                height: 48,
                width: 48,
                background: "rgba(0,0,0,0.86)",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.10), 0 2px 14px rgba(0,0,0,0.30)",
              }}
            >
              <LandedMark className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
      <button
        type="button"
        onClick={onFollowUp}
        disabled={followUpLoading}
        className="rounded-full border border-white/40 bg-white/20 px-4 py-1.5 text-[12px] font-medium text-white backdrop-blur-sm transition hover:bg-white/30 disabled:opacity-50"
      >
        {followUpLoading ? "Loading questions…" : "Follow-up questions"}
      </button>
    </div>
  );
}

export function FollowUpPanel({
  questions,
  visible,
  theme,
  onClose,
}: {
  questions: string[];
  visible: boolean;
  theme: PillThemeStyles;
  onClose: () => void;
}) {
  if (!visible || questions.length === 0) return null;

  return (
    <div className="w-[340px] max-w-[520px] overflow-hidden rounded-2xl" style={theme.glass}>
      <div className="flex items-center justify-between px-4 py-2.5">
        <p className={`text-[11px] font-medium uppercase tracking-wider ${theme.label}`}>
          Ask next
        </p>
        <button type="button" onClick={onClose} className={`text-[11px] ${theme.transcriptMuted}`}>
          Close
        </button>
      </div>
      <ul className="space-y-2 px-4 pb-3">
        {questions.map((q) => (
          <li key={q} className={`rounded-lg bg-black/5 px-3 py-2 text-[13px] leading-snug ${theme.body}`}>
            {q}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function MeetingBackground() {
  return (
    <div className="absolute inset-0 bg-[#1a1a1f]">
      <div className="absolute inset-0 opacity-40">
        <div className="grid h-full grid-cols-2 gap-3 p-6 pt-20">
          {[60, 60, 40, 40].map((h, i) => (
            <div
              key={i}
              className="rounded-xl bg-zinc-700/50"
              style={{ height: `${h}%`, alignSelf: i < 2 ? "start" : "end" }}
            />
          ))}
        </div>
      </div>
      <div className="absolute bottom-6 left-6 flex items-center gap-2 rounded-lg bg-black/40 px-3 py-1.5 text-[11px] text-white/50">
        <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
        Demo session · Landed overlay
      </div>
    </div>
  );
}
