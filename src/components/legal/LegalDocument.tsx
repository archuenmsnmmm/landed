import type { ReactNode } from "react";
import Link from "next/link";
import { LEGAL } from "@/content/legal/config";

export interface LegalSection {
  id: string;
  title: string;
  content: ReactNode;
}

export function LegalDocument({
  title,
  description,
  highlight,
  sections,
  relatedLinks,
}: {
  title: string;
  description: ReactNode;
  highlight?: ReactNode;
  sections: LegalSection[];
  relatedLinks?: { href: string; label: string }[];
}) {
  return (
    <div className="mx-auto max-w-[1200px] px-6 py-16 md:py-24">
      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_220px] lg:gap-16">
        <article className="min-w-0">
          <header className="border-b border-[#ececef] pb-10">
            <h1 className="text-[2.25rem] font-semibold leading-[1.1] tracking-[-0.03em] text-[#0a0a0a] md:text-[2.75rem]">
              {title}
            </h1>
            <p className="mt-4 text-[14px] text-[#a1a1aa]">
              Last updated on {LEGAL.lastUpdated}
            </p>
            <div className="mt-6 space-y-4 text-[15px] leading-[1.75] text-[#52525b]">
              {description}
            </div>
            {highlight ? (
              <div className="mt-6 rounded-2xl border border-[#dbeafe] bg-[#eff6ff] px-5 py-4 text-[14px] leading-[1.65] text-[#1e3a5f]">
                {highlight}
              </div>
            ) : null}
          </header>

          <div className="legal-prose mt-12 space-y-14">
            {sections.map((section) => (
              <section key={section.id} id={section.id} className="scroll-mt-28">
                <h2 className="text-[1.35rem] font-semibold tracking-[-0.02em] text-[#0a0a0a] md:text-[1.5rem]">
                  {section.title}
                </h2>
                <div className="mt-5 space-y-4 text-[15px] leading-[1.75] text-[#52525b]">
                  {section.content}
                </div>
              </section>
            ))}
          </div>

          {relatedLinks && relatedLinks.length > 0 ? (
            <footer className="mt-16 border-t border-[#ececef] pt-10">
              <p className="text-[15px] font-semibold text-[#0a0a0a]">
                Related policies
              </p>
              <p className="mt-2 text-[14px] text-[#71717a]">
                Learn about our privacy practices, refund policy, and cancellation
                terms.
              </p>
              <ul className="mt-5 flex flex-wrap gap-x-6 gap-y-3">
                {relatedLinks.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-[14px] font-medium text-[#4b8bf5] transition-colors hover:text-[#3d7de8]"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </footer>
          ) : null}
        </article>

        <aside className="hidden lg:block">
          <nav
            aria-label="On this page"
            className="sticky top-28 rounded-2xl border border-[#ececef] bg-[#fafafa] p-5"
          >
            <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-[#a1a1aa]">
              On this page
            </p>
            <ol className="mt-4 space-y-2.5">
              {sections.map((section, index) => (
                <li key={section.id}>
                  <a
                    href={`#${section.id}`}
                    className="block text-[13px] leading-snug text-[#71717a] transition-colors hover:text-[#0a0a0a]"
                  >
                    {index + 1}. {section.title}
                  </a>
                </li>
              ))}
            </ol>
          </nav>
        </aside>
      </div>
    </div>
  );
}

export function LegalP({ children }: { children: ReactNode }) {
  return <p>{children}</p>;
}

export function LegalH3({ children }: { children: ReactNode }) {
  return (
    <h3 className="!mt-8 text-[15px] font-semibold text-[#0a0a0a]">{children}</h3>
  );
}

export function LegalUl({ children }: { children: ReactNode }) {
  return <ul className="list-disc space-y-2.5 pl-5">{children}</ul>;
}

export function LegalOl({ children }: { children: ReactNode }) {
  return <ol className="list-decimal space-y-2.5 pl-5">{children}</ol>;
}

export function LegalLi({ children }: { children: ReactNode }) {
  return <li>{children}</li>;
}

export function LegalStrong({ children }: { children: ReactNode }) {
  return <strong className="font-semibold text-[#0a0a0a]">{children}</strong>;
}

export function LegalLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <a href={href} className="text-[#4b8bf5] underline underline-offset-2">
      {children}
    </a>
  );
}

export function LegalTable({
  headers,
  rows,
}: {
  headers: string[];
  rows: string[][];
}) {
  return (
    <div className="!my-6 overflow-x-auto rounded-xl border border-[#ececef]">
      <table className="min-w-full text-left text-[13px]">
        <thead className="border-b border-[#ececef] bg-[#fafafa]">
          <tr>
            {headers.map((header) => (
              <th
                key={header}
                className="px-4 py-3 font-semibold text-[#0a0a0a] first:min-w-[140px]"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex} className="border-b border-[#f4f4f5] last:border-0">
              {row.map((cell, cellIndex) => (
                <td
                  key={cellIndex}
                  className="px-4 py-3 align-top text-[#52525b] first:font-medium first:text-[#0a0a0a]"
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
