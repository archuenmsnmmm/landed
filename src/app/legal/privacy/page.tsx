import type { Metadata } from "next";
import { LegalDocument } from "@/components/legal/LegalDocument";
import { LEGAL, LEGAL_ROUTES } from "@/content/legal/config";
import { privacySections } from "@/content/legal/privacy-sections";

export const metadata: Metadata = {
  title: "Privacy Policy — Landed",
  description: `How ${LEGAL.productName} collects, uses, and protects your personal information.`,
};

export default function PrivacyPage() {
  return (
    <LegalDocument
      title="Privacy Policy"
      description={
        <>
          <p>
            Your privacy is important to us. This Privacy Policy
            (&ldquo;Policy&rdquo;) applies to services provided by{" "}
            {LEGAL.legalEntity} (&ldquo;we&rdquo;, &ldquo;us&rdquo;, or
            &ldquo;Landed&rdquo;) and our website (the &ldquo;Site&rdquo;),
            product pages, desktop or web applications, or other digital products
            that link to or reference this Policy (collectively, the
            &ldquo;Services&rdquo;) and explains what information we collect from
            users of our Services (a &ldquo;user&rdquo;, &ldquo;you&rdquo;, or
            &ldquo;your&rdquo;), including information that may be used to
            personally identify you (&ldquo;Personal Information&rdquo;) and how
            we use it.
          </p>
          <p>
            We encourage you to read the details below. This Policy applies to
            any visitor to or user of our Services. Any capitalized terms used
            herein but not defined shall have the meaning set forth in our Terms
            of Service, available at{" "}
            <a href={LEGAL_ROUTES.terms} className="text-[#4b8bf5] underline">
              {LEGAL.website}/legal/terms
            </a>
            .
          </p>
          <p>
            We reserve the right to change this Policy at any time. Changes to
            this Policy are effective when they are posted on this page. You
            acknowledge that your continued use of our Services after we publish or
            send a notice about our changes to this Policy means that the
            collection, use and sharing of your Personal Information is subject
            to the updated Policy.
          </p>
        </>
      }
      highlight={
        <>
          Landed does not sell your data or train on your data. You can email{" "}
          <a href={`mailto:${LEGAL.contact.privacy}`} className="font-medium underline">
            {LEGAL.contact.privacy}
          </a>{" "}
          to request deletion of your account data or to ask privacy questions at
          any time.
        </>
      }
      sections={privacySections}
      relatedLinks={[
        { href: LEGAL_ROUTES.terms, label: "Terms of Service" },
        { href: LEGAL_ROUTES.cookies, label: "Cookie Policy" },
        { href: LEGAL_ROUTES.acceptableUse, label: "Acceptable Use Policy" },
        { href: LEGAL_ROUTES.dpa, label: "Data Processing Addendum" },
        { href: LEGAL_ROUTES.subprocessors, label: "Subprocessors" },
      ]}
    />
  );
}
