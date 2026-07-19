import type { Plan } from "../store/types";
import {
  annualDiscountPercent,
  formatRegionalPrice,
  lifetimeDiscountPercent,
  lifetimePricing,
  regionalPricingSnapshot,
  type BillingCurrency,
  REGIONAL_PRO_PRICING,
} from "./regional-pricing";

export type { BillingCurrency } from "./regional-pricing";

/** Public pricing tiers — single source of truth for paywall & settings. */
export type PricingTierId = "free" | "pro" | "lifetime";

export type BillingInterval = "monthly" | "annual";

export interface PaidPlanPricing {
  monthly: number;
  /** Total billed once per year on annual plans. */
  annualYearly: number;
}

export const DEFAULT_BILLING_CURRENCY: BillingCurrency = "gbp";

export function paidPlanPricing(currency: BillingCurrency = DEFAULT_BILLING_CURRENCY): PaidPlanPricing {
  return REGIONAL_PRO_PRICING[currency];
}

export function getAnnualDiscountPercent(currency: BillingCurrency = DEFAULT_BILLING_CURRENCY): number {
  return annualDiscountPercent(currency);
}

export const ANNUAL_DISCOUNT_PERCENT = getAnnualDiscountPercent("gbp");

export function formatPrice(
  amount: number,
  currency: BillingCurrency = DEFAULT_BILLING_CURRENCY,
): string {
  return formatRegionalPrice(amount, currency);
}

export function priceForInterval(
  plan: "pro",
  interval: BillingInterval,
  currency: BillingCurrency = DEFAULT_BILLING_CURRENCY,
): { current: string; original?: string } {
  const pricing = paidPlanPricing(currency);
  if (interval === "annual") {
    return {
      current: formatPrice(pricing.annualYearly / 12, currency),
      original: formatPrice(pricing.monthly, currency),
    };
  }
  return { current: formatPrice(pricing.monthly, currency) };
}

export function priceForLifetime(
  currency: BillingCurrency = DEFAULT_BILLING_CURRENCY,
): { current: string; original: string; discountPercent: number } {
  const pricing = lifetimePricing(currency);
  return {
    current: formatPrice(pricing.current, currency),
    original: formatPrice(pricing.original, currency),
    discountPercent: lifetimeDiscountPercent(currency),
  };
}

export function proPriceLabel(currency: BillingCurrency = DEFAULT_BILLING_CURRENCY): string {
  return formatPrice(paidPlanPricing(currency).monthly, currency);
}

export const STARTER_FEATURES = [
  "15 AI questions",
  "Ask about the problem on your screen",
  "No microphone required",
  "Works over any technical interview app",
] as const;

export const PRO_FEATURES = [
  "Unlimited AI questions",
  "Stronger coding model",
  "Invisible overlay on screen share",
  "24/7 support",
  "Everything in Starter",
] as const;

export const LIFETIME_FEATURES = [
  "Unlimited AI questions",
  "Stronger coding model",
  "Invisible overlay on screen share",
  "24/7 support",
  "Pay once, access forever",
  "Everything in Pro",
] as const;

export type ProFeatureIcon = "infinity" | "check";

/** Starter plan card — icon mapping for the free billing card. */
export const STARTER_CARD_FEATURES: { icon: "check"; label: string }[] = [
  { icon: "check", label: "15 AI questions" },
  { icon: "check", label: "Ask about the problem on your screen" },
  { icon: "check", label: "No microphone required" },
  { icon: "check", label: "Works over any technical interview app" },
];

/** Pro plan card — icon mapping for the highlighted billing card. */
export const PRO_CARD_FEATURES: { icon: ProFeatureIcon; label: string }[] = [
  { icon: "infinity", label: "Unlimited AI questions" },
  { icon: "check", label: "Stronger coding model" },
  { icon: "check", label: "Invisible overlay on screen share" },
  { icon: "check", label: "24/7 support" },
  { icon: "check", label: "Everything in Starter" },
];

/** Lifetime plan card — same Pro perks plus one-time ownership. */
export const LIFETIME_CARD_FEATURES: { icon: ProFeatureIcon; label: string }[] = [
  { icon: "infinity", label: "Unlimited AI questions" },
  { icon: "check", label: "Stronger coding model" },
  { icon: "check", label: "Invisible overlay on screen share" },
  { icon: "check", label: "24/7 support" },
  { icon: "check", label: "Pay once, access forever" },
  { icon: "check", label: "Everything in Pro" },
];

export interface PricingTier {
  id: PricingTierId;
  name: string;
  priceLabel: string;
  priceSuffix?: string;
  tagline: string;
  cta: string;
  features: string[];
  includesLabel?: string;
}

export function buildPricingTiers(currency: BillingCurrency = DEFAULT_BILLING_CURRENCY): PricingTier[] {
  const lifetime = priceForLifetime(currency);
  return [
    {
      id: "free",
      name: "Starter",
      priceLabel: "Free",
      tagline: "Try asking about a problem on your screen.",
      cta: "Continue free",
      features: [...STARTER_FEATURES],
    },
    {
      id: "pro",
      name: "Pro",
      priceLabel: proPriceLabel(currency),
      priceSuffix: "/ month",
      tagline: "Unlimited technical interview asks + invisible on screen share.",
      cta: "Subscribe",
      includesLabel: "Everything in Starter, plus...",
      features: [...PRO_FEATURES],
    },
    {
      id: "lifetime",
      name: "Lifetime",
      priceLabel: lifetime.current,
      tagline: "Pay once. Unlimited technical interview AI forever.",
      cta: "Get Lifetime",
      includesLabel: "Everything in Pro, plus...",
      features: [...LIFETIME_FEATURES],
    },
  ];
}

export const PRICING_TIERS = buildPricingTiers();

const PLAN_RANK: Record<Plan, number> = {
  free: 0,
  solo: 1,
  pro: 2,
  undetectable: 2,
  lifetime: 3,
};

export function planRank(plan: Plan): number {
  return PLAN_RANK[plan] ?? 0;
}

export function normalizeDisplayPlan(plan: Plan): PricingTierId {
  if (plan === "lifetime") return "lifetime";
  if (plan === "pro" || plan === "solo" || plan === "undetectable") return "pro";
  return "free";
}

export function displayPlanLabel(plan: Plan): string {
  const tier = PRICING_TIERS.find((t) => t.id === normalizeDisplayPlan(plan));
  return tier?.name ?? "Starter";
}

export function canUpgradeTo(target: PricingTierId, current: Plan): boolean {
  const targetPlan: Plan = target === "free" ? "free" : target;
  return planRank(targetPlan) > planRank(current);
}

export function pricingTierToPlan(id: PricingTierId): Plan {
  return id;
}

export { regionalPricingSnapshot, lifetimePricing, lifetimeDiscountPercent };
