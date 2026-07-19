import type { Metadata } from "next";
import { LegalDocument } from "@/components/legal/LegalDocument";
import { LEGAL, LEGAL_ROUTES } from "@/content/legal/config";
import { cookieSections } from "@/content/legal/other-sections";

export const metadata: Metadata = {
  title: "Cookie Policy — Landed",
  description: `How ${LEGAL.productName} uses cookies and similar technologies.`,
};

export default function CookiesPage() {
  return (
    <LegalDocument
      title="Cookie Policy"
      description={`This policy explains how ${LEGAL.legalEntity} uses cookies and similar technologies on our website and related services.`}
      sections={cookieSections}
      relatedLinks={[
        { href: LEGAL_ROUTES.privacy, label: "Privacy Policy" },
        { href: LEGAL_ROUTES.terms, label: "Terms of Service" },
        { href: LEGAL_ROUTES.dpa, label: "Data Processing Addendum" },
      ]}
    />
  );
}
