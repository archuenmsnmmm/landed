import type { Metadata } from "next";
import { LegalDocument } from "@/components/legal/LegalDocument";
import { LEGAL, LEGAL_ROUTES } from "@/content/legal/config";
import { termsSections } from "@/content/legal/terms-sections";

export const metadata: Metadata = {
  title: "Terms of Service — Landed",
  description: `Terms of Service for ${LEGAL.productName}, invisible AI for technical interviews.`,
};

export default function TermsPage() {
  return (
    <LegalDocument
      title="Terms of Service"
      description={`These Terms govern your access to and use of ${LEGAL.productName}. Please read them carefully before using the Service.`}
      sections={termsSections}
      relatedLinks={[
        { href: LEGAL_ROUTES.privacy, label: "Privacy Policy" },
        { href: LEGAL_ROUTES.acceptableUse, label: "Acceptable Use Policy" },
        { href: LEGAL_ROUTES.cookies, label: "Cookie Policy" },
        { href: LEGAL_ROUTES.dpa, label: "Data Processing Addendum" },
        { href: LEGAL_ROUTES.subprocessors, label: "Subprocessors" },
      ]}
    />
  );
}
