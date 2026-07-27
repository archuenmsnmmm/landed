import type { Metadata } from "next";
import { LegalDocument } from "@/components/legal/LegalDocument";
import { LEGAL, LEGAL_ROUTES, legalRelatedLinks } from "@/content/legal/config";
import { termsSections } from "@/content/legal/terms-sections";

export const metadata: Metadata = {
  title: "Terms of Service — Landed",
  description: `Terms of Service for ${LEGAL.productName}, AI that helps you never have to debug alone.`,
};

export default function TermsPage() {
  return (
    <LegalDocument
      title="Terms of Service"
      description={`These Terms govern your access to and use of ${LEGAL.productName}. Please read them carefully before using the Service.`}
      sections={termsSections}
      relatedLinks={legalRelatedLinks(LEGAL_ROUTES.terms)}
    />
  );
}
