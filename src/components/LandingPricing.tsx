"use client";

import { DownloadLink } from "@/components/DownloadLink";
import { formatPrice, priceForInterval, priceForLifetime } from "@/lib/pricing";
import { useRegionalPricing } from "@/hooks/useRegionalPricing";

const FREE_FEATURES = [
  "Download and explore the app",
  "Ask about the problem on your screen",
  "No microphone required",
  "Works over any technical interview app",
  "Subscribe to unlock unlimited AI",
] as const;

const PRO_FEATURES = [
  "Unlimited AI questions",
  "Stronger coding model",
  "Invisible overlay on screen share",
  "Support for coding, system design, and more",
] as const;

const LIFETIME_FEATURES = [
  "Unlimited lifetime access",
  "Stronger coding model",
  "Invisible overlay on screen share",
  "Support for coding, system design, and more",
] as const;

function CheckIcon({ accent }: { accent?: boolean }) {
  return (
    <span
      className={`mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border ${
        accent ? "border-[#F5C518]/60" : "border-zinc-300"
      }`}
    >
      <svg
        className={`h-2.5 w-2.5 ${accent ? "text-[#F5C518]" : "text-zinc-400"}`}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={3}
        aria-hidden
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
      </svg>
    </span>
  );
}

function ChevronDownIcon({ onDark }: { onDark?: boolean }) {
  return (
    <span
      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
        onDark ? "bg-white/20" : "bg-black/10"
      }`}
    >
      <svg
        className="h-3 w-3"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2.5}
        aria-hidden
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" />
      </svg>
    </span>
  );
}

function LockIcon() {
  return (
    <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V8a4 4 0 018 0v3" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </svg>
  );
}

function CardIcon() {
  return (
    <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <path d="M2 10h20" />
    </svg>
  );
}

function FeatureList({
  features,
  accent,
}: {
  features: readonly string[];
  accent?: boolean;
}) {
  return (
    <ul className="mt-8 space-y-3.5">
      {features.map((feature) => (
        <li key={feature} className="flex items-start gap-3 text-[13px] leading-snug text-zinc-600">
          <CheckIcon accent={accent} />
          <span>{feature}</span>
        </li>
      ))}
    </ul>
  );
}

const ctaBase =
  "mt-6 inline-flex h-12 w-full items-center justify-center gap-2.5 rounded-full text-[14px] font-semibold transition-opacity hover:opacity-90";

const cardBase =
  "flex flex-col rounded-[22px] border border-zinc-200/80 bg-white p-7 shadow-[0_8px_30px_rgba(15,23,42,0.06)] md:p-8";

export function LandingPricing() {
  const currency = useRegionalPricing();
  const { current: monthlyPrice } = priceForInterval("pro", "monthly", currency);
  const lifetime = priceForLifetime(currency);
  const freePrice = formatPrice(0, currency);

  return (
    <section id="pricing" className="border-t border-[#f0f0f2] bg-[#f7f8fa] text-[#0a0a0a]">
      <div className="mx-auto max-w-[1200px] px-6 py-24 md:py-32">
        <h2 className="max-w-[640px] text-[2rem] font-semibold leading-[1.15] tracking-[-0.03em] text-[#0a0a0a] md:text-[2.75rem]">
          Simple and transparent pricing that works for you
        </h2>

        <div className="mt-14 grid gap-5 lg:grid-cols-3">
          <div className={cardBase}>
            <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-zinc-500">
              Free download
            </p>
            <div className="mt-5 flex items-baseline gap-1.5">
              <span className="text-[42px] font-semibold leading-none tracking-[-0.03em] text-[#0a0a0a]">
                {freePrice}
              </span>
              <span className="font-mono text-[12px] uppercase tracking-[0.08em] text-zinc-500">
                /forever
              </span>
            </div>
            <p className="mt-3 text-[13px] text-zinc-500">Get started today</p>

            <DownloadLink hideIcon className={`${ctaBase} bg-zinc-900 text-white`}>
              <ChevronDownIcon onDark />
              Get Started
            </DownloadLink>

            <p className="mt-4 flex items-center justify-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-zinc-400">
              <CardIcon />
              No credit card required
            </p>

            <FeatureList features={FREE_FEATURES} />
          </div>

          <div className={cardBase}>
            <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-zinc-500">
              Monthly Pro
            </p>
            <div className="mt-5 flex items-baseline gap-1.5">
              <span className="text-[42px] font-semibold leading-none tracking-[-0.03em] text-[#0a0a0a]">
                {monthlyPrice}
              </span>
              <span className="font-mono text-[12px] uppercase tracking-[0.08em] text-zinc-500">
                /month
              </span>
            </div>
            <p className="mt-3 text-[13px] text-zinc-500">Unlimited technical interview assist</p>

            <DownloadLink hideIcon className={`${ctaBase} bg-[#F5C518] text-black`}>
              <ChevronDownIcon />
              Subscribe
            </DownloadLink>

            <p className="mt-4 flex items-center justify-center gap-3 font-mono text-[10px] uppercase tracking-[0.12em] text-zinc-400">
              <span className="inline-flex items-center gap-1.5">
                <LockIcon />
                Secure checkout
              </span>
              <span className="text-zinc-300">|</span>
              <span className="inline-flex items-center gap-1.5">
                <CalendarIcon />
                Cancel anytime
              </span>
            </p>

            <FeatureList features={PRO_FEATURES} accent />
          </div>

          <div className={`${cardBase} border-[#F5C518] shadow-[0_8px_30px_rgba(245,197,24,0.12)]`}>
            <p className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.14em] text-[#C9A012]">
              <span className="flex h-[18px] w-[18px] items-center justify-center rounded-full border border-[#F5C518]">
                <svg className="h-2.5 w-2.5 text-[#F5C518]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              </span>
              Lifetime Pro
            </p>
            <div className="mt-5 flex items-baseline gap-1.5">
              <span className="text-[42px] font-semibold leading-none tracking-[-0.03em] text-[#C9A012]">
                {lifetime.current}
              </span>
              <span className="font-mono text-[12px] uppercase tracking-[0.08em] text-[#C9A012]">
                /one-time
              </span>
            </div>
            <p className="mt-3 text-[13px] text-zinc-500">
              Original price: {lifetime.original}
            </p>

            <DownloadLink hideIcon className={`${ctaBase} bg-[#F5C518] text-black`}>
              <ChevronDownIcon />
              Buy now
            </DownloadLink>

            <p className="mt-4 flex items-center justify-center gap-3 font-mono text-[10px] uppercase tracking-[0.12em] text-zinc-400">
              <span className="inline-flex items-center gap-1.5">
                <LockIcon />
                Secure checkout
              </span>
              <span className="text-zinc-300">|</span>
              <span className="inline-flex items-center gap-1.5">
                <CalendarIcon />
                Pay once
              </span>
            </p>

            <FeatureList features={LIFETIME_FEATURES} accent />
          </div>
        </div>
      </div>
    </section>
  );
}
