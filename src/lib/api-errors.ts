const SENSITIVE_MARKERS = [
  "OPENAI_API_KEY",
  "SUPABASE_SERVICE_ROLE",
  "STRIPE_SECRET",
  "sk-",
  "service_role",
];

export function apiErrorResponse(
  err: unknown,
  fallback: string,
): { message: string; status: number } {
  const raw = err instanceof Error ? err.message : fallback;
  const lower = raw.toLowerCase();

  if (
    lower.includes("incorrect api key") ||
    lower.includes("invalid_api_key") ||
    lower.includes("invalid api key")
  ) {
    return {
      message: "OpenAI API key is invalid or expired. Update OPENAI_API_KEY.",
      status: 503,
    };
  }

  if (lower.includes("openai_api_key is not configured")) {
    return {
      message: "OpenAI is not configured on the server.",
      status: 503,
    };
  }

  const looksSensitive = SENSITIVE_MARKERS.some((marker) =>
    lower.includes(marker.toLowerCase()),
  );

  if (looksSensitive) {
    return { message: fallback, status: 503 };
  }

  if (process.env.NODE_ENV === "production") {
    return { message: fallback, status: 500 };
  }

  return { message: raw, status: 500 };
}
