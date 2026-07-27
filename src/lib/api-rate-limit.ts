import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export type RateLimitOptions = {
  /** Unique key — use authenticated user id scopes, e.g. `ai:assist:${userId}`. */
  key: string;
  limit: number;
  windowMs: number;
};

type RateLimitRpcRow = {
  allowed: boolean;
  retry_after_seconds: number;
};

/**
 * Distributed rate limit backed by Supabase (works across Vercel instances).
 * Fails open if Supabase is unavailable so requests are not blocked by infra gaps.
 */
export async function rateLimit(
  options: RateLimitOptions,
): Promise<NextResponse | null> {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    console.warn("[rate-limit] Supabase admin unavailable — skipping limit check");
    return null;
  }

  const windowSeconds = Math.max(1, Math.ceil(options.windowMs / 1000));
  const { data, error } = await supabase.rpc("check_rate_limit", {
    p_rate_key: options.key,
    p_limit: options.limit,
    p_window_seconds: windowSeconds,
  });

  if (error) {
    console.error("[rate-limit] check_rate_limit failed:", error);
    return null;
  }

  const row = (Array.isArray(data) ? data[0] : data) as
    | RateLimitRpcRow
    | undefined;

  if (!row || row.allowed) return null;

  const retryAfter = Math.max(1, row.retry_after_seconds ?? windowSeconds);
  return NextResponse.json(
    { error: "Too many requests. Please try again shortly." },
    {
      status: 429,
      headers: { "Retry-After": String(retryAfter) },
    },
  );
}
