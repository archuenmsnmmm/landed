import type { Metadata } from "next";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ContactContent } from "@/components/support/ContactContent";
import { LEGAL } from "@/content/legal/config";

export const metadata: Metadata = {
  title: "Contact Us — Landed",
  description: `Contact the ${LEGAL.productName} team for support, privacy, legal, and security inquiries.`,
};

export default function ContactPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-white pt-14">
        <ContactContent />
      </main>
      <Footer />
    </>
  );
}
