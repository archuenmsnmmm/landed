import {
  apiFetch,
  hasAuthenticatedApiAccess,
} from "../lib/api-client";
import { describeAiRouteFailure } from "../lib/openai-failures";
import { OPENAI_LIMITS, OPENAI_MODELS, truncateTranscriptForPrompt } from "../lib/openai-config";
import { useAppStore } from "../store/useAppStore";
import { isDirectQuestion } from "./transcript";
import {
  askAboutScreen,
  ScreenAssistantError,
} from "../screen-assistant";
import { formatScreenContextBlock } from "./screen-context";
import { getLandedSuggestion } from "./landed-suggest";
import { getOpenAIKey } from "./whisper";

export type QuickAction =
  | "say"
  | "followup"
  | "objection"
  | "who"
  | "recap"
  | "custom"
  | "assist";

export interface TranscriptLine {
  id: string;
  speaker: "You" | "Prospect" | "Other";
  text: string;
  timestamp: number;
}

export interface AssistResult {
  id: string;
  action: QuickAction;
  prompt: string;
  response: string;
  timestamp: number;
}

export interface AskLandedResult {
  text: string;
  viewedScreen: boolean;
}

interface AskOptions {
  customPrompt?: string;
  systemPrompt?: string;
  smartMode?: boolean;
  interimText?: string;
  outputLanguage?: string;
  onChunk?: (text: string) => void;
  signal?: AbortSignal;
}

function buildPrompt(
  action: QuickAction,
  transcript: TranscriptLine[],
  options: AskOptions,
  screenContent?: string,
): string {
  const liveTranscript = options.interimText?.trim()
    ? [
        ...transcript,
        {
          id: "interim-live",
          speaker: "Prospect" as const,
          text: options.interimText.trim(),
          timestamp: transcript[transcript.length - 1]?.timestamp ?? 0,
        },
      ]
    : transcript;

  const recent = liveTranscript
    .slice(-OPENAI_LIMITS.transcriptLinesForAssist)
    .map((l) => {
      const tag = l.id === "interim-live" ? " (speaking now)" : "";
      return `${l.speaker}: ${l.text}${tag}`;
    })
    .join("\n");

  const prompts: Record<QuickAction, string> = {
    assist:
      "Look at the user's screen context and give immediate, actionable help. Be concise — under 3 short sentences they can use right now.",
    say: "Suggest ONE natural thing the user should say next. Conversational, under 2 sentences.",
    followup: "Suggest 2-3 sharp follow-up questions based on the conversation.",
    objection:
      "The other person raised a concern. Suggest how to handle it with empathy. Give exact words to say.",
    who: "Based on the conversation, infer who they're talking to and what to ask next.",
    recap: "Summarize the conversation: key points, decisions, open questions, and recommended next steps.",
    custom:
      options.customPrompt
        ? `Answer this question using what you can see on the user's screen. Be direct and practical.\n\nQuestion: ${options.customPrompt}`
        : "Answer based on what is visible on the user's screen.",
  };

  const smartHint = options.smartMode
    ? "\nSmart mode ON — answer from screen context. Be direct. No preamble. Under 3 sentences."
    : "";

  const liveQuestion =
    options.interimText?.trim() && isDirectQuestion(options.interimText);
  const questionHint = liveQuestion
    ? "\nURGENT — they just asked a direct question (possibly still speaking). Give the exact words to answer it immediately. One short sentence they can say verbatim."
    : action === "say" && transcript.length > 0 && isDirectQuestion(transcript[transcript.length - 1]?.text ?? "")
      ? "\nThey asked a direct question. Give the exact answer the user should say right now. One short sentence."
      : "";

  const langHint = options.outputLanguage && options.outputLanguage !== "English"
    ? `\nRespond in ${options.outputLanguage}.`
    : "";

  const screenBlock = screenContent?.trim()
    ? `\n\n${formatScreenContextBlock(screenContent)}`
    : "";

  return `${prompts[action]}${smartHint}${questionHint}${langHint}\n\nTranscript:\n${recent || "(Conversation just started — give proactive help.)"}${screenBlock}`;
}

