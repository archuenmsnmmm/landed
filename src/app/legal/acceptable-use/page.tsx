import type { Metadata } from "next";
import { LegalDocument } from "@/components/legal/LegalDocument";
import { LEGAL, LEGAL_ROUTES } from "@/content/legal/config";
import { acceptableUseSections } from "@/content/legal/other-sections";

export const metadata: Metadata = {
  title: "Acceptable Use Policy — Landed",
  description: `Rules for permitted use of ${LEGAL.productName}.`,
};

export default function AcceptableUsePage() {
  return (
    <LegalDocument
      title="Acceptable Use Policy"
      description={`This policy defines permitted and prohibited uses of ${LEGAL.productName}. It forms part of your agreement with ${LEGAL.legalEntity}.`}
      sections={acceptableUseSections}
      relatedLinks={[
        { href: LEGAL_ROUTES.terms, label: "Terms of Service" },
        { href: LEGAL_ROUTES.privacy, label: "Privacy Policy" },
      ]}
    />
  );
}
