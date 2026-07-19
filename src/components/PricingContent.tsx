"use client";

import { useEffect, useState } from "react";
import { DownloadLink } from "@/components/DownloadLink";
import {
  getDownloadInfo,
  isWindowsDownloadAvailable,
} from "@/lib/download";
import {
  priceForInterval,
  priceForLifetime,
  type BillingInterval,
} from "@/lib/pricing";
import { useRegionalPricing } from "@/hooks/useRegionalPricing";
import { detectDownloadPlatform, type DownloadPlatform } from "@/lib/platform";

const STARTER_FEATURES = [
  "15 AI questions",
  "Ask about the problem on your screen",
  "No microphone required",
  "Works over any technical interview app",
];

const PRO_FEATURES = [
  "Unlimited AI questions",
  "Stronger coding model",
  "Invisible overlay on screen share",
  "24/7 support",
  "Everything in Starter",
];

const LIFETIME_FEATURES = [
  "Unlimited AI questions",
  "Stronger coding model",
  "Invisible overlay on screen share",
  "24/7 support",
  "Pay once, access forever",
  "Everything in Pro",
];

const CARD_CLASS =
  "flex h-full min-h-[460px] w-full flex-col rounded-[24px] border border-white/80 bg-white p-8 shadow-[0_8px_40px_rgba(15,23,42,0.08)]";

const LIFETIME_CARD_CLASS =
  "flex h-full min-h-[460px] w-full flex-col rounded-[24px] bg-gradient-to-b from-[#4d9aff] to-[#3b82f6] p-8 shadow-[0_20px_50px_rgba(59,130,246,0.18)]";

const PRIMARY_BUTTON_CLASS =
  "mt-5 flex h-11 w-full items-center justify-center rounded-xl bg-[#1a1a1a] text-[14px] font-medium text-white transition-colors hover:bg-[#2a2a2a]";

const LIFETIME_BUTTON_CLASS =
  "mt-5 flex h-11 w-full items-center justify-center rounded-xl bg-white text-[14px] font-medium text-zinc-900 transition-colors hover:bg-white/95";

