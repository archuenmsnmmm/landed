import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "Landed — Invisible AI for technical interviews",
  description:
    "Invisible AI for technical interviews — type questions about what’s on your screen. No mic needed.",
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
