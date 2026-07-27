import type { ReactNode } from "react";
import { legalLinks, openLegalLink } from "../../lib/legal-urls";

function LegalDocButton({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        openLegalLink(href);
      }}
      className="font-medium text-zinc-800 underline decoration-zinc-300 hover:decoration-zinc-500"
    >
      {children}
    </button>
  );
}

export function TermsAgreement({
  checked,
  onChange,
  id = "terms-agreement",
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  id?: string;
}) {
  return (
    <label
      htmlFor={id}
      className="flex w-full cursor-pointer items-start gap-3 rounded-xl border border-zinc-200 bg-white px-4 py-3 text-left"
    >
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-4 w-4 shrink-0 rounded border-zinc-300 text-[#3b82f6] focus:ring-[#3b82f6]"
        required
      />
      <span className="text-[12px] leading-relaxed text-zinc-600">
        I agree to the{" "}
        <LegalDocButton href={legalLinks.terms}>Terms of Service</LegalDocButton>
        ,{" "}
        <LegalDocButton href={legalLinks.eula}>EULA</LegalDocButton>,{" "}
        <LegalDocButton href={legalLinks.privacy}>Privacy Policy</LegalDocButton>
        ,{" "}
        <LegalDocButton href={legalLinks.acceptableUse}>
          Acceptable Use Policy
        </LegalDocButton>
        , and{" "}
        <LegalDocButton href={legalLinks.refund}>
          Refund and Cancellation Policy
        </LegalDocButton>
        . I confirm I am at least 18 years old and understand that Landed is an{" "}
        <span className="font-medium text-zinc-800">
          AI-powered conversation, not a human
        </span>
        , that it{" "}
        <span className="font-medium text-zinc-800">may make mistakes</span>, and
        that I will review all suggestions before use.
      </span>
    </label>
  );
}
