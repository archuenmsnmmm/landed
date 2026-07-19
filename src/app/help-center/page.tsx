import type { Metadata } from "next";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { HelpCenterContent } from "@/components/support/HelpCenterContent";
import { LEGAL } from "@/content/legal/config";

export const metadata: Metadata = {
  title: "Help Center — Landed",
  description: `Get help with ${LEGAL.productName} — setup, technical interviews, billing, and troubleshooting.`,
};

export default function HelpCenterPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-white pt-14">
        <HelpCenterContent />
      </main>
      <Footer />
    </>
  );
}
