/** Rewrite landed:// billing callbacks to the web success page Stripe can redirect to. */
export function normalizeBillingReturnUrl(
  url: string | undefined,
  origin: string,
  defaults: { plan?: string; to?: string },
): string {
  const fallbackParams = new URLSearchParams();
  if (defaults.plan) fallbackParams.set("plan", defaults.plan);
  fallbackParams.set("to", defaults.to ?? "billing");
  fallbackParams.set("session_id", "{CHECKOUT_SESSION_ID}");
  const fallback = `${origin}/billing/success?${fallbackParams}`;

  const raw = url?.trim();
  if (!raw) return fallback;

  const ensureSessionId = (params: URLSearchParams) => {
    if (!params.has("session_id")) {
      params.set("session_id", "{CHECKOUT_SESSION_ID}");
    }
  };

  if (!raw.startsWith("landed://")) {
    try {
      const parsed = new URL(raw);
      if (defaults.plan && !parsed.searchParams.has("plan")) {
        parsed.searchParams.set("plan", defaults.plan);
      }
      if (!parsed.searchParams.has("to")) {
        parsed.searchParams.set("to", defaults.to ?? "billing");
      }
      ensureSessionId(parsed.searchParams);
      return parsed.toString();
    } catch {
      return raw;
    }
  }

  try {
    const parsed = new URL(raw.replace(/^landed:/, "https:"));
    const params = new URLSearchParams(parsed.search);
    if (defaults.plan && !params.has("plan")) params.set("plan", defaults.plan);
    if (!params.has("to")) params.set("to", defaults.to ?? "billing");
    ensureSessionId(params);
    return `${origin}/billing/success?${params}`;
  } catch {
    return fallback;
  }
}
