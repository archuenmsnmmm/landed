import type { CSSProperties } from "react";

export type PillTheme = "light" | "dark";

export interface PillThemeStyles {
  theme: PillTheme;
  glass: CSSProperties;
  status: string;
  label: string;
  body: string;
  transcript: string;
  transcriptMuted: string;
  edgeFade: string;
}

export const lightPillTheme: PillThemeStyles = {
  theme: "light",
  glass: {
    backdropFilter: "blur(48px) saturate(180%)",
    WebkitBackdropFilter: "blur(48px) saturate(180%)",
    background: "rgba(255,255,255,0.32)",
    border: "1px solid rgba(255,255,255,0.55)",
    boxShadow: "0 8px 40px rgba(0,0,0,0.14), inset 0 1px 0 rgba(255,255,255,0.65)",
  },
  status: "text-zinc-900",
  label: "text-landed-700",
  body: "text-zinc-900",
  transcript: "text-zinc-800",
  transcriptMuted: "text-zinc-500",
  edgeFade: "linear-gradient(to right, rgba(255,255,255,0.32), transparent)",
};

export const darkPillTheme: PillThemeStyles = {
  theme: "dark",
  glass: {
    backdropFilter: "blur(40px) saturate(160%)",
    WebkitBackdropFilter: "blur(40px) saturate(160%)",
    background: "rgba(18, 18, 22, 0.78)",
    border: "1px solid rgba(255,255,255,0.10)",
    boxShadow: "0 10px 40px rgba(0,0,0,0.38), inset 0 1px 0 rgba(255,255,255,0.06)",
  },
  status: "text-white/90",
  label: "text-landed-300",
  body: "text-white/90",
  transcript: "text-white/85",
  transcriptMuted: "text-white/45",
  edgeFade: "linear-gradient(to right, rgba(18,18,22,0.78), transparent)",
};