function CheckIcon({ tone = "blue" }: { tone?: "blue" | "light" }) {
  return (
    <svg
      className={`mt-0.5 h-4 w-4 shrink-0 ${
        tone === "light" ? "text-white/80" : "text-[#4A90E2]"
      }`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
  );
}

function FeatureList({
  features,
  includesLabel,
  tone = "dark",
}: {
  features: string[];
  includesLabel?: string;
  tone?: "dark" | "light";
}) {
  const isLight = tone === "light";
  return (
    <>
      <div className={`my-5 h-px ${isLight ? "bg-white/10" : "bg-zinc-100"}`} />
      <ul className="space-y-2.5">
        {includesLabel ? (
          <li
            className={`text-[13px] font-semibold ${
              isLight ? "text-white" : "text-zinc-900"
            }`}
          >
            {includesLabel}
          </li>
        ) : null}
        {features.map((feature) => (
          <li
            key={feature}
            className={`flex gap-2.5 text-[13px] leading-snug ${
              isLight ? "text-white/85" : "text-zinc-700"
            }`}
          >
            <CheckIcon tone={isLight ? "light" : "blue"} />
            <span>{feature}</span>
          </li>
        ))}
      </ul>
    </>
  );
}

function BillingToggle({
  interval,
  onChange,
}: {
  interval: BillingInterval;
  onChange: (interval: BillingInterval) => void;
}) {
  const isMonthly = interval === "monthly";

  return (
    <div className="inline-flex items-center gap-3">
      <button
        type="button"
        onClick={() => onChange("monthly")}
        className={`text-[14px] transition-colors ${
          isMonthly ? "font-semibold text-zinc-900" : "font-medium text-zinc-400"
        }`}
      >
        Monthly
      </button>

      <button
        type="button"
        role="switch"
        aria-checked={!isMonthly}
        aria-label="Toggle annual billing"
        onClick={() => onChange(isMonthly ? "annual" : "monthly")}
        className="relative h-7 w-12 rounded-full bg-white shadow-[inset_0_0_0_1px_rgba(0,0,0,0.06)]"
      >
        <span
          className={`absolute top-1 h-5 w-5 rounded-full bg-[#3f3f46] shadow-sm transition-transform ${
            isMonthly ? "left-1" : "left-6"
          }`}
        />
      </button>

      <button
        type="button"
        onClick={() => onChange("annual")}
        className={`text-[14px] transition-colors ${
          !isMonthly ? "font-semibold text-zinc-900" : "font-medium text-zinc-400"
        }`}
      >
        Annually
      </button>
    </div>
  );
}

export function PricingContent() {
  const [interval, setInterval] = useState<BillingInterval>("monthly");
  const currency = useRegionalPricing();
  const [platform, setPlatform] = useState<DownloadPlatform>("mac");
  const { current, original } = priceForInterval("pro", interval, currency);
  const lifetime = priceForLifetime(currency);
  const effectivePlatform =
    platform === "windows" && !isWindowsDownloadAvailable() ? "mac" : platform;
  const downloadLabel = getDownloadInfo(effectivePlatform).label;

  useEffect(() => {
    setPlatform(detectDownloadPlatform());
  }, []);

  return (
    <div className="flex w-full flex-col items-center">
      <p className="text-[13px] font-semibold tracking-[0.04em] text-zinc-500">
        Landed
      </p>
      <h1 className="mt-3 text-center text-[2.5rem] font-semibold leading-[1.1] tracking-[-0.03em] text-zinc-900 md:text-[3rem]">
        Pricing
      </h1>
      <p className="mt-4 max-w-[520px] text-center text-[15px] leading-relaxed text-zinc-500">
        Invisible AI for technical interviews. Free to start — Pro or Lifetime when you need unlimited and screen-share hide.
      </p>

      <div className="mt-8">
        <BillingToggle interval={interval} onChange={setInterval} />
      </div>
      <p className="mt-3 text-center text-[12px] text-zinc-400">
        Toggle applies to Pro. Lifetime is a one-time purchase in the desktop app.
      </p>

      <div className="mt-10 flex w-full max-w-[1080px] flex-col items-stretch gap-5 lg:flex-row">
        <div className="flex min-w-0 flex-1">
          <div className={CARD_CLASS}>
            <h3 className="text-[15px] font-semibold text-zinc-900">Starter</h3>
            <div className="mt-3">
              <span className="text-[36px] font-semibold leading-none tracking-[-0.03em] text-zinc-900">
                Free
              </span>
            </div>
            <DownloadLink className={PRIMARY_BUTTON_CLASS}>{downloadLabel}</DownloadLink>
            <p className="mt-4 text-[13px] text-zinc-500">Try asking about a problem on your screen.</p>
            <FeatureList features={STARTER_FEATURES} />
          </div>
        </div>

        <div className="flex min-w-0 flex-1">
          <div className={CARD_CLASS}>
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-[15px] font-semibold text-zinc-900">Pro</h3>
              <span className="shrink-0 rounded-full bg-zinc-100 px-2.5 py-1 text-[11px] font-semibold text-zinc-600">
                Most popular
              </span>
            </div>
            <div className="mt-3 flex items-baseline gap-1">
              {original ? (
                <span className="text-[15px] text-zinc-400 line-through">{original}</span>
              ) : null}
              <span className="text-[36px] font-semibold leading-none tracking-[-0.03em] text-zinc-900">
                {current}
              </span>
              <span className="text-[14px] text-zinc-500">/ month</span>
            </div>
            <DownloadLink className={PRIMARY_BUTTON_CLASS}>Download to subscribe</DownloadLink>
            <p className="mt-4 text-[13px] text-zinc-500">Unlimited technical interview assist — invisible on share.</p>
            <FeatureList
              features={PRO_FEATURES}
              includesLabel="Everything in Starter, plus..."
            />
          </div>
        </div>

        <div className="flex min-w-0 flex-1">
          <div className={LIFETIME_CARD_CLASS}>
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-[15px] font-semibold text-white">Lifetime</h3>
              <span className="shrink-0 rounded-full bg-white/20 px-2.5 py-1 text-[11px] font-semibold text-white">
                Best value · -{lifetime.discountPercent}%
              </span>
            </div>
            <div className="mt-3 flex items-baseline gap-1">
              <span className="text-[15px] text-white/50 line-through">{lifetime.original}</span>
              <span className="text-[36px] font-semibold leading-none tracking-[-0.03em] text-white">
                {lifetime.current}
              </span>
              <span className="text-[14px] text-white/70">once</span>
            </div>
            <DownloadLink className={LIFETIME_BUTTON_CLASS}>Download for Lifetime</DownloadLink>
            <p className="mt-4 text-[13px] text-white/70">Pay once. Unlimited technical interview AI forever.</p>
            <FeatureList
              features={LIFETIME_FEATURES}
              includesLabel="Everything in Pro, plus..."
              tone="light"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
