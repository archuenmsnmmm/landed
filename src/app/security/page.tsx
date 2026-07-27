import type { Metadata } from "next";
import Link from "next/link";
import { LEGAL, LEGAL_ROUTES } from "@/content/legal/config";

export const metadata: Metadata = {
  title: "Security — Landed",
  description: `How to report security vulnerabilities in ${LEGAL.productName}.`,
};

export default function SecurityPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-16 text-[#1a1f2c]">
      <p className="text-[13px] font-medium text-[#667085]">Security</p>
      <h1 className="mt-2 text-[32px] font-semibold tracking-[-0.03em]">
        Vulnerability disclosure
      </h1>
      <p className="mt-4 text-[15px] leading-relaxed text-[#475467]">
        We take the security of {LEGAL.productName} seriously. If you believe you
        have found a vulnerability in our website, APIs, or desktop application,
        please tell us so we can fix it.
      </p>

      <section className="mt-10 space-y-4 text-[15px] leading-relaxed text-[#475467]">
        <h2 className="text-[18px] font-semibold text-[#1a1f2c]">How to report</h2>
        <p>
          Email{" "}
          <a
            href={`mailto:${LEGAL.contact.support}?subject=Security%20vulnerability`}
            className="font-medium text-[#4b8bf5] underline"
          >
            {LEGAL.contact.support}
          </a>{" "}
          with the subject line &ldquo;Security vulnerability.&rdquo; Include
          enough detail for us to reproduce the issue (steps, affected URLs or
          app version, and impact). Do not include passwords, payment card data,
          or other secrets belonging to third parties.
        </p>

        <h2 className="mt-8 text-[18px] font-semibold text-[#1a1f2c]">
          Our commitments
        </h2>
        <ul className="list-disc space-y-2 pl-5">
          <li>We will acknowledge valid reports within a reasonable time.</li>
          <li>
            We ask that you give us a reasonable opportunity to remediate before
            any public disclosure.
          </li>
          <li>
            Do not access, modify, or delete data that is not yours; do not
            perform denial-of-service testing; and do not exploit an issue beyond
            what is needed to demonstrate it.
          </li>
        </ul>

        <h2 className="mt-8 text-[18px] font-semibold text-[#1a1f2c]">Scope</h2>
        <p>
          In scope: {LEGAL.website}, authenticated Landed APIs, and the official
          Landed desktop application. Out of scope: third-party services we
          integrate with (report those to the provider), social engineering, and
          physical attacks.
        </p>

        <p className="mt-8">
          Legal identity and operator details:{" "}
          <Link
            href={LEGAL_ROUTES.legalNotice}
            className="font-medium text-[#4b8bf5] underline"
          >
            Legal Notice
          </Link>
          .
        </p>
      </section>
    </main>
  );
}
