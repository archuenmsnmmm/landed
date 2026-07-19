import {
  STRIPE_WEBHOOK_EVENTS,
  STRIPE_WEBHOOK_PATH,
  stripeLifetimePriceId,
  stripeLifetimeProductId,
  stripeProAnnualPriceId,
  stripeProAnnualProductId,
  stripeProMonthlyPriceId,
  stripeProMonthlyProductId,
  stripePublishableKey,
  stripeWebhookUrl,
} from "@/lib/stripe-ids";
import { getSupabaseConfigStatus } from "@/lib/supabase-config";

export type StripeConfigStatus = {
  stripe: boolean;
  webhook: boolean;
  publishableKey: boolean;
  supabaseAdmin: boolean;
  supabaseProjectMatch: boolean;
  catalog: {
    monthly: { productId: string; priceId: string };
    annual: { productId: string; priceId: string };
    lifetime: { productId: string; priceId: string };
  };
  webhookPath: string;
  webhookEvents: readonly string[];
  pricesConfigured: {
    pro: { monthly: boolean; annual: boolean };
    lifetime: boolean;
  };
  productsConfigured: {
    pro: { monthly: boolean; annual: boolean };
    lifetime: boolean;
  };
  checkoutReady: boolean;
  webhooksReady: boolean;
  webhookUrl: string | null;
  issues: string[];
};

export function getStripeConfigStatus(): StripeConfigStatus {
  const secretKey = process.env.STRIPE_SECRET_KEY?.trim();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  const proMonthlyPrice = stripeProMonthlyPriceId();
  const proAnnualPrice = stripeProAnnualPriceId();
  const lifetimePrice = stripeLifetimePriceId();
  const proMonthlyProduct = stripeProMonthlyProductId();
  const proAnnualProduct = stripeProAnnualProductId();
  const lifetimeProduct = stripeLifetimeProductId();
  const publishableKey = stripePublishableKey();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();
  const supabase = getSupabaseConfigStatus();

  const pricesConfigured = {
    pro: {
      monthly: Boolean(proMonthlyPrice),
      annual: Boolean(proAnnualPrice),
    },
    lifetime: Boolean(lifetimePrice),
  };

  const productsConfigured = {
    pro: {
      monthly: Boolean(proMonthlyProduct),
      annual: Boolean(proAnnualProduct),
    },
    lifetime: Boolean(lifetimeProduct),
  };

  const issues: string[] = [];
  if (!secretKey) issues.push("STRIPE_SECRET_KEY is missing");
  if (!webhookSecret) issues.push("STRIPE_WEBHOOK_SECRET is missing");
  if (!proMonthlyPrice) issues.push("STRIPE_PRICE_PRO is missing");
  if (!proAnnualPrice) issues.push("STRIPE_PRICE_PRO_ANNUAL is missing");
  if (!lifetimePrice) issues.push("STRIPE_PRICE_LIFETIME is missing");
  if (!proMonthlyProduct) {
    issues.push("STRIPE_PRODUCT_PRO_MONTHLY (or STRIPE_PRODUCT_PRO) is missing");
  }
  if (!proAnnualProduct) issues.push("STRIPE_PRODUCT_PRO_ANNUAL is missing");
  if (!lifetimeProduct) issues.push("STRIPE_PRODUCT_LIFETIME is missing");
  if (!supabase.url) issues.push("SUPABASE_URL is missing");
  if (!supabase.serviceRoleKey) issues.push("SUPABASE_SERVICE_ROLE_KEY is missing");
  if (supabase.serviceRoleKey && supabase.anonKey && !supabase.projectMatch) {
    issues.push(
      "Supabase service role key does not match SUPABASE_URL / anon key project (billing webhooks will fail)",
    );
  }

  const supabaseAdmin = Boolean(supabase.url && supabase.serviceRoleKey && supabase.projectMatch);

  return {
    stripe: Boolean(secretKey),
    webhook: Boolean(webhookSecret),
    publishableKey: Boolean(publishableKey),
    supabaseAdmin,
    supabaseProjectMatch: supabase.projectMatch,
    catalog: {
      monthly: {
        productId: proMonthlyProduct,
        priceId: proMonthlyPrice,
      },
      annual: {
        productId: proAnnualProduct,
        priceId: proAnnualPrice,
      },
      lifetime: {
        productId: lifetimeProduct,
        priceId: lifetimePrice,
      },
    },
    webhookPath: STRIPE_WEBHOOK_PATH,
    webhookEvents: STRIPE_WEBHOOK_EVENTS,
    pricesConfigured,
    productsConfigured,
    checkoutReady: Boolean(
      secretKey && proMonthlyPrice && proAnnualPrice && lifetimePrice,
    ),
    webhooksReady: Boolean(secretKey && webhookSecret && supabaseAdmin),
    webhookUrl: appUrl ? stripeWebhookUrl(appUrl) : null,
    issues,
  };
}