function parseStreamChunk(line: string): string | null {
  const trimmed = line.trim();
  if (!trimmed.startsWith("data: ")) return null;
  const payload = trimmed.slice(6);
  if (payload === "[DONE]") return null;
  try {
    const json = JSON.parse(payload) as {
      choices?: Array<{ delta?: { content?: string } }>;
    };
    return json.choices?.[0]?.delta?.content ?? null;
  } catch {
    return null;
  }
}

async function readChatCompletion(
  res: Response,
  onChunk?: (text: string) => void,
): Promise<string | null> {
  if (!res.ok) {
    console.warn("[landed] OpenAI request failed:", res.status, await res.text().catch(() => ""));
    return null;
  }

  if (onChunk && res.body) {
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let full = "";
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        const chunk = parseStreamChunk(line);
        if (chunk) {
          full += chunk;
          onChunk(full);
        }
      }
    }
    return full.trim() || null;
  }

  const data = await res.json();
  return (data.choices?.[0]?.message?.content as string | undefined)?.trim() || null;
}

/** `/api/assist` streams raw text (not OpenAI SSE). */
async function readPlainTextStream(
  res: Response,
  onChunk?: (text: string) => void,
): Promise<string | null> {
  if (!res.body) {
    const text = (await res.text()).trim();
    if (text && onChunk) onChunk(text);
    return text || null;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let full = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    full += decoder.decode(value, { stream: true });
    if (onChunk) onChunk(full);
  }

  return full.trim() || null;
}

async function askViaApi(options: {
  system: string;
  prompt: string;
  maxTokens: number;
  temperature: number;
  mode: "text" | "vision" | "coding";
  imageBase64?: string | null;
  imageDetail?: "low" | "auto" | "high";
  onChunk?: (text: string) => void;
  signal?: AbortSignal;
}): Promise<AskLandedResult | null> {
  const res = await apiFetch("/api/assist", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    signal: options.signal,
    body: JSON.stringify({
      system: options.system,
      prompt: options.prompt,
      maxTokens: options.maxTokens,
      temperature: options.temperature,
      stream: !!options.onChunk,
      mode: options.mode,
      imageBase64: options.imageBase64 || undefined,
      imageDetail: options.imageDetail,
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    console.warn("[landed] Assist API failed:", res.status, detail);
    throw new Error(describeAiRouteFailure(res.status, detail));
  }

  if (options.onChunk) {
    const text = await readPlainTextStream(res, options.onChunk);
    if (!text) return null;
    return {
      text,
      viewedScreen: res.headers.get("X-Landed-Viewed-Screen") === "1",
    };
  }

  const data = (await res.json()) as { text?: string; viewedScreen?: boolean };
  const text = data.text?.trim();
  if (!text) return null;
  return {
    text,
    viewedScreen: Boolean(data.viewedScreen ?? options.imageBase64),
  };
}

async function askViaDirectOpenAI(options: {
  apiKey: string;
  system: string;
  userContent: string | Array<Record<string, unknown>>;
  model: string;
  maxTokens: number;
  temperature: number;
  onChunk?: (text: string) => void;
  signal?: AbortSignal;
  viewedScreen: boolean;
}): Promise<AskLandedResult | null> {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${options.apiKey}`,
    },
    signal: options.signal,
    body: JSON.stringify({
      model: options.model,
      messages: [
        { role: "system", content: options.system },
        { role: "user", content: options.userContent },
      ],
      max_tokens: options.maxTokens,
      temperature: options.temperature,
      stream: !!options.onChunk,
    }),
  });

  const text = await readChatCompletion(res, options.onChunk);
  if (!text) return null;
  return { text, viewedScreen: options.viewedScreen };
}

const TEXT_ASK_SYSTEM = `You are Landed, a live technical interview assistant. Be concise and practical.`;

/**
 * Overlay ask entry point.
 *
 * Screen asks (assist / custom): capture → compress → vision model → answer.
 * Other quick actions stay text-only against the transcript.
 */
export async function askLanded(
  action: QuickAction,
  transcript: TranscriptLine[],
  options: AskOptions = {},
): Promise<AskLandedResult> {
  const apiKey = await getOpenAIKey();
  const screenEnabled =
    useAppStore.getState().settings.screenshotCapture !== false;
  const askIsAssistLike = action === "custom" || action === "assist";
  const question =
    options.customPrompt?.trim() ||
    (action === "assist" ? "Help me with what's on my screen." : "");

  const langHint =
    options.outputLanguage && options.outputLanguage !== "English"
      ? `\nRespond in ${options.outputLanguage}.`
      : "";

  // Phase 1: screenshot + question → vision AI → display answer.
  if (screenEnabled && askIsAssistLike) {
    try {
      const result = await askAboutScreen({
        question: `${question}${langHint}`,
        signal: options.signal,
      });
      options.onChunk?.(result.text);
      return { text: result.text, viewedScreen: result.viewedScreen };
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") throw err;
      console.warn("[landed] Screen ask failed:", err);
      if (err instanceof ScreenAssistantError) {
        return { text: err.message, viewedScreen: false };
      }
      return {
        text:
          err instanceof Error
            ? err.message
            : "Couldn't see your screen. Enable Screen Recording for Landed in System Settings → Privacy & Security, then try again.",
        viewedScreen: false,
      };
    }
  }

  try {
    const userPrompt = buildPrompt(action, transcript, options, "");
    const requestSystem = options.systemPrompt?.trim() || TEXT_ASK_SYSTEM;
    const maxTokens =
      action === "assist" || action === "say"
        ? OPENAI_LIMITS.assistMaxTokens
        : OPENAI_LIMITS.assistRecapMaxTokens;

    if (apiKey) {
      const result = await askViaDirectOpenAI({
        apiKey,
        system: requestSystem,
        userContent: userPrompt,
        model: OPENAI_MODELS.chat,
        maxTokens,
        temperature: 0.35,
        onChunk: options.onChunk,
        signal: options.signal,
        viewedScreen: false,
      });
      if (result) return result;
    } else if (await hasAuthenticatedApiAccess()) {
      const result = await askViaApi({
        system: requestSystem,
        prompt: userPrompt,
        maxTokens,
        temperature: 0.35,
        mode: "text",
        imageBase64: null,
        imageDetail: "high",
        onChunk: options.onChunk,
        signal: options.signal,
      });
      if (result) return result;
    } else {
      console.error("[landed] No OpenAI key and no authenticated API session.");
      return {
        text: "Sign in to Landed so it can answer questions about your screen.",
        viewedScreen: false,
      };
    }
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      throw err;
    }
    if (err instanceof Error && err.message) {
      console.warn("[landed] Assist request error:", err.message);
      return { text: err.message, viewedScreen: false };
    }
    console.warn("[landed] OpenAI request error:", err);
  }

  if (action === "custom" && options.customPrompt) {
    return {
      text: `Re: "${options.customPrompt}" — I couldn't reach the AI service. Check your connection and try again.`,
      viewedScreen: false,
    };
  }

  return {
    text: "Landed couldn't reach the AI service. Check your connection and try again.",
    viewedScreen: false,
  };
}

