import Link from "next/link";
import { CookieSettingsLink } from "./CookieSettingsLink";
import { LandedLogo } from "./LandedLogo";
import { LEGAL_ROUTES, SUPPORT_ROUTES, LEGAL } from "@/content/legal/config";

type FooterLink = {
  label: string;
  href: string;
  badge?: string;
};

type FooterColumn = {
  title: string;
  links: FooterLink[];
};

type Founder = {
  role: string;
  name: string;
};

const founders: Founder[] = [
  { role: "CEO & Founder", name: "Archie Runnicles" },
  { role: "CFO & Co-founder", name: "Dylan Williams" },
];

const columns: FooterColumn[] = [
  {
    title: "Resources",
    links: [
      { label: "Pricing", href: "/pricing" },
      { label: "Download", href: "/download" },
    ],
  },
  {
    title: "Support",
    links: [
      { label: "Help Center", href: SUPPORT_ROUTES.helpCenter },
      { label: "Contact Us", href: SUPPORT_ROUTES.contact },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy Policy", href: LEGAL_ROUTES.privacy },
      { label: "Cookie Policy", href: LEGAL_ROUTES.cookies },
      { label: "Terms of Service", href: LEGAL_ROUTES.terms },
      { label: "Acceptable Use", href: LEGAL_ROUTES.acceptableUse },
      { label: "Data Processing", href: LEGAL_ROUTES.dpa },
      { label: "Subprocessors", href: LEGAL_ROUTES.subprocessors },
    ],
  },
];

export function Footer({ className = "bg-[#f7f8fa]" }: { className?: string }) {
  return (
    <footer className={className}>
      <div className="mx-auto flex max-w-[1200px] flex-col gap-12 px-6 py-14 md:flex-row md:items-start md:justify-between md:py-16">
        <Link href="/" className="flex items-center">
          <LandedLogo variant="wordmark" className="h-6 w-auto" />
        </Link>

        <div className="grid grid-cols-2 gap-10 sm:grid-cols-3 sm:gap-16">
          {columns.map((col) => (
            <div key={col.title}>
              <p className="text-[14px] font-semibold text-[#0a0a0a]">
                {col.title}
              </p>
              <ul className="mt-4 space-y-3">
                {col.links.map((link) => (
                  <li key={link.label}>
                    {link.href.startsWith("mailto:") ? (
                      <a
                        href={link.href}
                        className="inline-flex items-center gap-2 text-[14px] text-[#5f6b7a] transition-colors hover:text-[#0a0a0a]"
                      >
                        {link.label}
                        {"badge" in link && link.badge ? (
                          <span className="rounded-full bg-[#4b8bf5] px-2 py-0.5 text-[10px] font-medium text-white">
                            {link.badge}
                          </span>
                        ) : null}
                      </a>
                    ) : (
                      <Link
                        href={link.href}
                        className="inline-flex items-center gap-2 text-[14px] text-[#5f6b7a] transition-colors hover:text-[#0a0a0a]"
                      >
                        {link.label}
                        {"badge" in link && link.badge ? (
                          <span className="rounded-full bg-[#4b8bf5] px-2 py-0.5 text-[10px] font-medium text-white">
                            {link.badge}
                          </span>
                        ) : null}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>

              {col.title === "Resources" ? (
                <div className="mt-8">
                  <p className="text-[14px] font-semibold text-[#0a0a0a]">Founders</p>
                  <ul className="mt-4 space-y-3">
                    {founders.map((founder) => (
                      <li key={founder.name}>
                        <p className="text-[14px] leading-snug text-[#5f6b7a]">
                          <span className="block text-[#0a0a0a]">{founder.role}</span>
                          {founder.name}
                        </p>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-[#e8ebf0]">
        <div className="mx-auto max-w-[1200px] px-6 py-4">
          <p className="text-center text-[12px] leading-relaxed text-[#8b95a5] sm:text-left">
            {LEGAL.aiDisclaimerShort}{" "}
            <a
              href={LEGAL.aiDisclaimerLearnMorePath}
              className="font-medium text-[#4A90E2] underline decoration-[#4A90E2]/40 underline-offset-2 transition-colors hover:decoration-[#4A90E2]"
            >
              Learn More
            </a>
          </p>
        </div>
        <div className="mx-auto flex max-w-[1200px] flex-col gap-2 border-t border-[#e8ebf0] px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[13px] text-[#8b95a5]">
            © {new Date().getFullYear()} Landed. All rights reserved.
          </p>
          <CookieSettingsLink className="text-left text-[13px] text-[#5f6b7a] transition-colors hover:text-[#0a0a0a] sm:text-right" />
        </div>
      </div>
    </footer>
  );
}
