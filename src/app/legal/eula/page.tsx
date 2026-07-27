import type { Metadata } from "next";
import { LegalDocument } from "@/components/legal/LegalDocument";
import { LEGAL, LEGAL_ROUTES, legalRelatedLinks } from "@/content/legal/config";
import { eulaSections } from "@/content/legal/eula-sections";

export const metadata: Metadata = {
  title: "End User License Agreement — Landed",
  description: `License terms for the ${LEGAL.productName} desktop application.`,
};

export default function EulaPage() {
  return (
    <LegalDocument
      title="End User License Agreement"
      description={`This EULA governs download, installation, and use of the ${LEGAL.productName} desktop Software. It forms part of your agreement under our Terms of Service.`}
      sections={eulaSections}
      relatedLinks={legalRelatedLinks(LEGAL_ROUTES.eula)}
    />
  );
}
