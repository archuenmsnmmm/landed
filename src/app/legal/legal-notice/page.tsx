import type { Metadata } from "next";
import { LegalDocument } from "@/components/legal/LegalDocument";
import { LEGAL, LEGAL_ROUTES, legalRelatedLinks } from "@/content/legal/config";
import { legalNoticeSections } from "@/content/legal/legal-notice-sections";

export const metadata: Metadata = {
  title: "Legal Notice — Landed",
  description: `Operator identity and legal contact details for ${LEGAL.productName}.`,
};

export default function LegalNoticePage() {
  return (
    <LegalDocument
      title="Legal Notice"
      description={`Who operates ${LEGAL.productName}, how to contact us for legal and privacy matters, and where to find our core policies.`}
      sections={legalNoticeSections}
      relatedLinks={legalRelatedLinks(LEGAL_ROUTES.legalNotice)}
    />
  );
}
