"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

export function BillingSuccessRedirect() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const params = new URLSearchParams();
    const plan = searchParams.get("plan");
    const to = searchParams.get("to");
    const sessionId = searchParams.get("session_id");
    if (plan) params.set("plan", plan);
    if (to) params.set("to", to);
    if (sessionId && sessionId !== "{CHECKOUT_SESSION_ID}") {
      params.set("session_id", sessionId);
    }
    if (!params.has("to")) params.set("to", "billing");

    window.location.replace(`landed://billing/success?${params}`);
  }, [searchParams]);

  return null;
}
