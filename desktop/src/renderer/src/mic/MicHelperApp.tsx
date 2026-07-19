import { useCallback, useEffect, useState } from "react";
import { SessionMicBridge } from "../components/SessionMicBridge";
import { bootstrapOpenAIKey } from "../services/whisper";

function MicHelperPermissionUI() {
  const [visible, setVisible] = useState(false);
  const [status, setStatus] = useState<"idle" | "ready" | "denied">("idle");
  const [message, setMessage] = useState("");

  const requestMic = useCallback(async () => {
    setVisible(true);
    setMessage("Requesting microphone…");
    try {
      const permitted = await window.landed?.ensureMicrophone?.();
      if (!permitted) {
        setStatus("denied");
        setMessage("Microphone access denied.");
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
        video: false,
      });
      stream.getTracks().forEach((t) => t.stop());
      setStatus("ready");
      setMessage("Microphone ready.");
      window.setTimeout(() => {
        setVisible(false);
        window.landed?.hideMicHelper?.();
      }, 600);
    } catch {
      setStatus("denied");
      setMessage("Could not access microphone.");
    }
  }, []);

  useEffect(() => {
    return window.landed?.onRequestMicPermission?.(() => void requestMic());
  }, [requestMic]);

  if (!visible) return null;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 p-8 text-white">
      <p className="mb-2 text-lg font-semibold">Landed microphone</p>
      <p className="mb-6 max-w-sm text-center text-sm text-zinc-400">{message}</p>
      {status === "denied" && (
        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={() => void requestMic()}
            className="rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-zinc-900"
          >
            Enable microphone
          </button>
          <button
            type="button"
            onClick={() => void window.landed?.openPermissionSettings?.("microphone")}
            className="rounded-full border border-white/20 px-5 py-2.5 text-sm text-white"
          >
            Open System Settings
          </button>
        </div>
      )}
    </div>
  );
}

/** Hidden window — owns mic capture + Whisper transcription for overlay + dashboard. */
export function MicHelperApp() {
  useEffect(() => {
    void bootstrapOpenAIKey();
  }, []);

  return (
    <>
      <SessionMicBridge />
      <MicHelperPermissionUI />
    </>
  );
}
