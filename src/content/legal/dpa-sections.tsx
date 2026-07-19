import {
  LegalLi,
  LegalP,
  LegalStrong,
  LegalUl,
  type LegalSection,
} from "@/components/legal/LegalDocument";
import { LEGAL, LEGAL_ROUTES } from "@/content/legal/config";

export const dpaSections: LegalSection[] = [
  {
    id: "scope",
    title: "1. Scope and Roles",
    content: (
      <>
        <LegalP>
          This Data Processing Addendum (&ldquo;<LegalStrong>DPA</LegalStrong>
          &rdquo;) forms part of the{" "}
          <a href={LEGAL_ROUTES.terms} className="text-landed-600 underline">
            Terms of Service
          </a>{" "}
          between you (the &ldquo;<LegalStrong>Customer</LegalStrong>&rdquo;) and{" "}
          {LEGAL.legalEntity} (&ldquo;<LegalStrong>Processor</LegalStrong>
          &rdquo;) when we process Personal Data on your behalf in connection
          with the {LEGAL.productName} Services.
        </LegalP>
        <LegalP>
          For account, billing, and website visitor data that we determine the
          purposes and means of processing, we act as an independent controller.
          Those activities are described in our{" "}
          <a href={LEGAL_ROUTES.privacy} className="text-landed-600 underline">
            Privacy Policy
          </a>
          .
        </LegalP>
      </>
    ),
  },
  {
    id: "processing",
    title: "2. Processing Details",
    content: (
      <>
        <LegalP>
          <LegalStrong>Subject matter.</LegalStrong> Provision of real-time
          coaching, transcription, technical interview summaries, knowledge
          retrieval, and related product features.
        </LegalP>
        <LegalP>
          <LegalStrong>Duration.</LegalStrong> For the term of your subscription
          or account, plus any retention period required by law or our Privacy
          Policy.
        </LegalP>
        <LegalP>
          <LegalStrong>Nature and purpose.</LegalStrong> Hosting, storage,
          transmission, transcription, AI inference, indexing, and display of
          Customer Content as instructed by you through the Services.
        </LegalP>
        <LegalP>
          <LegalStrong>Types of Personal Data.</LegalStrong> May include names,
          email addresses, audio/transcript content, interview metadata, uploaded
          knowledge documents, and other content you submit.
        </LegalP>
        <LegalP>
          <LegalStrong>Data subjects.</LegalStrong> Your personnel, interviewers,
          and other individuals whose information appears in Customer Content.
        </LegalP>
      </>
    ),
  },
  {
    id: "obligations",
    title: "3. Processor Obligations",
    content: (
      <>
        <LegalP>We will:</LegalP>
        <LegalUl>
          <LegalLi>
            process Personal Data only on documented instructions from you,
            including via the Services configuration, unless required by law;
          </LegalLi>
          <LegalLi>
            ensure persons authorized to process Personal Data are bound by
            confidentiality;
          </LegalLi>
          <LegalLi>
            implement appropriate technical and organizational security measures;
          </LegalLi>
          <LegalLi>
            assist you, taking into account the nature of processing, with data
            subject requests and security/breach notifications where required;
          </LegalLi>
          <LegalLi>
            delete or return Personal Data upon termination of the Services when
            you request deletion through account controls or by emailing{" "}
            {LEGAL.contact.privacy}, unless retention is required by law; and
          </LegalLi>
          <LegalLi>
            make available information reasonably necessary to demonstrate
            compliance with this DPA upon written request.
          </LegalLi>
        </LegalUl>
      </>
    ),
  },
  {
    id: "subprocessors",
    title: "4. Subprocessors",
    content: (
      <>
        <LegalP>
          You authorize us to engage subprocessors listed at{" "}
          <a
            href={LEGAL_ROUTES.subprocessors}
            className="text-landed-600 underline"
          >
            {LEGAL_ROUTES.subprocessors}
          </a>
          . We will impose data protection terms on subprocessors no less
          protective than this DPA. We will notify you of material subprocessor
          changes via the subprocessors page or email where practicable.
        </LegalP>
      </>
    ),
  },
  {
    id: "transfers",
    title: "5. International Transfers",
    content: (
      <>
        <LegalP>
          Where Personal Data is transferred outside the UK or EEA, we rely on
          appropriate transfer mechanisms such as the UK International Data
          Transfer Agreement / Addendum, EU Standard Contractual Clauses, or an
          adequacy decision, as applicable to the destination and our
          subprocessors.
        </LegalP>
      </>
    ),
  },
  {
    id: "security",
    title: "6. Security and Incidents",
    content: (
      <>
        <LegalP>
          We maintain administrative, technical, and physical safeguards
          appropriate to the risk, including access controls, encryption in
          transit, and least-privilege access to production systems. If we become
          aware of a Personal Data breach affecting Customer Personal Data, we
          will notify you without undue delay and provide information reasonably
          available to help you meet your obligations.
        </LegalP>
      </>
    ),
  },
  {
    id: "customer",
    title: "7. Customer Responsibilities",
    content: (
      <>
        <LegalP>
          You are responsible for the lawfulness of Customer Content you submit,
          obtaining any required notices or consents (including for call
          recording where applicable), and configuring the Services appropriately
          for your use case.
        </LegalP>
      </>
    ),
  },
  {
    id: "contact",
    title: "8. Contact",
    content: (
      <>
        <LegalP>
          Privacy and DPA requests: {LEGAL.contact.privacy}. Legal notices:{" "}
          {LEGAL.contact.legal}. Governing law and dispute resolution follow the
          Terms of Service ({LEGAL.jurisdiction.region}).
        </LegalP>
      </>
    ),
  },
];
