import type { TranscriptLine } from "../services/ai";
import {
  notifyAppStoreChanged,
  useAppStore,
} from "../store/useAppStore";
import type {
  SalesMode,
  SuggestionRecord,
  SummarySection,
} from "../store/types";

export async function endLandedSession({
  duration,
  transcript,
  activeMode,
  suggestionUses,
  suggestions,
  title = "Live session",
  company = "Interview",
  summary = "",
  summarySections,
  nextSteps = [],
  dealScore = 0,
  objections = [],
}: {
  duration: number;
  transcript: TranscriptLine[];
  activeMode: SalesMode;
  suggestionUses: number;
  suggestions: SuggestionRecord[];
  title?: string;
  company?: string;
  summary?: string;
  summarySections?: SummarySection[];
  nextSteps?: string[];
  dealScore?: number;
  objections?: string[];
}): Promise<string | null> {
  let meetingId: string | null = null;

  try {
    const meeting = useAppStore.getState().saveMeetingFromSession({
      title,
      company,
      mode: activeMode,
      duration,
      transcript,
      summary,
      summarySections,
      status: "ready",
      nextSteps,
      dealScore,
      objections,
      suggestionUses,
      suggestions,
    });
    meetingId = meeting.id;

    if (transcript.length === 0) {
      useAppStore.getState().refundFreeOverlaySeconds(duration);
    }

    notifyAppStoreChanged();
  } catch (err) {
    console.error("[landed] Failed to save session:", err);
  } finally {
    await window.landed?.stopSession();
    useAppStore.getState().setSessionActive(false);
    // Overlay-only product — no meeting detail dashboard.
    void window.landed?.hideDashboard?.();
  }

  return meetingId;
}
