"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { getDownloadInfo } from "@/lib/download";
import { useDownloadPlatform } from "@/hooks/useDownloadPlatform";
import { useCallback, useEffect, useRef, useState } from "react";
import { LandedLogo } from "@/components/LandedLogo";
import { RecapScreen } from "@/components/app/RecapScreen";
import {
  ControlButtons,
  FollowUpPanel,
  getSuggestionReadDurationMs,
  ListeningPill,
  MeetingBackground,
  SuggestionPill,
  TabSharePrompt,
} from "@/components/app/overlay-ui";
import { useLandedAI } from "@/hooks/useLandedAI";
import { useLandedSession, type SessionMode } from "@/hooks/useLandedSession";
import { lightPillTheme } from "@/lib/pill-theme";
import { isDirectQuestion } from "@/lib/text-utils";
import type { TranscriptLine } from "@/types/landed";

type AppPhase = "welcome" | "active" | "recap";

function lastProspectLine(lines: TranscriptLine[]): TranscriptLine | null {
  for (let i = lines.length - 1; i >= 0; i -= 1) {
    const speaker = lines[i]?.speaker;
    if (speaker === "Prospect") return lines[i] ?? null;
  }
  return null;
}

export function LandedApp() {
  const platform = useDownloadPlatform();
  const { filename } = getDownloadInfo(platform);
  const [phase, setPhase] = useState<AppPhase>("welcome");
  const [sessionMode, setSessionMode] = useState<SessionMode>("live");
  const [listening, setListening] = useState(true);
  const [suggestionVisible, setSuggestionVisible] = useState(false);
  const [suggestionMounted, setSuggestionMounted] = useState(false);
  const [activeSuggestion, setActiveSuggestion] = useState("");
  const [dealHealth, setDealHealth] = useState<number | null>(null);
  const [showFollowUps, setShowFollowUps] = useState(false);
  const [sessionLines, setSessionLines] = useState<TranscriptLine[]>([]);

  const audioActive = phase === "active" && listening;
  const session = useLandedSession(audioActive, sessionMode);
  const {
    suggestion,
    followUps,
    loading,
    followUpLoading,
    error,
    fetchSuggestion,
    fetchFollowUps,
    clearSuggestion,
  } = useLandedAI();

  const lastProspectRef = useRef<string | null>(null);
  const hideTimerRef = useRef<number | null>(null);
  const linesRef = useRef(session.lines);
  linesRef.current = session.lines;

  const pillTheme = lightPillTheme;

  const showSuggestion = useCallback((text: string, health: number | null, opts?: { isQuestion?: boolean }) => {
    if (hideTimerRef.current) {
      window.clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
    setActiveSuggestion(text);
    setDealHealth(health);
    setSuggestionMounted(true);
    setSuggestionVisible(true);

    hideTimerRef.current = window.setTimeout(() => {
      setSuggestionVisible(false);
      hideTimerRef.current = window.setTimeout(() => {
        setSuggestionMounted(false);
        setActiveSuggestion("");
      }, 300);
    }, getSuggestionReadDurationMs(text, opts));
  }, []);

  useEffect(() => {
    if (phase !== "active" || !listening) return;

    const last = session.lines[session.lines.length - 1];
    if (!last || last.speaker !== "Prospect") return;
    if (lastProspectRef.current === last.id) return;

    lastProspectRef.current = last.id;
    void fetchSuggestion(last.text, session.lines).then((result) => {
      if (result?.suggestion) {
        showSuggestion(result.suggestion, result.health, {
          isQuestion: isDirectQuestion(last.text),
        });
      }
    });
  }, [phase, listening, session.lines, fetchSuggestion, showSuggestion]);

  const startSession = (mode: SessionMode) => {
    session.clear();
    clearSuggestion();
    setSessionMode(mode);
    setSessionLines([]);
    setShowFollowUps(false);
    lastProspectRef.current = null;
    setPhase("active");
    setListening(true);
  };

  const endSession = () => {
    setListening(false);
    setSessionLines([...linesRef.current]);
    setPhase("recap");
  };

  const handleAssist = () => {
    const prospect = lastProspectLine(linesRef.current);
    const text = prospect?.text ?? "Walk me through your approach to this problem.";
    void fetchSuggestion(text, linesRef.current).then((result) => {
      if (result?.suggestion) {
        showSuggestion(result.suggestion, result.health, { isQuestion: true });
      }
    });
  };

  const handleFollowUp = async () => {
    const questions = await fetchFollowUps(linesRef.current);
    if (questions.length > 0) setShowFollowUps(true);
  };

  const restart = () => {
    if (hideTimerRef.current) window.clearTimeout(hideTimerRef.current);
    session.clear();
    clearSuggestion();
    setSessionLines([]);
    setShowFollowUps(false);
    setSuggestionVisible(false);
    setSuggestionMounted(false);
    setActiveSuggestion("");
    setDealHealth(null);
    lastProspectRef.current = null;
    setPhase("welcome");
  };

  if (phase === "recap") {
    return (
      <RecapScreen
        transcript={sessionLines}
        onRestart={restart}
      />
    );
  }

  if (phase === "welcome") {
    return (
      <div className="relative min-h-screen overflow-hidden">
        <MeetingBackground mode="live" />
        <div className="relative z-10 flex min-h-screen flex-col">
          <header className="flex items-center justify-between px-6 py-4">
            <Link href="/" className="flex items-center">
              <LandedLogo variant="wordmark" tone="light" className="h-7 w-auto" />
            </Link>
            <span className="rounded-full border border-white/10 bg-black/30 px-3 py-1 text-xs text-white/50 backdrop-blur-sm">
              Screen · text · GPT
            </span>
          </header>

          <div className="flex flex-1 flex-col items-center justify-center px-6 pb-20">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full max-w-md rounded-2xl border border-white/10 bg-black/40 p-8 backdrop-blur-xl"
            >
              <h1 className="text-center text-2xl font-semibold tracking-tight text-white md:text-3xl">
                Landed — technical interview AI
              </h1>
              <p className="mt-3 text-center text-[14px] leading-relaxed text-white/55">
                For the full experience — see your screen and ask in text — download the
                desktop app. The web demo is a lighter preview.
              </p>

              <button
                type="button"
                onClick={() => startSession("live")}
                className="mt-8 w-full rounded-full bg-white py-3 text-[15px] font-medium text-zinc-900 transition hover:bg-zinc-100"
              >
                Start session
              </button>

              <button
                type="button"
                onClick={() => startSession("demo")}
                className="mt-3 w-full rounded-full border border-white/20 py-3 text-[15px] font-medium text-white/80 transition hover:bg-white/10"
              >
                Try demo
              </button>

              <p className="mt-6 text-center text-[12px] text-white/40">
                Native desktop app →{" "}
                <Link href="/download" className="text-landed-300 hover:text-landed-200">
                  Download {filename}
                </Link>
              </p>
            </motion.div>
          </div>
        </div>
      </div>
    );
  }

  const displaySuggestion = activeSuggestion || suggestion?.suggestion || "";
  const displayHealth = dealHealth ?? suggestion?.health ?? null;
  const showPill = suggestionMounted || loading;

  return (
    <div className="relative h-screen w-screen overflow-hidden">
      <MeetingBackground mode={sessionMode} />

      <div className="relative z-10 flex h-full flex-col">
        <motion.div
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          className="absolute left-5 top-5 flex max-w-[520px] flex-col gap-2"
        >
          {sessionMode === "live" && !session.tabSharing && (
            <TabSharePrompt
              onShare={() => void session.startTabShare()}
              error={session.tabError}
              theme={pillTheme}
            />
          )}

          <ListeningPill
            listening={listening}
            isDemo={sessionMode === "demo"}
            tabSharing={session.tabSharing}
            hasMic={session.hasMic}
            micError={session.micError}
            theme={pillTheme}
          />

          <AnimatePresence>
            {showPill && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
              >
                <SuggestionPill
                  suggestion={displaySuggestion}
                  loading={loading && !displaySuggestion}
                  visible={suggestionVisible || loading}
                  dealHealth={displayHealth}
                  theme={pillTheme}
                />
              </motion.div>
            )}
          </AnimatePresence>

          <FollowUpPanel
            questions={followUps}
            visible={showFollowUps}
            theme={pillTheme}
            onClose={() => setShowFollowUps(false)}
          />

          {error ? (
            <p className="rounded-lg bg-red-500/20 px-3 py-2 text-[12px] text-red-200">{error}</p>
          ) : null}
        </motion.div>

        <div className="mt-auto flex justify-center pb-8">
          <ControlButtons
            onAssist={handleAssist}
            onFollowUp={handleFollowUp}
            onEndSession={endSession}
            listening={listening}
            onToggleListening={() => setListening((v) => !v)}
            followUpLoading={followUpLoading}
            theme={pillTheme}
          />
        </div>
      </div>
    </div>
  );
}
