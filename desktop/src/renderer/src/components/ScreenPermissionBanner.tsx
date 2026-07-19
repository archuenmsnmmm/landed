import { useCallback, useEffect, useState } from "react";

export function ScreenPermissionBanner() {
  const [granted, setGranted] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    const status = await window.landed?.getPermissionStatus?.();
    setGranted(status?.screen ?? false);
  }, []);

  useEffect(() => {
    void refresh();
    const id = window.setInterval(() => void refresh(), 3000);
    const onFocus = () => void refresh();
    window.addEventListener("focus", onFocus);
    return () => {
      window.clearInterval(id);
      window.removeEventListener("focus", onFocus);
    };
  }, [refresh]);

  if (granted !== false) return null;

  const enableScreen = async () => {
    setBusy(true);
    try {
      await window.landed?.captureScreen?.();
      await window.landed?.openPermissionSettings?.("screen");
      await refresh();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="no-drag border-b border-amber-100 bg-amber-50 px-6 py-3">
      <p className="text-[13px] font-medium text-amber-950">Allow screen access</p>
      <p className="mt-0.5 text-[12px] text-amber-900">
        System Settings → Privacy &amp; Security → Screen Recording → enable{" "}
        <strong>Landed</strong>, then click below.
      </p>
      <button
        type="button"
        disabled={busy}
        onClick={() => void enableScreen()}
        className="mt-2 rounded-full bg-amber-900 px-4 py-2 text-[12px] font-semibold text-white disabled:opacity-50"
      >
        {busy ? "Requesting…" : "Allow screen access"}
      </button>
    </div>
  );
}
