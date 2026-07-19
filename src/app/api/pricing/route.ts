import { NextResponse } from "next/server";
import { currencyFromRequestHeaders } from "@/lib/detect-region";
import {
  formatPrice,
  getAnnualDiscountPercent,
  paidPlanPricing,
  priceForInterval,
  priceForLifetime,
  regionalPricingSnapshot,
} from "@/lib/pricing";
import { lifetimePricing } from "@/lib/regional-pricing";

export async function GET(request: Request) {
  const currency = currencyFromRequestHeaders(new Headers(request.headers));
  const pricing = paidPlanPricing(currency);
  const monthly = priceForInterval("pro", "monthly", currency);
  const annual = priceForInterval("pro", "annual", currency);
  const lifetime = priceForLifetime(currency);
  const lifetimeAmounts = lifetimePricing(currency);

  return NextResponse.json({
    ...regionalPricingSnapshot(currency),
    pro: {
      monthly: {
        amount: pricing.monthly,
        formatted: monthly.current,
      },
      annual: {
        yearlyAmount: pricing.annualYearly,
        monthlyEquivalent: pricing.annualYearly / 12,
        formattedMonthly: annual.current,
        formattedYearly: formatPrice(pricing.annualYearly, currency),
        formattedOriginalMonthly: annual.original,
      },
      annualDiscountPercent: getAnnualDiscountPercent(currency),
    },
    lifetime: {
      amount: lifetimeAmounts.current,
      originalAmount: lifetimeAmounts.original,
      formatted: lifetime.current,
      formattedOriginal: lifetime.original,
      discountPercent: lifetime.discountPercent,
    },
  });
}
