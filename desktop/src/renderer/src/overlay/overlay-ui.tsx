import type { CSSProperties, ReactNode } from "react";
import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import landedMark from "../assets/landed-mark.png";
import { AI_DISCLAIMER_OVERLAY } from "../lib/ai-disclaimer";
import { copyToClipboard } from "../lib/clipboard";
import { parseCodingAnswer, type CodingSection } from "../lib/coding-answer";
import type { QuickAction } from "../services/ai";
import type { PillThemeStyles } from "../hooks/usePillBackdrop";

export type OverlayChatTurn = {
  id: string;
  question: string;
  answer: string;
  /** True when this turn used a screen capture. */
  viewedScreen?: boolean;
};

export { pickAutoAction } from "../services/transcript";
export type { PillThemeStyles } from "../hooks/usePillBackdrop";

export const QUICK_ACTIONS: {
  id: QuickAction;
  label: string;
  shortLabel: string;
  icon: "sparkle" | "wand" | "chat" | "recap";
}[] = [
  { id: "assist", label: "Assist", shortLabel: "Assist", icon: "sparkle" },
  { id: "say", label: "What should I say?", shortLabel: "Say", icon: "wand" },
  { id: "followup", label: "Follow-up", shortLabel: "Follow-up", icon: "chat" },
  { id: "recap", label: "Recap", shortLabel: "Recap", icon: "recap" },
];