export interface SummarySection {
  heading: string;
  items: string[];
  format?: "paragraphs" | "bullets";
}

export interface MeetingSummaryResult {
  title: string;
  company: string;
  sections: SummarySection[];
  nextSteps: string[];
  objections?: string[];
  dealScore?: number;
}

export const EMPTY_SESSION_PLACEHOLDER: MeetingSummaryResult = {
  title: "Technical interview",
  company: "Interview",
  sections: [
    {
      heading: "Summary",
      format: "paragraphs",
      items: [
        "No activity was captured for this session, so Landed could not generate a summary. Start a new session and ask about the problem on your screen.",
      ],
    },
  ],
  nextSteps: [],
  objections: [],
  dealScore: 0,
};

function mockMeetingSummary(transcript: TranscriptLine[]): MeetingSummaryResult {
  if (transcript.length === 0) {
    return EMPTY_SESSION_PLACEHOLDER;
  }

  const highlights = transcript
    .slice(0, 8)
    .map((l) => `${l.speaker}: ${l.text}`);

  const actionItems =
    transcript.length >= 3
      ? [
          "Review the algorithm and complexity you discussed",
          "Practice explaining the approach out loud in under 30 seconds",
          "Rehearse one more edge-case question for similar problems",
        ]
      : ["Review the transcript and note open follow-ups"];

  return {
    title: "Technical interview",
    company: "Interview",
    sections: [
      { heading: "Action Items", items: actionItems },
      { heading: "Discussion Highlights", items: highlights },
    ],
    nextSteps: actionItems.slice(0, 2),
  };
}

