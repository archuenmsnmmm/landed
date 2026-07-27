/** Map HTTP failures to short overlay-safe messages (never include secrets or env var names). */
export function describeOpenAIHttpFailure(status: number, body = ""): string {
  const lower = body.toLowerCase();

  if (status === 401 || lower.includes("incorrect api key") || lower.includes("invalid_api_key")) {
    return "AI service authentication failed. Please try again later or contact support.";
  }
  if (status === 429 || lower.includes("rate_limit")) {
    return "AI service is busy. Wait a moment and try again.";
  }
  if (status === 402) {
    return "Free questions used up. Upgrade to continue.";
  }
  if (
    status === 503 &&
    /openai/i.test(lower) &&
    /not configured|missing/i.test(lower)
  ) {
    return "AI service is temporarily unavailable. Please try again later.";
  }
  if (status >= 500) {
    return "AI service error. Try again in a moment.";
  }
  return "Couldn't reach the AI service. Check your connection.";
}

export function describeAiRouteFailure(status: number, body = ""): string {
  let parsedError = "";
  try {
    const json = JSON.parse(body) as { error?: string };
    parsedError = json.error ?? "";
  } catch {
    parsedError = body;
  }

  if (status === 402) {
    return parsedError || "Free questions used up. Upgrade to continue.";
  }
  if (status === 401) {
    return "Session expired. Sign out and sign back in.";
  }

  const combined = `${parsedError}\n${body}`;
  if (
    status === 503 &&
    /openai.*not configured|not configured.*openai|openai_api_key is not configured/i.test(
      combined,
    )
  ) {
    return "AI service is temporarily unavailable. Please try again later.";
  }
  if (/incorrect api key|invalid_api_key/i.test(combined)) {
    return "AI service authentication failed. Please try again later or contact support.";
  }
  if (status === 503 && /not configured/i.test(parsedError)) {
    return "A server service is temporarily unavailable. Try again later.";
  }

  return describeOpenAIHttpFailure(status, combined);
}
