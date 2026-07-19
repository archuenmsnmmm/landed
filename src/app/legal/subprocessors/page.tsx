import type { Metadata } from "next";
import Link from "next/link";
import { LEGAL, LEGAL_ROUTES } from "@/content/legal/config";
import { subprocessors } from "@/content/legal/subprocessors";

export const metadata: Metadata = {
  title: "Subprocessors — Landed",
  description: `Third-party subprocessors used by ${LEGAL.productName}.`,
};

export default function SubprocessorsPage() {
  return (
    <div className="mx-auto max-w-[1200px] px-6 py-16 md:py-24">
      <div className="max-w-3xl">
        <header className="border-b border-[#ececef] pb-10">
          <h1 className="text-[2.25rem] font-semibold leading-[1.1] tracking-[-0.03em] text-[#0a0a0a] md:text-[2.75rem]">
            Subprocessors
          </h1>
          <p className="mt-4 text-[14px] text-[#a1a1aa]">
            Last updated on {LEGAL.lastUpdated}
          </p>
          <p className="mt-6 text-[15px] leading-[1.75] text-[#52525b]">
            {LEGAL.legalEntity} uses the following third-party subprocessors to
            host, deliver, and support the {LEGAL.productName} Services. This
            list may be updated from time to time as our infrastructure evolves.
          </p>
        </header>

        <div className="mt-10 overflow-x-auto rounded-2xl border border-[#ececef]">
          <table className="min-w-full text-left text-[14px]">
            <thead className="border-b border-[#ececef] bg-[#fafafa]">
              <tr>
                <th className="px-5 py-4 font-semibold text-[#0a0a0a]">Subprocessor</th>
                <th className="px-5 py-4 font-semibold text-[#0a0a0a]">Purpose</th>
                <th className="px-5 py-4 font-semibold text-[#0a0a0a]">Location</th>
              </tr>
            </thead>
            <tbody>
              {subprocessors.map((processor) => (
                <tr key={processor.name} className="border-b border-[#f4f4f5] last:border-0">
                  <td className="px-5 py-4 align-top">
                    <a
                      href={processor.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-[#4b8bf5] hover:text-[#3d7de8]"
                    >
                      {processor.name}
                    </a>
                  </td>
                  <td className="px-5 py-4 align-top text-[#52525b]">{processor.purpose}</td>
                  <td className="px-5 py-4 align-top text-[#52525b]">{processor.location}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <footer className="mt-12 border-t border-[#ececef] pt-8">
          <p className="text-[14px] text-[#71717a]">
            Questions about subprocessors? Contact{" "}
            <a href={`mailto:${LEGAL.contact.privacy}`} className="text-[#4b8bf5]">
              {LEGAL.contact.privacy}
            </a>
            . See also our{" "}
            <Link href={LEGAL_ROUTES.privacy} className="text-[#4b8bf5]">
              Privacy Policy
            </Link>
            .
          </p>
        </footer>
      </div>
    </div>
  );
}
