type ChromeMediaTrackConstraints = MediaTrackConstraints & {
  chromeMediaSource?: string;
  chromeMediaSourceId?: string;
  mandatory?: {
    chromeMediaSource?: string;
    chromeMediaSourceId?: string;
    maxWidth?: number;
    maxHeight?: number;
    maxFrameRate?: number;
  };
};

export type LandedAudioSource = "desktop-capture" | "microphone" | null;

export interface LandedAudioSetup {
  microphoneGranted: boolean;
  screenGranted: boolean;
  inputLabels: string[];
}

function desktopMediaConstraints(sourceId: string): MediaStreamConstraints {
  const audio: ChromeMediaTrackConstraints = {
    chromeMediaSource: "desktop",
    chromeMediaSourceId: sourceId,
    mandatory: {
      chromeMediaSource: "desktop",
      chromeMediaSourceId: sourceId,
    },
  };

  const video: ChromeMediaTrackConstraints = {
    chromeMediaSource: "desktop",
    chromeMediaSourceId: sourceId,
    mandatory: {
      chromeMediaSource: "desktop",
      chromeMediaSourceId: sourceId,
      maxWidth: 1,
      maxHeight: 1,
      maxFrameRate: 1,
    },
  };

  return { audio, video };
}

async function streamFromDesktopSource(sourceId: string): Promise<MediaStream | null> {
  try {
    const stream = await navigator.mediaDevices.getUserMedia(
      desktopMediaConstraints(sourceId),
    );

    for (const track of stream.getVideoTracks()) {
      track.stop();
    }

    if (stream.getAudioTracks().length === 0) {
      stream.getTracks().forEach((t) => t.stop());
      return null;
    }

    return stream;
  } catch {
    return null;
  }
}

export async function listAudioInputDevices(): Promise<MediaDeviceInfo[]> {
  try {
    const probe = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
    probe.getTracks().forEach((t) => t.stop());
  } catch {
    // labels may stay empty until permission is granted
  }

  const devices = await navigator.mediaDevices.enumerateDevices();
  return devices.filter((d) => d.kind === "audioinput");
}

export async function detectLandedAudioSetup(): Promise<LandedAudioSetup> {
  const [status, inputs] = await Promise.all([
    window.landed?.getPermissionStatus?.(),
    listAudioInputDevices(),
  ]);

  return {
    microphoneGranted: status?.microphone ?? false,
    screenGranted: status?.screen ?? false,
    inputLabels: inputs.map((d) => d.label).filter(Boolean),
  };
}

/** True when macOS reports mic access or getUserMedia succeeds (ignores Web Speech false positives). */
export async function confirmMicrophoneAccess(): Promise<boolean> {
  const status = await window.landed?.getPermissionStatus?.();
  if (status?.microphone) return true;

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
    stream.getTracks().forEach((t) => t.stop());
    return true;
  } catch {
    return false;
  }
}

/** Native macOS screen share + system audio loopback (no virtual drivers). */
export async function captureCallAudio(): Promise<{
  stream: MediaStream;
  source: LandedAudioSource;
} | null> {
  try {
    const stream = await navigator.mediaDevices.getDisplayMedia({
      video: {
        width: { ideal: 1280, max: 1920 },
        height: { ideal: 720, max: 1080 },
        frameRate: { ideal: 1, max: 5 },
      },
      audio: true,
    });

    if (stream.getAudioTracks().length === 0) {
      stream.getTracks().forEach((t) => t.stop());
      return null;
    }

    for (const track of stream.getVideoTracks()) {
      track.onended = () => {
        stream.getAudioTracks().forEach((t) => t.stop());
      };
    }

    return { stream, source: "desktop-capture" };
  } catch (err) {
    console.warn("[landed] getDisplayMedia failed:", err);
  }

  try {
    const sources = await window.landed?.getDesktopAudioSources?.();
    if (!sources?.length) return null;

    for (const source of sources) {
      const stream = await streamFromDesktopSource(source.id);
      if (stream) return { stream, source: "desktop-capture" };
    }
  } catch (err) {
    console.warn("[landed] Desktop audio fallback failed:", err);
  }

  return null;
}

export async function captureMicrophone(): Promise<MediaStream> {
  const devices = await listAudioInputDevices();
  const builtIn =
    devices.find((d) => /built.?in|macbook|internal|air/i.test(d.label)) ?? devices[0];

  return navigator.mediaDevices.getUserMedia({
    audio: {
      deviceId: builtIn ? { ideal: builtIn.deviceId } : undefined,
      echoCancellation: false,
      noiseSuppression: false,
      autoGainControl: false,
      channelCount: { ideal: 1 },
      sampleRate: { ideal: 48000 },
    },
    video: false,
  });
}

export function getSupportedRecorderMime(): string | undefined {
  const isMac =
    typeof navigator !== "undefined" && /Mac/i.test(navigator.platform || navigator.userAgent);
  // WebM chunks are valid standalone files for Whisper; macOS MP4 timeslices often are not.
  const candidates = isMac
    ? ["audio/webm;codecs=opus", "audio/webm", "audio/ogg;codecs=opus", "audio/mp4"]
    : ["audio/webm;codecs=opus", "audio/webm", "audio/ogg;codecs=opus", "audio/mp4"];
  for (const mime of candidates) {
    if (MediaRecorder.isTypeSupported(mime)) return mime;
  }
  return undefined;
}

export function isCallAudioSource(source: LandedAudioSource): boolean {
  return source === "desktop-capture";
}
