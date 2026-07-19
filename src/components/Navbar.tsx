import Link from "next/link";
import { LandedLogo } from "./LandedLogo";
import { DownloadLink } from "./DownloadLink";
import { PRICING_PAGE_BG_CLASS } from "@/lib/brand";

const downloadPillClassName =
  "inline-flex h-9 items-center justify-center rounded-full bg-[#0a0a0a] px-4 text-[13px] font-medium text-white transition-colors hover:bg-[#1f1f1f]";

const navLinkClassName =
  "text-[13px] font-medium text-[#0a0a0a]/70 transition-colors hover:text-[#0a0a0a]";

export function Navbar({
  variant = "solid",
}: {
  variant?: "landing" | "solid" | "pricing";
}) {
  const isLanding = variant === "landing";
  const isPricing = variant === "pricing";

  return (
    <header
      className={
        isLanding
          ? "relative z-50 w-full"
          : isPricing
            ? `fixed top-0 z-50 w-full ${PRICING_PAGE_BG_CLASS}`
            : "fixed top-0 z-50 w-full bg-white"
      }
    >
      <div className="mx-auto flex h-[72px] max-w-[1200px] items-center gap-6 px-6">
        <Link href="/" className="flex shrink-0 items-center">
          <LandedLogo variant="wordmark" className="h-8 w-auto" priority={isLanding} />
        </Link>

        <div className="ml-auto flex items-center gap-5 md:gap-7">
          <nav className="hidden items-center gap-7 md:flex">
            <Link href="/pricing" className={navLinkClassName}>
              Pricing
            </Link>
            <Link
              href="/#comparison"
              className={`${navLinkClassName} inline-flex items-center gap-1.5`}
            >
              Proof
              <span className="rounded-full bg-[#4b8bf5] px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-white">
                New
              </span>
            </Link>
            <Link href="/help-center" className={navLinkClassName}>
              Help
            </Link>
          </nav>

          <DownloadLink size="sm" hideIcon className={downloadPillClassName}>
            Download
          </DownloadLink>
        </div>
      </div>
    </header>
  );
}
