import {
  LegalLi,
  LegalP,
  LegalStrong,
  LegalUl,
  type LegalSection,
} from "@/components/legal/LegalDocument";
import { LEGAL, LEGAL_ROUTES } from "@/content/legal/config";

export const refundSections: LegalSection[] = [
  {
    id: "overview",
    title: "Overview",
    content: (
      <>
        <LegalP>
          This Refund and Cancellation Policy explains how cancellations and
          refunds work for paid {LEGAL.productName} plans. It supplements our{" "}
          <a href={LEGAL_ROUTES.terms} className="text-landed-600 underline">
            Terms of Service
          </a>
          . If there is a conflict on refunds, this policy and any mandatory
          consumer-protection rights control.
        </LegalP>
      </>
    ),
  },
  {
    id: "satisfaction-guarantee",
    title: "14-Day Satisfaction Guarantee",
    content: (
      <>
        <LegalP>
          If you are not satisfied with a new{" "}
          <LegalStrong>Pro</LegalStrong> subscription or{" "}
          <LegalStrong>Lifetime</LegalStrong> purchase, contact us at{" "}
          {LEGAL.contact.support} within{" "}
          <LegalStrong>14 days</LegalStrong> of the original purchase date and
          we will issue a full refund of the amount charged for that purchase,
          no questions asked.
        </LegalP>
        <LegalP>The guarantee applies once per customer for:</LegalP>
        <LegalUl>
          <LegalLi>The first Pro billing charge (monthly or annual); and</LegalLi>
          <LegalLi>A Lifetime purchase.</LegalLi>
        </LegalUl>
        <LegalP>
          Renewal charges after the first Pro period are not covered by the
          14-day guarantee (see Cancellation below). Free Starter usage has no
          charge and therefore no refund.
        </LegalP>
      </>
    ),
  },
  {
    id: "how-to-request",
    title: "How to Request a Refund",
    content: (
      <>
        <LegalP>
          Email {LEGAL.contact.support} from the email address on your account
          with the subject line &ldquo;Refund request,&rdquo; and include:
        </LegalP>
        <LegalUl>
          <LegalLi>The email used for your {LEGAL.productName} account;</LegalLi>
          <LegalLi>Approximate purchase date and plan (Pro or Lifetime); and</LegalLi>
          <LegalLi>The last four digits of the card charged, if available.</LegalLi>
        </LegalUl>
        <LegalP>
          Approved refunds are processed through Stripe to your original payment
          method. Timing depends on your bank or card issuer (often 5–10 business
          days after we issue the refund).
        </LegalP>
      </>
    ),
  },
  {
    id: "cancellation",
    title: "Cancelling a Subscription",
    content: (
      <>
        <LegalP>
          You may cancel Pro anytime in the desktop app under Settings → Billing,
          or by emailing {LEGAL.contact.support}. Cancellation stops future
          renewals. You keep paid access until the end of the current billing
          period unless we issue a refund under this policy.
        </LegalP>
        <LegalP>
          Lifetime is a one-time purchase and does not renew. There is nothing to
          cancel after purchase; refund eligibility follows the 14-day guarantee
          above.
        </LegalP>
      </>
    ),
  },
  {
    id: "after-guarantee",
    title: "After the Guarantee Window",
    content: (
      <>
        <LegalP>
          Outside the 14-day guarantee (and except where required by law), fees
          are non-refundable, including unused time in a billing period,
          partial-period downgrades, and change-of-mind requests after day 14.
        </LegalP>
        <LegalP>
          We may still grant a goodwill refund or credit at our sole discretion
          for billing errors, duplicate charges, or service outages that
          materially prevent use.
        </LegalP>
      </>
    ),
  },
  {
    id: "exceptions",
    title: "Exceptions and Abuse",
    content: (
      <>
        <LegalP>We may deny a refund request if we reasonably believe:</LegalP>
        <LegalUl>
          <LegalLi>
            The request is fraudulent, abusive, or part of repeated
            purchase-and-refund cycling;
          </LegalLi>
          <LegalLi>
            The account violated our{" "}
            <a
              href={LEGAL_ROUTES.acceptableUse}
              className="text-landed-600 underline"
            >
              Acceptable Use Policy
            </a>{" "}
            or Terms; or
          </LegalLi>
          <LegalLi>
            Chargebacks or payment disputes were filed in bad faith instead of
            contacting support first.
          </LegalLi>
        </LegalUl>
        <LegalP>
          Filing a chargeback without contacting us may result in account
          suspension while we investigate.
        </LegalP>
      </>
    ),
  },
  {
    id: "consumer-rights",
    title: "Statutory Consumer Rights",
    content: (
      <>
        <LegalP>
          Nothing in this policy limits rights you may have under mandatory
          consumer law in your jurisdiction, including UK consumer protection
          rules where they apply. If mandatory law requires a broader refund or
          cooling-off right than this policy, that law prevails.
        </LegalP>
        <LegalP>
          Digital content that you have started to use may affect cooling-off
          rights under applicable law. Our 14-day satisfaction guarantee is
          offered in addition to, and not instead of, those rights.
        </LegalP>
      </>
    ),
  },
  {
    id: "contact",
    title: "Contact",
    content: (
      <>
        <LegalP>
          Refund and cancellation requests: {LEGAL.contact.support}. Legal
          notices: {LEGAL.contact.legal}.
        </LegalP>
      </>
    ),
  },
];