export async function generateMeetingSummary(
  transcript: TranscriptLine[],
  systemPrompt?: string,
  outputLanguage?: string,
): Promise<MeetingSummaryResult> {
  const apiKey = await getOpenAIKey();
  const fullTranscript = truncateTranscriptForPrompt(transcript);

  if (!apiKey || transcript.length === 0) {
    if (!apiKey) {
      console.error("[landed] OpenAI API key is missing — cannot generate summary.");
    }
    return mockMeetingSummary(transcript);
  }

  const system =
    systemPrompt ??
    "You are Landed, an AI technical interview assistant. Produce clean, structured post-interview summaries.";

  const userPrompt = `Analyze this technical interview transcript and return a structured summary.

Return ONLY valid JSON with this exact shape:
{
  "title": "Short descriptive interview title inferred from the conversation",
  "company": "Company or account name if mentioned, otherwise 'Interview'",
  "sections": [
    { "heading": "Action Items", "items": ["specific action 1", "specific action 2"] },
    { "heading": "Key Discussion Points", "items": ["point 1", "point 2"] }
  ],
  "nextSteps": ["next step 1", "next step 2"],
  "objections": ["hard questions or gaps the interviewer probed"],
  "dealScore": 75
}

Rules:
- Use 2-4 sections with clear headings (Action Items, Key Discussion Points, What Went Well, Polish for Next Time, etc.)
- Each section has 2-6 concise bullet items
- Bold important terms using **markdown** within item strings when helpful
- Be specific to what was actually discussed — no generic filler
- nextSteps should be the most important follow-ups (2-4 items)
- objections: list hard interviewer questions or gaps (empty array if none)
- dealScore: 0-100 estimate of how well the technical interview went
${outputLanguage && outputLanguage !== "English" ? `- Write all text in ${outputLanguage}` : ""}

Transcript:
${fullTranscript || "(empty)"}`;

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: OPENAI_MODELS.chat,
        messages: [
          { role: "system", content: system },
          { role: "user", content: userPrompt },
        ],
        max_tokens: OPENAI_LIMITS.summaryMaxTokens,
        temperature: 0.35,
        response_format: { type: "json_object" },
      }),
    });

    if (res.ok) {
      const data = await res.json();
      const raw = data.choices?.[0]?.message?.content?.trim();
      if (raw) {
        const parsed = JSON.parse(raw) as MeetingSummaryResult;
        if (parsed.sections?.length) {
          return {
            title: parsed.title || "Technical interview",
            company: parsed.company || "Interview",
            sections: parsed.sections,
            nextSteps: parsed.nextSteps ?? [],
            objections: parsed.objections ?? [],
            dealScore: parsed.dealScore ?? 0,
          };
        }
      }
    }
  } catch (err) {
    console.error("[landed] Meeting summary API error:", err);
  }

  return {
    title: "Technical interview",
    company: "Interview",
    sections: [
      {
        heading: "Summary unavailable",
        items: ["Landed couldn't generate a summary. Check your OpenAI API key and try again."],
      },
    ],
    nextSteps: [],
  };
}

function sectionsToPlainText(sections: SummarySection[]): string {
  return sections
    .map((s) => {
      const body =
        s.format === "paragraphs"
          ? s.items.join("\n\n")
          : s.items.map((i) => `• ${i}`).join("\n");
      return `${s.heading}\n${body}`;
    })
    .join("\n\n");
}

export { sectionsToPlainText };

export interface TestSuggestionResult {
  suggestion: string;
  dealHealth: number;
}

export const TEST_PROSPECT_LINES = [
  "We're already using Salesforce for this",
  "It's quite expensive honestly",
  "I need to check with my team first",
  "What makes you different from Gong?",
  "We don't really have budget right now",
];

export async function testLandedSuggestion(
  prospectText: string,
  options: { coachingContext?: string; product?: string } = {},
): Promise<TestSuggestionResult | null> {
  const result = await getLandedSuggestion(prospectText, [], {
    coachingContext: options.coachingContext,
    product: options.product,
  });

  if (!result) return null;

  return {
    suggestion: result.suggestion,
    dealHealth: result.health,
  };
}