export function ActionIcon({ type }: { type: (typeof QUICK_ACTIONS)[number]["icon"] }) {
  if (type === "sparkle") {
    return (
      <svg className="h-3.5 w-3.5 shrink-0" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2l1.5 5.5L19 9l-5.5 1.5L12 16l-1.5-5.5L5 9l5.5-1.5L12 2z" />
      </svg>
    );
  }
  if (type === "wand") {
    return (
      <svg className="h-3.5 w-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" d="M15 4l5 5M9.5 6.5L4 12l8 8 5.5-5.5M14 5l5 5" />
      </svg>
    );
  }
  if (type === "chat") {
    return (
      <svg className="h-3.5 w-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    );
  }
  return (
    <svg className="h-3.5 w-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  );
}

export function LandedMark({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <img
      src={landedMark}
      alt=""
      aria-hidden
      draggable={false}
      className={`${className} object-contain`}
    />
  );
}

function LiveTranscriptStrip({
  text,
  listening,
  hearingAudio,
  isStreaming = false,
  theme,
}: {
  text: string;
  listening: boolean;
  hearingAudio?: boolean;
  isStreaming?: boolean;
  theme: PillThemeStyles;
}) {
  const trimmed = text.trim();
  const hasLiveText = !!trimmed && trimmed !== "…";
  const display =
    trimmed ||
    (listening && (hearingAudio || isStreaming) ? "…" : "");

  if (!display) return null;

  const isPlaceholder = !hasLiveText;

  return (
    <div className="relative min-w-0 flex-1 overflow-hidden">
      <div
        className="pointer-events-none absolute inset-y-0 left-0 z-10 w-6"
        style={{ background: theme.edgeFade }}
      />
      <p
        className={`overlay-pill-copy min-w-0 truncate whitespace-nowrap text-[14px] font-medium leading-none ${
          isPlaceholder ? theme.transcriptMuted : theme.transcript
        }`}
        style={{
          maskImage: "linear-gradient(to right, transparent 0%, black 20px, black 100%)",
          WebkitMaskImage: "linear-gradient(to right, transparent 0%, black 20px, black 100%)",
        }}
      >
        {display}
        {isStreaming && hasLiveText ? (
          <span className="ml-0.5 inline-block h-[13px] w-[2px] animate-pulse bg-zinc-500/70" />
        ) : null}
      </p>
    </div>
  );
}

export function ListeningPill({
  listening,
  error,
  liveText,
  isStreaming = false,
  hearingAudio = false,
  hasMic = false,
  hasSystemAudio = false,
  aiReady = false,
  pillTheme,
}: {
  listening: boolean;
  error?: string | null;
  liveText?: string;
  isStreaming?: boolean;
  hearingAudio?: boolean;
  hasMic?: boolean;
  hasSystemAudio?: boolean;
  aiReady?: boolean;
  pillTheme: PillThemeStyles;
}) {
  const [micAppName, setMicAppName] = useState("Electron");

  useEffect(() => {
    void window.landed?.getMicAppName?.().then((name) => {
      if (name) setMicAppName(name);
    });
  }, []);

  const statusText = (() => {
    if (error === "mic-optional") return "Listening…";
    if (error === "screen-blocked") return "Call audio blocked";
    if (error === "no-api-key") return "AI key missing";
    if (error) return "Mic blocked";
    if (!listening) return "Paused";
    return "Listening…";
  })();

  const trimmedLiveText = liveText?.trim() ?? "";
  const hasLiveText = !!trimmedLiveText && trimmedLiveText !== "…";

  // Status-only pill stays compact; live transcript (when opted in) needs room.
  const showLiveTranscript =
    !!liveText && listening && (hasLiveText || hearingAudio || isStreaming);

  return (
    <div className="overlay-glass drag-region overflow-hidden rounded-full" style={pillTheme.glass}>
      <div
        className={`overlay-pill-inner flex items-center gap-2.5 px-4 py-2.5 ${
          showLiveTranscript ? "min-w-[340px] max-w-[520px]" : "w-max max-w-[280px]"
        }`}
      >
        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
            listening &&
            (hearingAudio || hasMic) &&
            (!error || error === "mic-optional")
              ? hearingAudio
                ? "animate-pulse-glow"
                : "animate-pulse"
              : ""
          }`}
          style={{
            background:
              error && error !== "mic-optional"
                ? "rgba(220,38,38,0.9)"
                : "rgba(0,0,0,0.86)",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.10), 0 2px 10px rgba(0,0,0,0.22)",
          }}
        >
          <LandedMark className="h-4 w-4" />
        </div>

        <div className="overlay-pill-text flex min-w-0 flex-1 items-center gap-2">
          <span
            className={`overlay-pill-copy shrink-0 text-[14px] font-semibold leading-none tracking-[-0.01em] ${pillTheme.status}`}
          >
            {statusText}
          </span>

          {showLiveTranscript ? (
            <>
              <span aria-hidden className="shrink-0 select-none text-[14px] leading-none text-zinc-300">
                ·
              </span>
              <LiveTranscriptStrip
                text={liveText?.trim() ?? ""}
                listening={listening && (!error || error === "mic-optional")}
                hearingAudio={hearingAudio}
                isStreaming={isStreaming}
                theme={pillTheme}
              />
            </>
          ) : null}
        </div>
      </div>

      {error === "mic-optional" && (
        <div className="no-drag flex flex-wrap gap-2 px-4 pb-2.5">
          <p className="text-[11px] leading-snug text-amber-700">
            Call audio active. Enable <span className="font-semibold">{micAppName}</span> mic for your voice too.
          </p>
          <button
            type="button"
            onClick={() => void window.landed?.showMicHelper?.()}
            className="shrink-0 rounded-full border border-amber-400 px-2.5 py-1 text-[10px] font-semibold text-amber-900 hover:bg-amber-50"
          >
            Enable mic
          </button>
        </div>
      )}

      {error && error !== "mic-optional" && (
        <div className="no-drag flex flex-col gap-2 px-4 pb-2.5">
          <p className="text-[11px] leading-snug text-red-600">
            {error === "screen-blocked" ? (
              <>
                Enable <span className="font-semibold">Landed</span> under System Settings → Privacy &amp;
                Security → Screen Recording (needed so Landed can see your screen), then restart your session.
              </>
            ) : error === "no-api-key" ? (
              <>Landed needs an OpenAI API key to transcribe speech. Add it in desktop/.env and restart.</>
            ) : (
              <>
                System Settings → Privacy &amp; Security → Microphone → turn on{" "}
                <span className="font-semibold">{micAppName}</span>, then click Fix mic.
              </>
            )}
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() =>
                void window.landed?.openPermissionSettings?.(
                  error === "screen-blocked" ? "screen" : "microphone",
                )
              }
              className="shrink-0 rounded-full bg-red-600 px-2.5 py-1 text-[10px] font-semibold text-white hover:bg-red-700"
            >
              Open Settings
            </button>
            <button
              type="button"
              onClick={() => {
                void (async () => {
                  await window.landed?.ensureMicrophone?.();
                  try {
                    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                    stream.getTracks().forEach((t) => t.stop());
                  } catch {
                    void window.landed?.showMicHelper?.();
                  }
                })();
              }}
              className="shrink-0 rounded-full border border-red-300 px-2.5 py-1 text-[10px] font-semibold text-red-700 hover:bg-red-50"
            >
              Fix mic
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Suggestion pill — sits directly below listening pill ───────────────────

export function getSuggestionReadDurationMs(
  text: string,
  opts?: { expiresAfterMs?: number },
): number {
  if (opts?.expiresAfterMs && opts.expiresAfterMs > 0) {
    return Math.min(20_000, Math.max(5_000, opts.expiresAfterMs));
  }
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  const minMs = 4500;
  const maxMs = 14000;
  const perWordMs = 380;
  return Math.min(maxMs, Math.max(minMs, 2800 + words * perWordMs));
}

export function SuggestionPill({
  suggestion,
  loading,
  fading = false,
  pillTheme,
  structured,
}: {
  suggestion: string;
  loading: boolean;
  /** Candidate started answering — soft fade before hide. */
  fading?: boolean;
  pillTheme: PillThemeStyles;
  structured?: {
    title?: string;
    summary: string;
    bullets?: string[];
    followUp?: string;
  } | null;
}) {
  const display = suggestion.trim();
  const main = (structured?.summary || display).trim();
  const bullets = structured?.bullets?.filter(Boolean) ?? [];
  const followUp = structured?.followUp?.trim() ?? "";
  const title = structured?.title?.trim() || "Answer";
  const hasStructured = Boolean(structured?.summary?.trim()) && !loading;

  if (!loading && !main) return null;

  return (
    <div
      className={`overlay-glass overlay-pill-text no-drag w-full overflow-hidden rounded-[20px] transition-opacity duration-700 ease-out ${
        fading ? "opacity-40" : "opacity-100"
      }`}
      style={pillTheme.glass}
    >
      <div className="overlay-pill-inner px-5 py-3.5">
        <p className={`overlay-pill-copy mb-1.5 text-[11px] font-medium uppercase tracking-[0.06em] ${pillTheme.label}`}>
          {hasStructured ? title : "Suggestion"}
        </p>

        {loading && !main ? (
          <div className="flex items-center gap-2 py-0.5">
            <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-zinc-400" />
            <span className={`overlay-pill-copy text-[15px] ${pillTheme.transcriptMuted}`}>Thinking…</span>
          </div>
        ) : hasStructured ? (
          <div className="space-y-2.5">
            <p className={`overlay-pill-copy text-[16px] font-semibold leading-snug tracking-[-0.01em] ${pillTheme.body}`}>
              {main}
            </p>

            {bullets.length > 0 ? (
              <div className="space-y-1">
                <p className={`overlay-pill-copy text-[10px] font-medium uppercase tracking-[0.05em] ${pillTheme.label}`}>
                  Remember
                </p>
                {bullets.map((bullet) => (
                  <p
                    key={bullet}
                    className={`overlay-pill-copy text-[13px] leading-snug ${pillTheme.body}`}
                  >
                    • {bullet}
                  </p>
                ))}
              </div>
            ) : null}

            {followUp ? (
              <div className="space-y-0.5">
                <p className={`overlay-pill-copy text-[10px] font-medium uppercase tracking-[0.05em] ${pillTheme.label}`}>
                  If they ask
                </p>
                <p className={`overlay-pill-copy text-[13px] leading-snug ${pillTheme.transcriptMuted}`}>
                  {followUp}
                </p>
              </div>
            ) : null}

            <p className={`overlay-pill-copy text-[10px] leading-snug ${pillTheme.transcriptMuted}`}>
              {AI_DISCLAIMER_OVERLAY}
            </p>
          </div>
        ) : (
          <>
            <p className={`overlay-pill-copy text-[16px] font-semibold leading-snug tracking-[-0.01em] ${pillTheme.body}`}>
              {main}
              {loading ? (
                <span className="ml-0.5 inline-block h-[16px] w-[2px] animate-pulse bg-zinc-500/70" />
              ) : null}
            </p>
            {!loading && main ? (
              <p className={`overlay-pill-copy mt-2 text-[10px] leading-snug ${pillTheme.transcriptMuted}`}>
                {AI_DISCLAIMER_OVERLAY}
              </p>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}

// ─── Overlay bars — top controls + content panel underneath ──────────────────

const COMMAND_BAR_GLASS: CSSProperties = {
  backdropFilter: "blur(28px) saturate(160%)",
  WebkitBackdropFilter: "blur(28px) saturate(160%)",
  background: "#767879",
  border: "1px solid rgba(255,255,255,0.12)",
  boxShadow:
    "0 12px 40px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.10)",
};

const REPLY_BOX_GLASS: CSSProperties = {
  backdropFilter: "blur(28px) saturate(160%)",
  WebkitBackdropFilter: "blur(28px) saturate(160%)",
  background: "#767879",
  border: "1px solid rgba(255,255,255,0.12)",
  boxShadow:
    "0 12px 40px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.10)",
};

const ASK_TEXT = "rgba(255,255,255,0.92)";
const ASK_MUTED = "rgba(255,255,255,0.48)";
const ASK_PLACEHOLDER = "rgba(255,255,255,0.42)";
const CODE_KEYWORD = "rgba(102, 217, 239, 0.95)";
const CODE_NAME = "rgba(230, 219, 116, 0.95)";
const CODE_COMMENT = "rgba(117, 185, 168, 0.88)";
const CODE_STRING = "rgba(230, 219, 116, 0.95)";
const CODE_GUTTER = "rgba(255,255,255,0.28)";
const BULLET_MARK = "rgba(102, 217, 239, 0.85)";
/** Clean Apple-style blue — only for the user-message pill. */
const USER_PILL_BLUE =
  "linear-gradient(180deg, #5B9DED 0%, #3B82F6 55%, #2F74E8 100%)";

function formatCodingHeading(raw: string): string {
  const key = raw.trim().toLowerCase();
  if (key === "problem") return "Problem Statement";
  if (key === "my thoughts") return "My Thoughts";
  if (key === "solution") return "Solution";
  if (key === "complexity") return "Complexity";
  return raw.trim();
}

/** Render `**bold**` and `Label: rest` cleanly — no raw markdown. */
function renderAnswerText(text: string): ReactNode {
  const labeled = text.match(/^([A-Za-z][\w\s/-]{0,24}):\s+([\s\S]+)$/);
  if (labeled) {
    return (
      <>
        <span className="font-semibold" style={{ color: ASK_TEXT }}>
          {labeled[1]}:
        </span>{" "}
        {renderInlineBold(labeled[2])}
      </>
    );
  }
  return renderInlineBold(text);
}

function renderInlineBold(text: string): ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
      return (
        <strong key={i} className="font-semibold" style={{ color: ASK_TEXT }}>
          {part.slice(2, -2)}
        </strong>
      );
    }
    return <Fragment key={i}>{part}</Fragment>;
  });
}

/** Plain (non-coding) replies: bold + simple bullets, no raw markdown. */
function PlainAnswerView({ text, loading }: { text: string; loading?: boolean }) {
  const lines = text.split("\n");
  const hasStructure = lines.some(
    (l) => /^[-*•]\s+/.test(l.trim()) || /^\*\*[^*]+\*\*/.test(l.trim()),
  );

  if (!hasStructure) {
    return (
      <p
        className="overlay-pill-copy whitespace-pre-wrap text-[14px] font-medium leading-relaxed tracking-[-0.01em]"
        style={{ color: ASK_TEXT, WebkitTextFillColor: ASK_TEXT }}
      >
        {renderInlineBold(text)}
        {loading ? (
          <span className="ml-0.5 inline-block h-[14px] w-[2px] animate-pulse bg-white/50" />
        ) : null}
      </p>
    );
  }

  return (
    <div
      className="overlay-pill-copy space-y-1.5 text-[14px] font-medium leading-[1.55] tracking-[-0.01em]"
      style={{ color: ASK_TEXT, WebkitTextFillColor: ASK_TEXT }}
    >
      {lines.map((line, i) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={i} className="h-1" />;
        if (/^[-*•]\s+/.test(trimmed)) {
          const item = trimmed.replace(/^[-*•]\s+/, "");
          return (
            <div key={i} className="flex gap-2.5" style={{ color: "rgba(255,255,255,0.88)" }}>
              <span className="shrink-0 font-semibold" style={{ color: BULLET_MARK }}>
                -
              </span>
              <span>{renderAnswerText(item)}</span>
            </div>
          );
        }
        return (
          <p key={i} style={{ color: "rgba(255,255,255,0.88)" }}>
            {renderAnswerText(trimmed)}
          </p>
        );
      })}
      {loading ? (
        <span className="inline-block h-[14px] w-[2px] animate-pulse bg-white/50" />
      ) : null}
    </div>
  );
}

function highlightCodeLine(line: string): ReactNode {
  if (/^\s*#/.test(line) || /^\s*\/\//.test(line)) {
    return <span style={{ color: CODE_COMMENT }}>{line}</span>;
  }

  const parts = line.split(
    /(\b(?:class|def|return|for|if|elif|else|while|import|from|in|not|and|or|True|False|None|const|let|var|function|public|private|static|void|new|this|self)\b|[A-Z][A-Za-z0-9_]*|\b[a-z_]\w*(?=\()|".*?"|'.*?'|`.*?`|#.*$|\/\/.*$)/g,
  );

  return parts.map((part, idx) => {
    if (!part) return null;
    if (
      /^(?:class|def|return|for|if|elif|else|while|import|from|in|not|and|or|True|False|None|const|let|var|function|public|private|static|void|new|this|self)$/.test(
        part,
      )
    ) {
      return (
        <span key={idx} style={{ color: CODE_KEYWORD }}>
          {part}
        </span>
      );
    }
    if (part.startsWith("#") || part.startsWith("//")) {
      return (
        <span key={idx} style={{ color: CODE_COMMENT }}>
          {part}
        </span>
      );
    }
    if (/^["'`]/.test(part)) {
      return (
        <span key={idx} style={{ color: CODE_STRING }}>
          {part}
        </span>
      );
    }
    // Types (Solution, List) and function/call names (merge)
    if (/^[A-Z][A-Za-z0-9_]*$/.test(part) || /^[a-z_]\w*$/.test(part)) {
      return (
        <span key={idx} style={{ color: CODE_NAME }}>
          {part}
        </span>
      );
    }
    return (
      <span key={idx} style={{ color: ASK_TEXT }}>
        {part}
      </span>
    );
  });
}

