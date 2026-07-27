import {
  LegalLi,
  LegalP,
  LegalStrong,
  LegalUl,
  type LegalSection,
} from "@/components/legal/LegalDocument";
import { LEGAL, LEGAL_ROUTES, SUPPORT_ROUTES } from "@/content/legal/config";

export const legalNoticeSections: LegalSection[] = [
  {
    id: "operator",
    title: "Operator Identity",
    content: (
      <>
        <LegalP>
          <LegalStrong>{LEGAL.productName}</LegalStrong> is a trading name.{" "}
          {LEGAL.businessStructure}
        </LegalP>
        <LegalUl>
          <LegalLi>
            <LegalStrong>Trading name:</LegalStrong> {LEGAL.legalEntity}
          </LegalLi>
          <LegalLi>
            <LegalStrong>Primary operator:</LegalStrong> Archie Runnicles
            (founder), trading as Landed
          </LegalLi>
          <LegalLi>
            <LegalStrong>Website:</LegalStrong>{" "}
            <a href={LEGAL.website} className="text-landed-600 underline">
              {LEGAL.website}
            </a>
          </LegalLi>
          <LegalLi>
            <LegalStrong>Governing law:</LegalStrong>{" "}
            {LEGAL.jurisdiction.region}, {LEGAL.jurisdiction.country}
          </LegalLi>
        </LegalUl>
        <LegalP>
          Landed is not currently registered as a limited company. If our
          business structure changes, we will update this notice and our Terms.
        </LegalP>
      </>
    ),
  },
  {
    id: "contact",
    title: "Contact for Legal and Privacy Matters",
    content: (
      <>
        <LegalP>
          For service of legal notices, privacy requests, and data-protection
          enquiries, contact:
        </LegalP>
        <LegalUl>
          <LegalLi>
            <LegalStrong>Legal:</LegalStrong> {LEGAL.contact.legal}
          </LegalLi>
          <LegalLi>
            <LegalStrong>Privacy / data-subject requests:</LegalStrong>{" "}
            {LEGAL.contact.privacy}
          </LegalLi>
          <LegalLi>
            <LegalStrong>Support:</LegalStrong> {LEGAL.contact.support}
          </LegalLi>
          <LegalLi>
            <LegalStrong>Contact form:</LegalStrong>{" "}
            <a
              href={SUPPORT_ROUTES.contact}
              className="text-landed-600 underline"
            >
              {SUPPORT_ROUTES.contact}
            </a>
          </LegalLi>
        </LegalUl>
        <LegalP>
          We do not currently publish a separate postal address for general
          correspondence. If you need a postal address for formal legal process,
          email {LEGAL.contact.legal} and we will provide appropriate details.
        </LegalP>
      </>
    ),
  },
  {
    id: "policies",
    title: "Core Policies",
    content: (
      <>
        <LegalP>Your use of Landed is governed by:</LegalP>
        <LegalUl>
          <LegalLi>
            <a href={LEGAL_ROUTES.terms} className="text-landed-600 underline">
              Terms of Service
            </a>
          </LegalLi>
          <LegalLi>
            <a href={LEGAL_ROUTES.eula} className="text-landed-600 underline">
              End User License Agreement
            </a>
          </LegalLi>
          <LegalLi>
            <a href={LEGAL_ROUTES.privacy} className="text-landed-600 underline">
              Privacy Policy
            </a>
          </LegalLi>
          <LegalLi>
            <a
              href={LEGAL_ROUTES.acceptableUse}
              className="text-landed-600 underline"
            >
              Acceptable Use Policy
            </a>
          </LegalLi>
          <LegalLi>
            <a href={LEGAL_ROUTES.refund} className="text-landed-600 underline">
              Refund and Cancellation Policy
            </a>
          </LegalLi>
          <LegalLi>
            <a href={LEGAL_ROUTES.cookies} className="text-landed-600 underline">
              Cookie Policy
            </a>
          </LegalLi>
          <LegalLi>
            <a href={LEGAL_ROUTES.dpa} className="text-landed-600 underline">
              Data Processing Addendum
            </a>
          </LegalLi>
          <LegalLi>
            <a
              href={LEGAL_ROUTES.subprocessors}
              className="text-landed-600 underline"
            >
              Subprocessors
            </a>
          </LegalLi>
        </LegalUl>
      </>
    ),
  },
  {
    id: "ai-notice",
    title: "AI Notice",
    content: (
      <>
        <LegalP>
          {LEGAL.aiDisclaimerShort} Landed does not provide legal, financial,
          medical, or professional advice. See the{" "}
          <a
            href={LEGAL.aiDisclaimerLearnMorePath}
            className="text-landed-600 underline"
          >
            AI disclaimer in our Terms
          </a>
          .
        </LegalP>
      </>
    ),
  },
];
