import { sanitizeSuggestionOutput } from "../../lib/suggestion-format";
import type { ContentHint } from "../../lib/suggestion-types";
import type {
  LayoutKind,
  ResponseType,
  StructuredSuggestion,
} from "./types";

export function layoutForHint(hint: ContentHint): LayoutKind {
  switch (hint) {
    case "behavioural":
      return "star";
    case "coding":
      return "code";
    case "math":
      return "math";
    case "mcq":
      return "mcq";
    case "email":
      return "email";
    case "sales":
      return "sales";
    default:
      return "general";
  }
}

export function layoutLabel(layout: LayoutKind, responseType?: ResponseType): string {
  if (responseType === "star_story") return "Answer";
  if (responseType === "technical") return "Quick answer";
  if (responseType === "sales") return "Suggested response";
  if (responseType === "negotiation") return "Response";
  if (responseType === "bullets") return "Key points";
  switch (layout) {
    case "star":
      return "Answer";
    case "code":
    case "math":
      return "Quick answer";
    case "sales":
      return "Suggested response";
    case "email":
      return "Draft";
    case "short":
      return "Say this";
    default:
      return "Answer";
  }
}

function defaultTitle(hint: ContentHint, responseType: ResponseType): string {
  return layoutLabel(layoutForHint(hint), responseType);
}

function extractBullets(text: string): string[] {
  return text
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => /^([•*\-]|\d+\.)\s+/.test(l) || /^└─/.test(l))
    .map((l) =>
      l
        .replace(/^([•*\-]|\d+\.)\s+/, "")
        .replace(/^└─\s*/, "")
        .trim(),
    )
    .filter(Boolean)
    .slice(0, 4);
}

function asString(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const t = value.trim();
  return t || undefined;
}

function asStringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const items = value
    .map((v) => (typeof v === "string" ? v.trim() : ""))
    .filter(Boolean)
    .slice(0, 4);
  return items.length ? items : undefined;
}

function asResponseType(value: unknown, hint: ContentHint): ResponseType {
  const v = typeof value === "string" ? value.trim().toLowerCase() : "";
  if (
    v === "direct_answer" ||
    v === "star_story" ||
    v === "bullets" ||
    v === "technical" ||
    v === "sales" ||
    v === "negotiation" ||
    v === "follow_up"
  ) {
    return v;
  }
  if (hint === "behavioural") return "star_story";
  if (hint === "coding" || hint === "math") return "technical";
  if (hint === "sales") return "sales";
  return "direct_answer";
}

function asPriority(value: unknown): "low" | "medium" | "high" {
  const v = typeof value === "string" ? value.trim().toLowerCase() : "";
  if (v === "low" || v === "medium" || v === "high") return v;
  return "medium";
}

function buildRawText(summary: string, bullets?: string[], followUp?: string): string {
  const parts = [summary];
  if (bullets?.length) {
    parts.push(bullets.map((b) => `• ${b}`).join("\n"));
  }
  if (followUp) {
    parts.push(`If they ask: ${followUp}`);
  }
  return parts.filter(Boolean).join("\n\n");
}

function expiresForType(responseType: ResponseType, text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  const base =
    responseType === "star_story" || responseType === "technical"
      ? 14_000
      : responseType === "sales" || responseType === "negotiation"
        ? 10_000
        : 9_000;
  return Math.min(18_000, Math.max(6_000, base + words * 120));
}

