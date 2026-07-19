"use client";

import { useState } from "react";
import Link from "next/link";
import type { TranscriptLine } from "@/types/landed";

function formatTimestamp(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function RecapScreen({
  transcript,
  onRestart,
}: {
  transcript: TranscriptLine[];
  onRestart: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const copyTranscript = () => {
    const text = transcript
      .map((line) =>
        line.timestamp > 0
          ? `[${formatTimestamp(line.timestamp)}] ${line.speaker}: ${line.text}`
          : `${line.speaker}: ${line.text}`,
      )
      .join("\n\n");
    navigator.clipboard.writeText(text);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-zinc-950 px-6 py-16 text-white">
      <div className="absolute left-6 top-6">
        <Link href="/" className="text-sm text-zinc-500 hover:text-white">
          ← Landed home
        </Link>
      </div>

      <div className="w-full max-w-lg">
        <p className="text-[13px] font-medium text-landed-400">Session complete</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Transcript</h1>

        {transcript.length === 0 ? (
          <p className="mt-8 text-zinc-400">No transcript was captured.</p>
        ) : (
          <div className="mt-8">
            <div className="mb-4 flex justify-end">
              <button
                type="button"
                onClick={copyTranscript}
                className="text-[13px] font-medium text-zinc-400 transition-colors hover:text-white"
              >
                {copied ? "Copied" : "Copy transcript"}
              </button>
            </div>
            <ul className="max-h-[min(60vh,480px)] space-y-4 overflow-y-auto rounded-xl border border-white/10 bg-black/20 p-4">
              {transcript.map((line) => (
                <li key={line.id} className="text-[14px] leading-relaxed">
                  <div className="mb-0.5 flex items-baseline gap-2">
                    <span
                      className={
                        line.speaker === "Prospect"
                          ? "text-landed-300"
                          : "text-zinc-500"
                      }
                    >
                      {line.speaker}
                    </span>
                    {line.timestamp > 0 && (
                      <span className="text-[12px] text-zinc-600">
                        {formatTimestamp(line.timestamp)}
                      </span>
                    )}
                  </div>
                  <span className="text-zinc-300">{line.text}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <button
          type="button"
          onClick={onRestart}
          className="mt-10 w-full rounded-full bg-white py-3 text-[15px] font-medium text-zinc-900 hover:bg-zinc-100"
        >
          Start another session
        </button>
      </div>
    </div>
  );
}
