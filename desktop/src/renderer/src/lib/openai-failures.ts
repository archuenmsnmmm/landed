/** Map HTTP failures to short overlay-safe messages (never include secrets). */
export function describeOpenAIHttpFailure(status: number, body = ""): string {
  const lower = body.toLowerCase();

  if (status === 401 || lower.includes("incorrect api key") || lower.includes("invalid_api_key")) {
    return "OpenAI API key is invalid or expired. Update OPENAI_API_KEY and rebuild.";
  }
  if (status === 429 || lower.includes("rate_limit")) {
    return "OpenAI rate limit hit. Wait a moment and try again.";
  }
  if (status === 402) {
    return "Free questions used up. Upgrade to continue.";
  }
  if (
    status === 503 &&
    /openai/i.test(lower) &&
    /not configured|missing/i.test(lower)
  ) {
    return "AI service is not configured on the server (missing OPENAI_API_KEY).";
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
    return "AI service is not configured on the server (missing OPENAI_API_KEY).";
  }
  if (/incorrect api key|invalid_api_key/i.test(combined)) {
    return "OpenAI API key is invalid or expired. Update OPENAI_API_KEY on Vercel.";
  }
  if (status === 503 && /not configured/i.test(parsedError)) {
    return parsedError || "A server service is not configured. Try again later.";
  }

  return describeOpenAIHttpFailure(status, combined);
}
