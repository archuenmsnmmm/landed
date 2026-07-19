import {
  LegalLi,
  LegalP,
  LegalStrong,
  LegalUl,
  type LegalSection,
} from "@/components/legal/LegalDocument";
import { LEGAL, LEGAL_ROUTES } from "@/content/legal/config";

export const acceptableUseSections: LegalSection[] = [
  {
    id: "overview",
    title: "Overview",
    content: (
      <>
        <LegalP>
          This Acceptable Use Policy (&ldquo;<LegalStrong>AUP</LegalStrong>
          &rdquo;) supplements the{" "}
          <a href={LEGAL_ROUTES.terms} className="text-landed-600 underline">
            Terms of Service
          </a>{" "}
          and applies to all use of {LEGAL.productName}. Violations may result
          in suspension or termination.
        </LegalP>
      </>
    ),
  },
  {
    id: "permitted-use",
    title: "Permitted Use",
    content: (
      <>
        <LegalP>
          You may use {LEGAL.productName} only for lawful internal business
          purposes, such as screen-assisted questions and conversation assistance, in
          compliance with applicable law, employer policies, and platform rules.
        </LegalP>
      </>
    ),
  },
  {
    id: "prohibited-conduct",
    title: "Prohibited Conduct",
    content: (
      <>
        <LegalP>You may not use the Service to:</LegalP>
        <LegalUl>
          <LegalLi>
            Violate any law, regulation, court order, or contractual obligation;
          </LegalLi>
          <LegalLi>
            Record, transcribe, monitor, or analyze conversations without all
            legally required notices and consents;
          </LegalLi>
          <LegalLi>
            Harass, threaten, defame, discriminate against, or harm any person;
          </LegalLi>
          <LegalLi>
            Engage in fraud, impersonation, phishing, or deceptive sales
            practices;
          </LegalLi>
          <LegalLi>
            Generate or disseminate unlawful, obscene, hateful, or exploitative
            content;
          </LegalLi>
          <LegalLi>
            Process special categories of personal data (e.g., health, biometric,
            genetic, children&apos;s data) without lawful basis and safeguards;
          </LegalLi>
          <LegalLi>
            Circumvent security, access controls, usage limits, or billing
            mechanisms;
          </LegalLi>
          <LegalLi>
            Reverse engineer, decompile, or attempt to extract source code except
            as permitted by law;
          </LegalLi>
          <LegalLi>
            Resell, sublicense, or provide the Service to third parties without
            authorization;
          </LegalLi>
          <LegalLi>
            Use automated means to scrape, probe, or overload the Service;
          </LegalLi>
          <LegalLi>
            Introduce malware, spyware, or harmful code;
          </LegalLi>
          <LegalLi>
            Use the Service in high-risk environments where failure could cause
            death, personal injury, or severe environmental damage;
          </LegalLi>
          <LegalLi>
            Violate export control, sanctions, or anti-bribery laws.
          </LegalLi>
        </LegalUl>
      </>
    ),
  },
  {
    id: "ai-use",
    title: "Responsible AI Use",
    content: (
      <>
        <LegalP>
          You must review AI-generated outputs before use. You may not represent
          AI outputs as guaranteed facts, legal advice, or binding commitments
          without independent verification. You may not use the Service to
          generate spam, manipulative scripts intended to violate consumer
          protection laws, or content that infringes intellectual property.
        </LegalP>
      </>
    ),
  },
  {
    id: "enterprise",
    title: "Enterprise and Team Accounts",
    content: (
      <>
        <LegalP>
          Administrators of team or enterprise accounts are responsible for user
          provisioning, permission management, and ensuring team members comply
          with this AUP and applicable workplace policies.
        </LegalP>
      </>
    ),
  },
  {
    id: "reporting",
    title: "Reporting Violations",
    content: (
      <>
        <LegalP>
          Report suspected violations to {LEGAL.contact.legal}. We may
          investigate and cooperate with law enforcement where appropriate.
        </LegalP>
      </>
    ),
  },
];

export const cookieSections: LegalSection[] = [
  {
    id: "what-are-cookies",
    title: "What Are Cookies and Similar Technologies",
    content: (
      <>
        <LegalP>
          Cookies are small text files stored on your device. We also use similar
          technologies such as local storage, session storage, and pixels. This
          Cookie Policy explains how {LEGAL.legalEntity} uses these technologies
          on {LEGAL.website} and related web properties.
        </LegalP>
      </>
    ),
  },
  {
    id: "types",
    title: "Types of Cookies We Use",
    content: (
      <>
        <LegalP>
          <LegalStrong>Strictly necessary.</LegalStrong> Required for site
          functionality, security, and load balancing. These cannot be disabled
          if you want to use the site.
        </LegalP>
        <LegalP>
          <LegalStrong>Functional.</LegalStrong> Remember preferences such as
          language or region.
        </LegalP>
        <LegalP>
          <LegalStrong>Analytics.</LegalStrong> Help us understand how visitors
          use our website so we can improve it. We use these only with
          appropriate consent where required.
        </LegalP>
        <LegalP>
          <LegalStrong>Marketing.</LegalStrong> May be used to measure campaign
          performance. We do not use invasive cross-site tracking without
          consent.
        </LegalP>
      </>
    ),
  },
  {
    id: "desktop-app",
    title: "Desktop Application Storage",
    content: (
      <>
        <LegalP>
          The {LEGAL.productName} desktop application may store data locally
          (including settings, session metadata, and authentication tokens) using
          device storage mechanisms. Full conversation transcripts are not kept
          in local browser storage; they are processed through authenticated
          server APIs and stored in your account database when saved. This local
          storage is necessary to operate the application and is described
          further in our{" "}
          <a href={LEGAL_ROUTES.privacy} className="text-landed-600 underline">
            Privacy Policy
          </a>
          .
        </LegalP>
      </>
    ),
  },
  {
    id: "choices",
    title: "Your Choices",
    content: (
      <>
        <LegalP>
          You can control cookies through browser settings. Blocking cookies may
          affect website functionality. Where required by law, we present a
          consent banner before setting non-essential cookies.
        </LegalP>
        <LegalP>
          For privacy rights requests, contact {LEGAL.contact.privacy}.
        </LegalP>
      </>
    ),
  },
  {
    id: "updates",
    title: "Updates",
    content: (
      <>
        <LegalP>
          We may update this Cookie Policy from time to time. Check the last
          updated date at the top of this page.
        </LegalP>
      </>
    ),
  },
];
