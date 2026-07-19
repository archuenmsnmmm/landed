import { useEffect, useRef } from "react";
import { useAppStore, notifyAppStoreChanged } from "../store/useAppStore";

/** Finalize legacy "processing" meetings without calling OpenAI. */
export function MeetingSummaryWorker() {
  const updateMeeting = useAppStore((s) => s.updateMeeting);
  const meetings = useAppStore((s) => s.meetings);
  const recoveredRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    for (const meeting of meetings) {
      if (meeting.status !== "processing") continue;
      if (recoveredRef.current.has(meeting.id)) continue;
      recoveredRef.current.add(meeting.id);

      updateMeeting(meeting.id, {
        summary: "",
        status: "ready",
      });
      notifyAppStoreChanged();
    }
  }, [meetings, updateMeeting]);

  return null;
}
