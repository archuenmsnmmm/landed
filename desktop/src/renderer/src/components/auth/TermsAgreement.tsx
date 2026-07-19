import { legalLinks, openLegalLink } from "../../lib/legal-urls";

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
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            openLegalLink(legalLinks.terms);
          }}
          className="font-medium text-zinc-800 underline decoration-zinc-300 hover:decoration-zinc-500"
        >
          Terms of Service
        </button>
        ,{" "}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            openLegalLink(legalLinks.privacy);
          }}
          className="font-medium text-zinc-800 underline decoration-zinc-300 hover:decoration-zinc-500"
        >
          Privacy Policy
        </button>
        , and{" "}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            openLegalLink(legalLinks.acceptableUse);
          }}
          className="font-medium text-zinc-800 underline decoration-zinc-300 hover:decoration-zinc-500"
        >
          Acceptable Use Policy
        </button>
        . I confirm I am at least 18 years old and understand that{" "}
        <span className="font-medium text-zinc-800">AI can make mistakes</span>{" "}
        and I will review all suggestions before use.
      </span>
    </label>
  );
}
