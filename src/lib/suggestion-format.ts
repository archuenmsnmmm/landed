/** Strip bulky meta labels the model sometimes adds despite prompt rules. */
export function sanitizeSuggestionOutput(text: string): string {
  let out = text.trim();
  if (!out) return out;

  const dropLinePatterns = [
    /^direct,?\s*concise\s*answer:?\s*$/i,
    /^suggestion:?\s*$/i,
    /^response:?\s*$/i,
    /^here(?:'s| is)(?: the| a| your)?(?: answer| suggestion| response)?:?\s*$/i,
  ];

  const lines = out.split("\n");
  const kept = lines.filter((line) => {
    const t = line.trim();
    if (!t) return true;
    return !dropLinePatterns.some((re) => re.test(t));
  });
  out = kept.join("\n").trim();

  out = out.replace(
    /^(?:direct,?\s*concise\s*answer|suggestion|response|here(?:'s| is)(?: the| a| your)?(?: answer| suggestion| response)?):\s*/i,
    "",
  );

  return out.trim();
}
