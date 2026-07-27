import { LEGAL } from "@/content/legal/config";

const SUPPORT_EMAIL = LEGAL.contact.support;

export function ContactContent() {
  return (
    <div className="mx-auto max-w-[720px] px-6 py-16 md:py-24">
      <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[#a1a1aa]">
        Support
      </p>
      <h1 className="mt-3 text-[2.25rem] font-semibold leading-[1.1] tracking-[-0.03em] text-[#0a0a0a] md:text-[2.75rem]">
        Contact Us
      </h1>
      <p className="mt-4 text-[16px] leading-relaxed text-[#71717a]">
        Questions, account help, privacy requests, or security issues — email us and
        we&apos;ll get back to you.
      </p>

      <div className="mt-14 rounded-2xl border border-[#ececef] bg-white p-8 md:p-10">
        <p className="text-[13px] font-medium text-[#71717a]">Email</p>
        <a
          href={`mailto:${SUPPORT_EMAIL}`}
          className="mt-2 block text-[1.75rem] font-semibold tracking-[-0.02em] text-[#4b8bf5] hover:text-[#3d7de8] md:text-[2rem]"
        >
          {SUPPORT_EMAIL}
        </a>
        <a
          href={`mailto:${SUPPORT_EMAIL}`}
          className="mt-8 inline-flex h-11 items-center justify-center rounded-full bg-[#4b8bf5] px-6 text-[14px] font-medium text-white transition-colors hover:bg-[#3d7de8]"
        >
          Send email
        </a>
      </div>
    </div>
  );
}