function CodingAnswerView({
  sections,
  loading,
}: {
  sections: CodingSection[];
  loading?: boolean;
}) {
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  return (
    <div
      className="overlay-pill-copy space-y-5 text-[14px] font-medium leading-[1.55] tracking-[-0.01em]"
      style={{ color: ASK_TEXT, WebkitTextFillColor: ASK_TEXT }}
    >
      {sections.map((section, idx) => {
        if (section.type === "heading") {
          return (
            <h3
              key={idx}
              className={`${idx === 0 ? "pt-0" : "pt-0.5"} text-[15px] font-bold tracking-[-0.015em]`}
              style={{ color: ASK_TEXT, WebkitTextFillColor: ASK_TEXT }}
            >
              {formatCodingHeading(section.text)}
            </h3>
          );
        }
        if (section.type === "paragraph") {
          return (
            <p
              key={idx}
              className="-mt-3"
              style={{ color: "rgba(255,255,255,0.88)" }}
            >
              {renderAnswerText(section.text)}
            </p>
          );
        }
        if (section.type === "bullets") {
          return (
            <ul key={idx} className="-mt-3 space-y-1.5 pl-0.5">
              {section.items.map((item, i) => (
                <li
                  key={i}
                  className="flex gap-2.5"
                  style={{ color: "rgba(255,255,255,0.88)" }}
                >
                  <span
                    className="shrink-0 font-semibold"
                    style={{ color: BULLET_MARK }}
                  >
                    -
                  </span>
                  <span>{renderAnswerText(item)}</span>
                </li>
              ))}
            </ul>
          );
        }
        const lines = section.code.split("\n");
        return (
          <div
            key={idx}
            className="group relative -mt-2 overflow-hidden rounded-[12px]"
            style={{ background: "rgba(12, 12, 16, 0.72)" }}
          >
            {!loading ? (
              <button
                type="button"
                data-no-drag
                onClick={() => {
                  void copyToClipboard(section.code).then((ok) => {
                    if (!ok) return;
                    setCopiedIdx(idx);
                    window.setTimeout(() => setCopiedIdx(null), 1600);
                  });
                }}
                className="absolute right-2 top-2 z-10 cursor-pointer rounded-md px-2 py-0.5 text-[11px] font-semibold opacity-0 transition-opacity group-hover:opacity-100"
                style={{
                  color: ASK_TEXT,
                  WebkitTextFillColor: ASK_TEXT,
                  background: "rgba(255,255,255,0.10)",
                }}
              >
                {copiedIdx === idx ? "Copied" : "Copy"}
              </button>
            ) : null}
            <pre className="m-0 overflow-x-auto px-3.5 py-3.5 font-mono text-[12.5px] leading-[1.65]">
              {lines.map((line, i) => (
                <div key={i} className="flex gap-3.5">
                  <span
                    className="w-5 shrink-0 select-none text-right"
                    style={{ color: CODE_GUTTER }}
                  >
                    {i + 1}
                  </span>
                  <code className="min-w-0 whitespace-pre">
                    {highlightCodeLine(line || " ")}
                  </code>
                </div>
              ))}
            </pre>
          </div>
        );
      })}
      {loading ? (
        <span className="inline-block h-[14px] w-[2px] animate-pulse bg-white/50" />
      ) : null}
    </div>
  );
}

