import {
  getAnnualDiscountPercent,
  formatPrice,
  paidPlanPricing,
  priceForLifetime,
} from "@/lib/pricing";

export const PRICING_FAQS = [
  {
    q: "What's included in the free Starter plan?",
    a: "Starter includes 15 AI questions on gpt-4o-mini so you can try Landed in a practice round or real technical interview — ask about what’s on your screen. No credit card required.",
  },
  {
    q: "What's included in Pro?",
    a: "Pro unlocks unlimited AI questions, a stronger coding model (gpt-4.1-mini), invisible overlay on screen share, 24/7 support, and everything in Starter.",
  },
  {
    q: "What's included in Lifetime?",
    a: "Lifetime includes everything in Pro — unlimited technical interview overlay, invisible on screen share, and 24/7 support — for a one-time payment. No renewals.",
  },
  {
    q: "How does annual billing work?",
    a: "Pay annually and save about 30% compared to monthly billing. Prices are shown in GBP (£). Choose monthly or annual billing for Pro at checkout. Lifetime is always a one-time purchase.",
  },
  {
    q: "Can I upgrade or downgrade my plan?",
    a: "Yes. Upgrade to Pro or Lifetime anytime from the Landed desktop app (Settings → Billing). Subscriptions and Lifetime cannot be purchased on the website. If you downgrade from Pro, you'll keep access until the end of your current billing period, then move back to Starter.",
  },
  {
    q: "What payment methods do you accept?",
    a: "We accept all major credit and debit cards through Stripe. All prices are in GBP (£).",
  },
  {
    q: "Do you offer refunds?",
    a: "If you're not satisfied within the first 14 days of a Pro subscription or Lifetime purchase, contact us at landed.support@gmail.com and we'll issue a full refund — no questions asked.",
  },
] as const;

/** Example GBP pricing strings for static marketing copy. */
export function gbpPricingExamples() {
  const pricing = paidPlanPricing("gbp");
  const lifetime = priceForLifetime("gbp");
  return {
    proMonthly: formatPrice(pricing.monthly, "gbp"),
    proAnnualMonthly: formatPrice(pricing.annualYearly / 12, "gbp"),
    proAnnualYearly: formatPrice(pricing.annualYearly, "gbp"),
    annualDiscountPercent: getAnnualDiscountPercent("gbp"),
    lifetime: lifetime.current,
    lifetimeOriginal: lifetime.original,
    lifetimeDiscountPercent: lifetime.discountPercent,
  };
}

/** @deprecated Use gbpPricingExamples */
export const usdPricingExamples = gbpPricingExamples;
