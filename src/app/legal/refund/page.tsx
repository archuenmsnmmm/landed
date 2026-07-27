import type { Metadata } from "next";
import { LegalDocument } from "@/components/legal/LegalDocument";
import { LEGAL, LEGAL_ROUTES, legalRelatedLinks } from "@/content/legal/config";
import { refundSections } from "@/content/legal/refund-sections";

export const metadata: Metadata = {
  title: "Refund and Cancellation Policy — Landed",
  description: `Refund and cancellation terms for ${LEGAL.productName} Pro and Lifetime plans.`,
};

export default function RefundPage() {
  return (
    <LegalDocument
      title="Refund and Cancellation Policy"
      description={`How cancellations and refunds work for paid ${LEGAL.productName} plans, including our 14-day satisfaction guarantee.`}
      highlight={
        <>
          New Pro and Lifetime purchases: full refund within 14 days — email{" "}
          {LEGAL.contact.support}. Cancel anytime; you keep Pro until the billing
          period ends, then free limits apply.
        </>
      }
      sections={refundSections}
      relatedLinks={legalRelatedLinks(LEGAL_ROUTES.refund)}
    />
  );
}