function UserAskPill({ text }: { text: string }) {
  return (
    <div className="flex justify-end">
      <div
        className="max-w-[92%] rounded-full px-3.5 py-1.5 shadow-[0_4px_14px_rgba(47,116,232,0.28)]"
        style={{ background: USER_PILL_BLUE }}
      >
        <p
          className="overlay-pill-copy text-[13.5px] font-medium leading-snug tracking-[-0.01em]"
          style={{ color: "#FFFFFF", WebkitTextFillColor: "#FFFFFF" }}
        >
          {text}
        </p>
      </div>
    </div>
  );
}

function ChatTurnView({
  question,
  answer,
  loading = false,
}: {
  question: string;
  answer: string;
  loading?: boolean;
}) {
  const trimmedQuestion = question.trim();
  const trimmedAnswer = answer.trim();
  const codingSections = useMemo(
    () => (trimmedAnswer ? parseCodingAnswer(trimmedAnswer) : null),
    [trimmedAnswer],
  );

  return (
    <div className="space-y-2">
      {trimmedQuestion ? <UserAskPill text={trimmedQuestion} /> : null}

      {loading && !trimmedAnswer ? (
        <div className="flex items-center gap-2 py-0.5">
          <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-white/40" />
          <span
            className="overlay-pill-copy text-[14px]"
            style={{ color: ASK_MUTED, WebkitTextFillColor: ASK_MUTED }}
          >
            Thinking…
          </span>
        </div>
      ) : codingSections ? (
        <CodingAnswerView sections={codingSections} loading={loading} />
      ) : trimmedAnswer ? (
        <PlainAnswerView text={trimmedAnswer} loading={loading} />
      ) : null}
    </div>
  );
}

