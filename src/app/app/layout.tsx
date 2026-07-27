import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "Landed — Never have to debug again",
  description:
    "Never have to debug alone. Landed sees what’s on your screen and answers when you type. Optional mic or call audio for live transcription.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    title: "Landed",
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  themeColor: "#8b5cf6",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <div className="h-full min-h-screen">{children}</div>;
}
