import {
  LegalLi,
  LegalOl,
  LegalP,
  LegalStrong,
  LegalUl,
  type LegalSection,
} from "@/components/legal/LegalDocument";
import { LEGAL, LEGAL_ROUTES } from "@/content/legal/config";

export const termsSections: LegalSection[] = [
  {
    id: "agreement",
    title: "Agreement to These Terms",
    content: (
      <>
        <LegalP>
          These Terms of Service (&ldquo;<LegalStrong>Terms</LegalStrong>&rdquo;)
          constitute a legally binding agreement between you and the operator of{" "}
          {LEGAL.productName} (&ldquo;<LegalStrong>Landed</LegalStrong>,&rdquo;
          &ldquo;<LegalStrong>we</LegalStrong>,&rdquo; &ldquo;
          <LegalStrong>us</LegalStrong>,&rdquo; or &ldquo;
          <LegalStrong>our</LegalStrong>&rdquo;) governing your access to and
          use of the {LEGAL.productName} desktop application, website, APIs,
          documentation, and related services (collectively, the &ldquo;
          <LegalStrong>Service</LegalStrong>&rdquo;). {LEGAL.businessStructure}
        </LegalP>
        <LegalP>
          By creating an account, checking the agreement box at registration,
          downloading the application, clicking &ldquo;Continue,&rdquo;
          &ldquo;Sign up,&rdquo; or otherwise accessing or using the Service,
          you acknowledge that you have read, understood, and agree to be bound
          by these Terms and our{" "}
          <a href={LEGAL_ROUTES.privacy} className="text-landed-600 underline">
            Privacy Policy
          </a>
          , which is incorporated by reference. If you do not agree, do not use
          the Service.
        </LegalP>
        <LegalP>
          If you use the Service on behalf of a company or other legal entity,
          you represent and warrant that you have authority to bind that entity,
          and &ldquo;you&rdquo; refers to that entity.
        </LegalP>
      </>
    ),
  },
  {
    id: "eligibility",
    title: "Eligibility and Account Registration",
    content: (
      <>
        <LegalP>
          You must be at least 18 years old and have the legal capacity to enter
          into a binding contract to use the Service. The Service is not
          intended for minors.
        </LegalP>
        <LegalP>
          You agree to provide accurate, current, and complete registration
          information and to keep your account credentials confidential. You are
          responsible for all activity under your account. Notify us immediately
          at {LEGAL.contact.support} if you suspect unauthorized access.
        </LegalP>
        <LegalP>
          We may refuse registration, suspend, or terminate accounts at our
          discretion, including for violations of these Terms or our{" "}
          <a
            href={LEGAL_ROUTES.acceptableUse}
            className="text-landed-600 underline"
          >
            Acceptable Use Policy
          </a>
          .
        </LegalP>
      </>
    ),
  },
  {
    id: "service-description",
    title: "Description of the Service",
    content: (
      <>
        <LegalP>
          {LEGAL.productName} is an AI-assisted desktop screen assistant
          that may, depending on your settings and device permissions:
        </LegalP>
        <LegalUl>
          <LegalLi>
            Capture screen content when you ask a question, so answers can be
            grounded in what is visible on your display;
          </LegalLi>
          <LegalLi>
            Display answers and related outputs through an on-screen overlay;
          </LegalLi>
          <LegalLi>
            Process your questions and screen context using third-party artificial
            intelligence services to generate answers;
          </LegalLi>
          <LegalLi>
            Store session history, settings, and related data
            locally on your device and/or in connected cloud services;
          </LegalLi>
          <LegalLi>
            Offer optional features intended to reduce visibility of the overlay
            during screen sharing or recordings.
          </LegalLi>
        </LegalUl>
        <LegalP>
          Features may change, be added, removed, or offered in beta without
          notice. We do not guarantee uninterrupted availability, accuracy, or
          fitness for any particular purpose.
        </LegalP>
      </>
    ),
  },
  {
    id: "permissions",
    title: "Device Permissions and Third-Party Platforms",
    content: (
      <>
        <LegalP>
          The Service may require system permissions including accessibility,
          screen capture, and related OS-level access. You are
          solely responsible for granting, revoking, and managing those
          permissions.
        </LegalP>
        <LegalP>
          The Service is designed to operate alongside third-party communication
          platforms (e.g., video conferencing, telephony, CRM tools). Landed is
          not affiliated with, endorsed by, or responsible for those platforms.
          Your use of third-party services remains subject to their terms and
          policies.
        </LegalP>
        <LegalP>
          You are solely responsible for ensuring your use of {LEGAL.productName}
          complies with the policies of your employer, interviewers, regulators,
          and any platform you use during technical interviews.
        </LegalP>
      </>
    ),
  },
  {
    id: "ai-disclaimer",
    title: "AI Outputs and No Professional Advice",
    content: (
      <>
        <LegalP>
          <LegalStrong>
            THIS IS AN AI-POWERED CONVERSATION / ASSISTANT, NOT A HUMAN.
            THE SERVICE USES ARTIFICIAL INTELLIGENCE. AI CAN MAKE MISTAKES.
            AI-GENERATED OUTPUTS MAY BE INACCURATE, INCOMPLETE, BIASED, OUTDATED,
            OR INAPPROPRIATE.
          </LegalStrong>{" "}
          Nothing in the Service is a live human coach, interviewer, lawyer, or
          other professional. You must independently review, verify, and approve
          all suggestions before relying on or communicating them to any person.
        </LegalP>
        <LegalP>
          Landed does not provide legal, financial, tax, medical, compliance,
          investment, or other professional advice. AI outputs are informational
          tools only. You bear full responsibility for statements made during
          technical interviews, coding rounds, negotiations, contracts, disclosures,
          and regulatory communications.
        </LegalP>
        <LegalP>
          We make no warranty that AI outputs will improve interview performance,
          hiring outcomes, compliance, or any business result.
        </LegalP>
      </>
    ),
  },
  {
    id: "recording-consent",
    title: "Recording, Monitoring, and Consent Laws",
    content: (
      <>
        <LegalP>
          <LegalStrong>
            YOU ARE SOLELY RESPONSIBLE FOR COMPLYING WITH ALL APPLICABLE LAWS
            GOVERNING RECORDING, MONITORING, INTERCEPTION, TRANSCRIPTION, AND
            USE OF CONVERSATIONS.
          </LegalStrong>{" "}
          This includes, without limitation, federal and state wiretapping laws,
          two-party consent requirements, employment laws, GDPR and UK GDPR,
          ePrivacy rules, TCPA/telemarketing rules, sector-specific regulations,
          and contractual obligations with your employer or customers.
        </LegalP>
        <LegalP>
          Before using {LEGAL.productName} during any technical interview or call,
          you must obtain all required consents and provide all required notices to
          participants. Landed does not obtain consent on your behalf.
        </LegalP>
        <LegalP>
          You agree not to use the Service to covertly record, transcribe, or
          monitor individuals where prohibited by law or without required
          authorization.
        </LegalP>
      </>
    ),
  },
  {
    id: "subscriptions",
    title: "Subscriptions, Billing, and Refunds",
    content: (
      <>
        <LegalP>
          Some features require a paid subscription. Pricing, plan names, and
          included features are described on our website and in the application
          and may change. Unless otherwise stated, subscriptions renew
          automatically until canceled.
        </LegalP>
        <LegalP>
          Payments are processed by third-party payment processors (such as
          Stripe). By subscribing, you authorize us and our processors to charge
          your payment method on a recurring basis. You are responsible for all
          applicable taxes.
        </LegalP>
        <LegalP>
          Except where required by law, all fees are non-refundable. Downgrades
          and cancellations take effect at the end of the current billing period
          unless stated otherwise. Free trials, if offered, convert to paid plans
          unless canceled before the trial ends.
        </LegalP>
        <LegalP>
          We may change pricing upon reasonable notice. Continued use after a
          price change constitutes acceptance.
        </LegalP>
      </>
    ),
  },
  {
    id: "acceptable-use",
    title: "Acceptable Use",
    content: (
      <>
        <LegalP>
          Your use of the Service must comply with our{" "}
          <a
            href={LEGAL_ROUTES.acceptableUse}
            className="text-landed-600 underline"
          >
            Acceptable Use Policy
          </a>
          . Without limiting that policy, you may not:
        </LegalP>
        <LegalUl>
          <LegalLi>
            Use the Service for unlawful, fraudulent, deceptive, harassing, or
            abusive purposes;
          </LegalLi>
          <LegalLi>
            Misrepresent AI-generated content as human-authored where
            misrepresentation is prohibited;
          </LegalLi>
          <LegalLi>
            Reverse engineer, scrape, resell, or build a competing product using
            the Service except as permitted by law;
          </LegalLi>
          <LegalLi>
            Upload malware, attempt unauthorized access, or interfere with
            Service security or performance;
          </LegalLi>
          <LegalLi>
            Process sensitive personal data categories (e.g., health, biometric,
            children&apos;s data) unless you have lawful basis and appropriate
            safeguards;
          </LegalLi>
          <LegalLi>
            Use the Service in violation of export control or sanctions laws.
          </LegalLi>
        </LegalUl>
      </>
    ),
  },
  {
    id: "user-content",
    title: "Your Content and Data",
    content: (
      <>
        <LegalP>
          You retain ownership of content you provide or generate through the
          Service, including transcripts, prompts, uploaded materials, and
          configuration (&ldquo;<LegalStrong>User Content</LegalStrong>&rdquo;).
        </LegalP>
        <LegalP>
          You grant Landed a worldwide, non-exclusive, royalty-free license to
          host, store, reproduce, process, transmit, and display User Content
          solely to operate, maintain, secure, and improve the Service, comply
          with law, and enforce these Terms. Where you configure third-party AI
          providers, your content may also be processed under their terms.
        </LegalP>
        <LegalP>
          You represent that you have all rights necessary to provide User
          Content and that it does not infringe third-party rights or violate
          law.
        </LegalP>
      </>
    ),
  },
  {
    id: "intellectual-property",
    title: "Landed Intellectual Property",
    content: (
      <>
        <LegalP>
          The Service, including software, branding, design, documentation, and
          all related intellectual property, is owned by Landed or its licensors
          and protected by applicable laws. Except for the limited license
          granted herein, no rights are transferred to you.
        </LegalP>
        <LegalP>
          Subject to these Terms and your subscription status, we grant you a
          limited, non-exclusive, non-transferable, revocable license to install
          and use the application for your internal business purposes.
        </LegalP>
        <LegalP>
          Feedback you provide may be used by us without restriction or
          compensation.
        </LegalP>
      </>
    ),
  },
  {
    id: "confidentiality",
    title: "Confidentiality and Security",
    content: (
      <>
        <LegalP>
          You are responsible for safeguarding confidential information
          displayed by the Service, including response suggestions visible on
          your screen. Use device locks, privacy settings, and secure networks
          appropriate to your environment.
        </LegalP>
        <LegalP>
          We implement reasonable administrative, technical, and organizational
          measures to protect the Service, but no system is completely secure.
          You use the Service at your own risk.
        </LegalP>
      </>
    ),
  },
  {
    id: "third-party",
    title: "Third-Party Services",
    content: (
      <>
        <LegalP>
          The Service integrates with third-party providers including, without
          limitation, authentication providers (e.g., Supabase), AI providers
          (e.g., OpenAI), speech recognition services, cloud infrastructure,
          payment processors, and OAuth providers (e.g., Google). Your use of
          those services is subject to their terms and privacy policies.
        </LegalP>
        <LegalP>
          Landed is not responsible for third-party services, outages, data
          handling practices, or changes to third-party terms. Availability of
          integrations may change without notice.
        </LegalP>
      </>
    ),
  },
  {
    id: "beta",
    title: "Beta and Experimental Features",
    content: (
      <>
        <LegalP>
          We may offer beta, preview, or experimental features (&ldquo;
          <LegalStrong>Beta Features</LegalStrong>&rdquo;). Beta Features are
          provided &ldquo;as is,&rdquo; may contain defects, and may be modified
          or discontinued at any time.
        </LegalP>
        <LegalP>
          To the maximum extent permitted by law, Beta Features are excluded
          from warranties and service-level commitments.
        </LegalP>
      </>
    ),
  },
  {
    id: "disclaimers",
    title: "Disclaimers",
    content: (
      <>
        <LegalP>
          <LegalStrong>
            THE SERVICE IS PROVIDED &ldquo;AS IS&rdquo; AND &ldquo;AS
            AVAILABLE&rdquo; WITHOUT WARRANTIES OF ANY KIND, WHETHER EXPRESS,
            IMPLIED, STATUTORY, OR OTHERWISE.
          </LegalStrong>{" "}
          Landed disclaims all warranties, including merchantability, fitness for
          a particular purpose, title, non-infringement, accuracy, and quiet
          enjoyment.
        </LegalP>
        <LegalP>
          We do not warrant that the Service will be uninterrupted, error-free,
          secure, compatible with all screen-sharing platforms, compliant with your
          employer&apos;s policies, or free from harmful components.
        </LegalP>
        <LegalP>
          Some jurisdictions do not allow certain disclaimers; in those cases,
          disclaimers apply to the maximum extent permitted.
        </LegalP>
      </>
    ),
  },
  {
    id: "liability",
    title: "Limitation of Liability",
    content: (
      <>
        <LegalP>
          <LegalStrong>
            TO THE MAXIMUM EXTENT PERMITTED BY LAW, THE LANDED OPERATOR AND ITS
            CONTRACTORS, AGENTS, AFFILIATES, AND LICENSORS WILL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL,
            EXEMPLARY, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS, REVENUE,
            DATA, GOODWILL, BUSINESS OPPORTUNITY, OR REPUTATION, ARISING FROM OR
            RELATED TO THE SERVICE OR THESE TERMS, EVEN IF ADVISED OF THE
            POSSIBILITY.
          </LegalStrong>
        </LegalP>
        <LegalP>
          <LegalStrong>
            TO THE MAXIMUM EXTENT PERMITTED BY LAW, LANDED&apos;S TOTAL
            AGGREGATE LIABILITY FOR ALL CLAIMS ARISING OUT OF OR RELATING TO THE
            SERVICE OR THESE TERMS WILL NOT EXCEED THE GREATER OF (A) THE AMOUNT
            YOU PAID TO LANDED FOR THE SERVICE IN THE TWELVE (12) MONTHS BEFORE
            THE EVENT GIVING RISE TO LIABILITY, OR (B) ONE HUNDRED POUNDS
            STERLING (£100).
          </LegalStrong>
        </LegalP>
        <LegalP>
          These limitations apply regardless of theory of liability and even if
          a remedy fails of its essential purpose.
        </LegalP>
      </>
    ),
  },
  {
    id: "indemnification",
    title: "Indemnification",
    content: (
      <>
        <LegalP>
          You will defend, indemnify, and hold harmless the Landed operator and
          its contractors, agents, affiliates, and licensors from and against any claims, damages, losses, liabilities, costs, and expenses
          (including reasonable attorneys&apos; fees) arising out of or related
          to:
        </LegalP>
        <LegalUl>
          <LegalLi>Your use or misuse of the Service;</LegalLi>
          <LegalLi>Your User Content;</LegalLi>
          <LegalLi>
            Your violation of these Terms, applicable law, or third-party rights;
          </LegalLi>
          <LegalLi>
            Your failure to obtain required consents for recording, monitoring,
            or AI-assisted communications;
          </LegalLi>
          <LegalLi>
            Disputes with employers, interviewers, or conversation
            participants relating to your use of the Service.
          </LegalLi>
        </LegalUl>
      </>
    ),
  },
  {
    id: "termination",
    title: "Suspension and Termination",
    content: (
      <>
        <LegalP>
          We may suspend or terminate your access immediately for any violation
          of these Terms, suspected fraud, legal requirement, or risk to the
          Service or others. You may stop using the Service at any time and may
          cancel subscriptions through account settings or by contacting support.
        </LegalP>
        <LegalP>
          Upon termination, your license ends and you must cease use. Sections
          that by nature should survive (including payment obligations,
          disclaimers, limitation of liability, indemnification, dispute
          resolution, and intellectual property) will survive.
        </LegalP>
      </>
    ),
  },
  {
    id: "dispute-resolution",
    title: "Dispute Resolution and Arbitration",
    content: (
      <>
        <LegalP>
          <LegalStrong>
            PLEASE READ THIS SECTION CAREFULLY. IT AFFECTS YOUR LEGAL RIGHTS,
            INCLUDING YOUR RIGHT TO FILE A LAWSUIT IN COURT AND TO HAVE A JURY
            TRIAL.
          </LegalStrong>
        </LegalP>
        <LegalP>
          Before filing a claim, you agree to contact us at {LEGAL.contact.legal}{" "}
          and attempt to resolve the dispute informally for at least thirty (30)
          days.
        </LegalP>
        <LegalP>
          Except for qualifying small claims matters or requests for injunctive
          relief relating to intellectual property or unauthorized access, any
          dispute arising out of or relating to these Terms or the Service will
          be resolved by binding individual arbitration administered by the{" "}
          {LEGAL.arbitration.provider} under its {LEGAL.arbitration.rules}. The
          seat of arbitration is {LEGAL.arbitration.seat}. The arbitrator may
          award the same damages and relief a court could award.
        </LegalP>
        <LegalP>
          <LegalStrong>
            CLASS ACTION WAIVER: YOU AND LANDED AGREE THAT EACH MAY BRING CLAIMS
            AGAINST THE OTHER ONLY IN YOUR OR ITS INDIVIDUAL CAPACITY, AND NOT
            AS A PLAINTIFF OR CLASS MEMBER IN ANY PURPORTED CLASS, COLLECTIVE,
            REPRESENTATIVE, OR PRIVATE ATTORNEY GENERAL PROCEEDING.
          </LegalStrong>
        </LegalP>
        <LegalP>
          You may opt out of arbitration within thirty (30) days of first
          accepting these Terms by emailing {LEGAL.contact.legal} with subject
          line &ldquo;Arbitration Opt-Out&rdquo; and your account email.
        </LegalP>
      </>
    ),
  },
  {
    id: "governing-law",
    title: "Governing Law and Venue",
    content: (
      <>
        <LegalP>
          These Terms are governed by the laws of {LEGAL.jurisdiction.region},{" "}
          {LEGAL.jurisdiction.country}, without regard to conflict-of-law
          principles, except where mandatory consumer protection laws of your
          jurisdiction apply.
        </LegalP>
        <LegalP>
          If arbitration does not apply, you agree to exclusive jurisdiction in
          the {LEGAL.jurisdiction.courts}, and waive any objection to venue or
          inconvenient forum.
        </LegalP>
      </>
    ),
  },
  {
    id: "international",
    title: "International Use and Export",
    content: (
      <>
        <LegalP>
          The Service may be accessed internationally. You are responsible for
          compliance with local laws where you access or use the Service,
          including laws relating to recording, employment, privacy, and
          telecommunications.
        </LegalP>
      </>
    ),
  },
  {
    id: "changes",
    title: "Changes to These Terms",
    content: (
      <>
        <LegalP>
          We may modify these Terms at any time. Material changes will be
          notified via the Service, email, or website at least thirty (30) days
          before they take effect where required by law. Continued use after the
          effective date constitutes acceptance. If you do not agree, you must
          stop using the Service.
        </LegalP>
      </>
    ),
  },
  {
    id: "miscellaneous",
    title: "Miscellaneous",
    content: (
      <>
        <LegalP>
          These Terms, together with the Privacy Policy, Acceptable Use Policy,
          and any order forms or supplemental terms, constitute the entire
          agreement between you and Landed regarding the Service.
        </LegalP>
        <LegalP>
          If any provision is unenforceable, the remainder remains in effect.
          Our failure to enforce a provision is not a waiver. You may not assign
          these Terms without our consent; we may assign them freely. Notices to
          you may be sent to your account email or through the Service.
        </LegalP>
        <LegalP>
          Questions about these Terms: {LEGAL.contact.legal}
        </LegalP>
      </>
    ),
  },
];