export function AskCommandBar({
  value,
  onChange,
  onSubmit,
  loading = false,
  chatTurns = [],
  pendingQuestion = "",
  pendingAnswer = "",
  onOpenSettings,
  interviewOpen = true,
}: {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (question?: string) => void;
  onToggleDashboard?: () => void;
  onEndSession?: () => void;
  onOpenSettings?: () => void;
  /** @deprecated */
  onToggleVisibility?: () => void;
  /** @deprecated */
  onScreenshot?: () => void;
  /** @deprecated */
  onStartOver?: () => void;
  interviewOpen?: boolean;
  /** @deprecated */
  onStartInterview?: () => void;
  /** @deprecated */
  modLabel?: string;
  loading?: boolean;
  screenActive?: boolean;
  /** Completed asks kept for this open session only. */
  chatTurns?: OverlayChatTurn[];
  /** Current in-flight ask. */
  pendingQuestion?: string;
  /** Streaming / latest reply for the pending ask. */
  pendingAnswer?: string;
  /** @deprecated */
  userMessage?: string;
  /** @deprecated */
  answer?: string;
  /** @deprecated */
  answerFading?: boolean;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const latestTurnRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const canSubmit = !!value.trim() && !loading;
  const hasPending = !!pendingQuestion.trim() || loading || !!pendingAnswer.trim();
  const showThread = chatTurns.length > 0 || hasPending;
  const hasCoding = useMemo(() => {
    if (pendingAnswer.trim() && parseCodingAnswer(pendingAnswer)) return true;
    return chatTurns.some((t) => !!parseCodingAnswer(t.answer));
  }, [chatTurns, pendingAnswer]);
  const boxWidth = hasCoding
    ? "w-[min(640px,calc(100vw-48px))]"
    : "w-[min(560px,calc(100vw-48px))]";

  // Pin to the top of the latest turn when a new ask starts — not the bottom while streaming.
  useEffect(() => {
    const root = scrollRef.current;
    const turn = latestTurnRef.current;
    if (!root || !turn) return;
    const align = () => {
      const delta =
        turn.getBoundingClientRect().top - root.getBoundingClientRect().top;
      root.scrollTop += delta;
    };
    align();
    // Layout can settle after the first paint (Thinking → first tokens).
    const id = window.requestAnimationFrame(align);
    return () => window.cancelAnimationFrame(id);
  }, [chatTurns.length, pendingQuestion]);

  useEffect(() => {
    if (!interviewOpen) return;
    const id = window.setTimeout(() => inputRef.current?.focus(), 40);
    return () => window.clearTimeout(id);
  }, [interviewOpen]);

  if (!interviewOpen) return null;

  return (
    <div className="no-drag flex w-max max-w-[calc(100vw-32px)] flex-col items-start gap-2">
      {/* Ask box — same width as reply, slightly thinner */}
      <div
        className={`overlay-glass relative z-20 ${boxWidth} overflow-visible rounded-[20px]`}
        style={{ ...COMMAND_BAR_GLASS, color: ASK_TEXT }}
      >
        <form
          className="flex items-center gap-2 px-4 py-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (canSubmit) onSubmit();
          }}
        >
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={
              showThread ? "Ask follow-up" : "Ask about the coding problem on screen"
            }
            disabled={loading}
            data-no-drag
            className="overlay-pill-copy min-w-0 flex-1 cursor-text bg-transparent px-0.5 text-[15px] font-medium leading-none tracking-[-0.01em] outline-none disabled:opacity-60"
            style={{
              color: ASK_TEXT,
              WebkitTextFillColor: ASK_TEXT,
              caretColor: ASK_TEXT,
            }}
            autoComplete="off"
            spellCheck={false}
          />
          <button
            type="submit"
            title="Ask"
            disabled={!canSubmit}
            data-no-drag
            className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-[10px] border transition-colors"
            style={{
              color: canSubmit ? ASK_TEXT : ASK_MUTED,
              borderColor: canSubmit
                ? "rgba(255,255,255,0.22)"
                : "rgba(255,255,255,0.10)",
              background: canSubmit
                ? "rgba(255,255,255,0.12)"
                : "rgba(255,255,255,0.04)",
            }}
          >
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.25}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7v4a2 2 0 01-2 2H7m0 0l3-3m-3 3l3 3" />
            </svg>
          </button>
          {onOpenSettings ? (
            <button
              type="button"
              title="Settings"
              data-no-drag
              onClick={onOpenSettings}
              className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-[10px] border transition-colors"
              style={{
                color: ASK_MUTED,
                borderColor: "rgba(255,255,255,0.10)",
                background: "rgba(255,255,255,0.04)",
              }}
            >
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          ) : null}
        </form>
      </div>

      {/* Answer reply box — same width as ask */}
      {showThread ? (
        <div
          className={`overlay-glass ${boxWidth} overflow-hidden rounded-[20px]`}
          style={{ ...REPLY_BOX_GLASS, color: ASK_TEXT }}
        >
          <div
            ref={scrollRef}
            data-no-drag
            className="overlay-pill-text relative max-h-[min(62vh,560px)] cursor-default overflow-y-auto px-5 py-4"
          >
            {chatTurns.map((turn, i) => {
              const isLatest = !hasPending && i === chatTurns.length - 1;
              return (
                <div
                  key={turn.id}
                  ref={isLatest ? latestTurnRef : undefined}
                  className={i > 0 ? "mt-5 border-t border-white/[0.08] pt-5" : undefined}
                >
                  <ChatTurnView
                    question={turn.question}
                    answer={turn.answer}
                  />
                </div>
              );
            })}
            {hasPending ? (
              <div
                ref={latestTurnRef}
                className={
                  chatTurns.length > 0
                    ? "mt-5 border-t border-white/[0.08] pt-5"
                    : undefined
                }
              >
                <ChatTurnView
                  question={pendingQuestion}
                  answer={pendingAnswer}
                  loading={loading}
                />
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      <style>{`
        .overlay-glass input::placeholder {
          color: ${ASK_PLACEHOLDER};
          -webkit-text-fill-color: ${ASK_PLACEHOLDER};
          opacity: 1;
        }
      `}</style>
    </div>
  );
}

/** @deprecated Prefer AskCommandBar — kept for any leftover imports */
export function ControlButtons({
  onToggleDashboard: _onToggleDashboard,
  onEndSession: _onEndSession,
}: {
  onToggleDashboard?: () => void;
  listening?: boolean;
  onToggleListening?: () => void;
  onEndSession?: () => void;
  pillTheme?: PillThemeStyles;
}) {
  return (
    <AskCommandBar
      value=""
      onChange={() => {}}
      onSubmit={() => {}}
    />
  );
}

export function KeyHint({ children }: { children: ReactNode }) {
  return (
    <span className="mx-0.5 inline-flex min-w-[18px] items-center justify-center rounded-[4px] bg-white/[0.10] px-1 py-px text-[10px] font-medium text-white/50">
      {children}
    </span>
  );
}
