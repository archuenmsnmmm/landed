import type Stripe from "stripe";

/** Resolve subscription ID across Stripe API versions. */
export function subscriptionIdFromInvoice(invoice: Stripe.Invoice): string | null {
  const legacy = (
    invoice as Stripe.Invoice & {
      subscription?: string | Stripe.Subscription | null;
    }
  ).subscription;
  if (typeof legacy === "string") return legacy;
  if (legacy && typeof legacy === "object" && "id" in legacy) return legacy.id;

  const parent = (
    invoice as {
      parent?: {
        subscription_details?: {
          subscription?: string | { id?: string } | null;
        } | null;
      } | null;
    }
  ).parent;
  const nested = parent?.subscription_details?.subscription;
  if (typeof nested === "string") return nested;
  if (nested && typeof nested === "object" && nested.id) return nested.id;

  const lineSub = invoice.lines?.data?.[0]?.subscription;
  if (typeof lineSub === "string") return lineSub;
  if (lineSub && typeof lineSub === "object" && "id" in lineSub) return lineSub.id ?? null;

  return null;
}