/** Try to parse the Cluely-style structured JSON payload from the model. */
export function parseStructuredSuggestionJson(
  raw: string,
  hint: ContentHint,
  fallbackConfidence = 0.8,
): StructuredSuggestion | null {
  const trimmed = raw.trim();
  if (!trimmed.startsWith("{") && !trimmed.includes("{")) return null;

  let jsonText = trimmed;
  const fence = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence?.[1]) jsonText = fence[1].trim();
  const brace = jsonText.indexOf("{");
  const last = jsonText.lastIndexOf("}");
  if (brace >= 0 && last > brace) {
    jsonText = jsonText.slice(brace, last + 1);
  }

  try {
    const data = JSON.parse(jsonText) as Record<string, unknown>;
    const summary =
      asString(data.mainResponse) ||
      asString(data.text) ||
      asString(data.response) ||
      asString(data.summary);
    if (!summary) return null;

    const shouldSuggest = data.shouldSuggest !== false;
    const responseType = asResponseType(
      data.responseType ?? data.type,
      hint,
    );
    const bullets =
      asStringArray(data.supportingPoints) ||
      asStringArray(data.bullets) ||
      asStringArray(data.keyPoints);
    const followUp =
      asString(data.followUp) ||
      asString(data.ifTheyAsk) ||
      asString(data.nextQuestion);
    const confidenceRaw =
      typeof data.confidence === "number" ? data.confidence : fallbackConfidence;
    const confidence = Math.max(0, Math.min(1, confidenceRaw));
    const expiresAfterMs =
      typeof data.expiresAfterMs === "number" && data.expiresAfterMs > 0
        ? Math.min(30_000, data.expiresAfterMs)
        : expiresForType(responseType, summary);
    const title =
      asString(data.title) || defaultTitle(hint, responseType);
    const layout =
      responseType === "star_story"
        ? "star"
        : responseType === "technical"
          ? "code"
          : responseType === "sales" || responseType === "negotiation"
            ? "sales"
            : responseType === "bullets"
              ? "bullets"
              : layoutForHint(hint);

    const cleanedSummary = sanitizeSuggestionOutput(summary);
    const cleanedBullets = bullets?.map((b) => sanitizeSuggestionOutput(b)).filter(Boolean);
    const cleanedFollowUp = followUp
      ? sanitizeSuggestionOutput(followUp)
      : undefined;

    return {
      shouldSuggest,
      priority: asPriority(data.priority ?? data.urgency),
      responseType,
      title,
      summary: cleanedSummary,
      bullets: cleanedBullets?.length ? cleanedBullets : undefined,
      followUp: cleanedFollowUp,
      confidence,
      expiresAfterMs,
      replacePrevious: data.replacePrevious !== false,
      layout,
      rawText: buildRawText(cleanedSummary, cleanedBullets, cleanedFollowUp),
    };
  } catch {
    return null;
  }
}

/**
 * Convert raw model text into a stable structured card.
 * Prefers JSON schema; falls back to heuristic plain-text shaping.
 */
export function formatStructuredSuggestion(
  raw: string,
  hint: ContentHint,
  confidence = 0.8,
): StructuredSuggestion {
  const fromJson = parseStructuredSuggestionJson(raw, hint, confidence);
  if (fromJson) return fromJson;

  const cleaned = sanitizeSuggestionOutput(raw);
  const layout = layoutForHint(hint);
  const lines = cleaned.split("\n").filter((l) => l.trim());
  const bullets = extractBullets(cleaned);
  const responseType: ResponseType =
    hint === "behavioural"
      ? "star_story"
      : hint === "coding" || hint === "math"
        ? "technical"
        : hint === "sales"
          ? "sales"
          : bullets.length >= 2
            ? "bullets"
            : "direct_answer";

  let summary = cleaned;
  if (bullets.length && lines.length) {
    const nonBullet = lines
      .filter((l) => !/^([•*\-]|\d+\.)\s+/.test(l.trim()) && !/^└─/.test(l.trim()))
      .join(" ")
      .trim();
    if (nonBullet) summary = nonBullet;
  }
  if (layout === "sales") {
    summary = cleaned.split("\n")[0]?.trim() || cleaned;
  }

  // Keep glanceable: trim long plain summaries.
  const words = summary.split(/\s+/).filter(Boolean);
  if (words.length > 55 && responseType === "direct_answer") {
    summary = `${words.slice(0, 45).join(" ")}…`;
  }

  return {
    shouldSuggest: true,
    priority: confidence >= 0.85 ? "high" : confidence >= 0.6 ? "medium" : "low",
    responseType,
    title: defaultTitle(hint, responseType),
    summary,
    bullets: bullets.length ? bullets : undefined,
    confidence: Math.max(0, Math.min(1, confidence)),
    expiresAfterMs: expiresForType(responseType, summary),
    replacePrevious: true,
    layout,
    rawText: buildRawText(summary, bullets.length ? bullets : undefined),
  };
}

/** Near-duplicate check for continuous-update suppression. */
export function suggestionsNearlyIdentical(a: string, b: string): boolean {
  const norm = (s: string) =>
    sanitizeSuggestionOutput(s)
      .toLowerCase()
      .replace(/[^\w\s]/g, "")
      .replace(/\s+/g, " ")
      .trim();
  const left = norm(a);
  const right = norm(b);
  if (!left || !right) return false;
  if (left === right) return true;
  if (left.includes(right) || right.includes(left)) {
    const shorter = Math.min(left.length, right.length);
    const longer = Math.max(left.length, right.length);
    return shorter / longer >= 0.85;
  }
  return false;
}
