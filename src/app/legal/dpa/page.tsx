import type { Metadata } from "next";
import { LegalDocument } from "@/components/legal/LegalDocument";
import { LEGAL, LEGAL_ROUTES, legalRelatedLinks } from "@/content/legal/config";
import { dpaSections } from "@/content/legal/dpa-sections";

export const metadata: Metadata = {
  title: "Data Processing Addendum — Landed",
  description: `Data Processing Addendum for ${LEGAL.productName} customers.`,
};

export default function DpaPage() {
  return (
    <LegalDocument
      title="Data Processing Addendum"
      description={`This DPA applies when ${LEGAL.legalEntity} processes personal data on your behalf as part of the ${LEGAL.productName} Services. It supplements the Terms of Service.`}
      sections={dpaSections}
      relatedLinks={legalRelatedLinks(LEGAL_ROUTES.dpa)}
    />
  );
}
