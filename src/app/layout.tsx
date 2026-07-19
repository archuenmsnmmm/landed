import type { Metadata } from "next";
import { Inter, Instrument_Serif } from "next/font/google";
import { AnalyticsGate } from "@/components/AnalyticsGate";
import { CookieConsent } from "@/components/CookieConsent";
import { LANDED_MARKETING_ORIGIN } from "@/lib/landed-urls";
import "./globals.css";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? LANDED_MARKETING_ORIGIN;

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-instrument-serif",
});

const title = "Landed — Invisible AI for technical interviews";
const description =
  "Invisible AI for technical interviews. Landed sees the problem on your screen, answers when you type, and stays hidden from screen share — no mic needed.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title,
  description,
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "48x48" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/app-icon.png", sizes: "1024x1024", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  appleWebApp: {
    capable: true,
    title: "Landed",
  },
  openGraph: {
    title,
    description,
    url: siteUrl,
    siteName: "Landed",
    type: "website",
    images: [{ url: "/app-icon.png", width: 1024, height: 1024, alt: "Landed" }],
  },
  twitter: {
    card: "summary",
    title,
    description,
    images: ["/app-icon.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${instrumentSerif.variable}`}>
      <body className="font-sans">
        {children}
        <CookieConsent />
        <AnalyticsGate />
      </body>
    </html>
  );
}
