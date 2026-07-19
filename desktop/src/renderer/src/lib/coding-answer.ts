/** Detect coding / interview-style asks from the user prompt + optional screen OCR. */
export function looksLikeCodingAsk(question: string, screenText = ""): boolean {
  const q = question.trim().toLowerCase();
  const screen = screenText.toLowerCase();
  const blob = `${q}\n${screen}`;

  const screenLooksLikeCode =
    /\b(leetcode|hackerrank|neetcode|codeforces|class solution|def |function\s+\w+|public\s+class|example\s*\d|constraints?|input:|output:|time\s*complexity|space\s*complexity|return\s+\[|#include|console\.log|median of two|sorted arrays?|compile error|extraneous closing brace|findmediansortedarrays)\b/i.test(
      screen,
    ) || /```|^\s*\d+\s*\|/m.test(screenText);

  /** Short commands that mean "solve the coding problem on screen". */
  const isSolveCommand =
    /^(solve|fix|answer|code)(\s+(this|it|please|the\s+problem|my\s+code))?[!?.]*$/i.test(
      q,
    ) ||
    /\b(solve(\s+(this|the|it))?|give me the (code|solution)|write the (code|solution)|full solution)\b/i.test(
      q,
    ) ||
    // Default overlay assist prompt — treat as solve when screen OCR shows a problem.
    /\bhelp me with (what'?s|what is) on my screen\b/i.test(q) ||
    /\bhelp me with the (coding )?problem\b/i.test(q);

  const questionLooksLikeCode =
    isSolveCommand ||
    /\b(leetcode|hackerrank|codeforces|coding\s*problem|two\s*sum|algorithm|data\s*structure|time\s*complexity|space\s*complexity|binary\s*tree|linked\s*list|hash\s*map|dynamic\s*programming|write\s*(a\s+)?(function|class|solution|code)|implement\b|debug\b|fix\s+(this|the)\s+(bug|error|code)|solution|complexity)\b/i.test(
      q,
    );

  // Pure "what's on my screen?" → vision, unless the ask or OCR already looks like coding.
  const isScreenAwarenessAsk =
    /\b(what\s+am\s+i\s+looking\s+at|what('?s|\s+is)\s+on\s+(my\s+)?screen|describe\s+(my\s+)?screen|look\s+at\s+(my\s+)?screen)\b/i.test(
      q,
    );
  if (
    isScreenAwarenessAsk &&
    !screenLooksLikeCode &&
    !questionLooksLikeCode &&
    !isSolveCommand
  ) {
    return false;
  }

  // Short “help / solve this” (or Assist default) while a coding problem is on screen.
  const vagueAskOnCodeScreen =
    screenLooksLikeCode &&
    (q.length === 0 ||
      /\b(solve|solution|help|hint|approach|how|what|fix|debug|code|answer|screen)\b/i.test(
        q,
      ));

  return (
    questionLooksLikeCode ||
    vagueAskOnCodeScreen ||
    (screenLooksLikeCode && q.length < 120) ||
    (/\b(array|string|integer|return)\b/i.test(blob) &&
      /\b(example\s*\d|constraints?|input:|output:)\b/i.test(blob))
  );
}

export function codingSystemPrompt(codeLanguage = "Auto"): string {
  const preferred = codeLanguage.trim() || "Auto";
  const languageRule =
    preferred === "Auto"
      ? "Match the language on screen (C++ / Python / Java / JavaScript / etc.)."
      : `Write the solution in ${preferred}. Use a ${preferred} code fence. Only switch languages if the screen clearly requires a different one.`;

  const fenceLang =
    preferred === "Auto"
      ? "cpp"
      : preferred === "C++"
        ? "cpp"
        : preferred === "C#"
          ? "csharp"
          : preferred.toLowerCase().replace(/\s+/g, "");

  return `You are Landed, a technical coding interview assistant that can see the user's screen.

CRITICAL — ignore any dark floating Landed / assistant overlay UI in the screenshot. Pretend it is not there. Focus only on the browser, IDE, or problem behind it (LeetCode, editor, slides, docs).

When the screen shows a coding problem (LeetCode, HackerRank, interview pad, editor, compile errors, etc.), respond with EXACTLY this markdown structure and nothing else:

## Problem
One short paragraph restating the problem in plain English.

## My Thoughts
- 3 to 5 short bullets explaining the approach

## Solution
\`\`\`${fenceLang}
class Solution {
public:
    // FULL working solution — never truncated
};
\`\`\`

## Complexity
- Time: O(...)
- Space: O(...)

Rules:
- ${languageRule}
- Identify the problem from the title / statement / function signature (e.g. findMedianSortedArrays). Do NOT continue broken editor code.
- DELETE/ignore any compile errors, leftover \`};\`, or partial stubs visible in the editor. Write a brand-new complete solution.
- Solution code MUST compile. Every brace closed. Real return. Never truncate mid-function.
- Start the code block with \`class Solution\` / \`def \` / \`function\` — NEVER with \`};\`.
- Prefer the optimal interview solution (for median of two sorted arrays: O(log (m+n)) binary search).
- If it is NOT a coding problem, ignore this template and answer in short plain text about what is on screen.`;
}

export type CodingSection =
  | { type: "heading"; text: string }
  | { type: "paragraph"; text: string }
  | { type: "bullets"; items: string[] }
  | { type: "code"; language: string; code: string };

/** Strip paste junk (leading \`};\`, trailing fences) from a solution block. */
export function sanitizeSolutionCode(code: string): string {
  let next = code.replace(/\r\n/g, "\n").trim();
  // Common bad paste from appending onto LeetCode starter leftovers.
  next = next.replace(/^(\s*};?\s*)+/, "");
  next = next.replace(/^```\w*\n?/, "").replace(/\n?```$/, "");
  return next.trim();
}

/** True when the solution looks complete enough to paste (not mid-function). */
export function isCompleteSolutionCode(code: string): boolean {
  const text = sanitizeSolutionCode(code);
  if (text.length < 40) return false;
  if (/^\s*};/.test(text)) return false;
  if (/\bTODO\b|\bpass\b\s*$|\.\.\.\s*$/m.test(text)) return false;

  let depth = 0;
  for (const ch of text) {
    if (ch === "{") depth += 1;
    if (ch === "}") depth -= 1;
    if (depth < 0) return false;
  }
  if (depth !== 0) return false;

  // Must look like a real solution entrypoint.
  if (
    !/\bclass\s+Solution\b|\bdef\s+\w+\s*\(|\bfunction\s+\w+\s*\(|\bpublic\s+.+\(/i.test(
      text,
    )
  ) {
    return false;
  }

  // C++/Java/JS solutions almost always need a return (void rare for these problems).
  if (/\b(double|int|bool|string|vector|List|boolean)\b/i.test(text) && !/\breturn\b/.test(text)) {
    return false;
  }

  return true;
}

/** Extract the primary solution code block from a coding markdown answer. */
export function extractSolutionCode(markdown: string): string | null {
  const sections = parseCodingAnswer(markdown);
  if (!sections) return null;
  const code = sections.find((s) => s.type === "code");
  if (!code || code.type !== "code") return null;
  const cleaned = sanitizeSolutionCode(code.code);
  return cleaned || null;
}

/** Parse Landed coding markdown into renderable sections. */
export function parseCodingAnswer(markdown: string): CodingSection[] | null {
  const text = markdown.trim();
  if (!/^##\s+(Problem|My Thoughts|Solution|Complexity)/im.test(text)) {
    return null;
  }

  const sections: CodingSection[] = [];
  const blocks = text.split(/^##\s+/m).filter(Boolean);

  for (const block of blocks) {
    const nl = block.indexOf("\n");
    const title = (nl === -1 ? block : block.slice(0, nl)).trim();
    const body = (nl === -1 ? "" : block.slice(nl + 1)).trim();
    if (!title) continue;

    sections.push({ type: "heading", text: title });

    // Prefer closed fences; fall back to an open fence while streaming.
    const closed = body.match(/```(\w+)?\n([\s\S]*?)```/);
    const open = !closed ? body.match(/```(\w+)?\n([\s\S]*)$/) : null;
    const codeMatch = closed ?? open;
    if (codeMatch) {
      const before = body.slice(0, codeMatch.index).trim();
      if (before) pushBody(sections, before);
      sections.push({
        type: "code",
        language: codeMatch[1] || "text",
        code: sanitizeSolutionCode(codeMatch[2] ?? ""),
      });
      if (closed) {
        const after = body
          .slice((closed.index ?? 0) + closed[0].length)
          .trim();
        if (after) pushBody(sections, after);
      }
      continue;
    }

    pushBody(sections, body);
  }

  return sections.length ? sections : null;
}

/** Normalize `- **Time:** O(n)` / `**Time:** O(n)` → `Time: O(n)`. */
function normalizeBulletItem(raw: string): string {
  return raw
    .replace(/^[-*•]\s+/, "")
    .trim()
    .replace(/^\*\*(.+?)\*\*:?\s*/, (_m, label: string) => `${label}: `);
}

function pushBody(sections: CodingSection[], body: string) {
  const lines = body.split("\n");
  const bullets: string[] = [];
  const paras: string[] = [];

  const flushParas = () => {
    const joined = paras.join(" ").trim();
    if (joined) sections.push({ type: "paragraph", text: joined });
    paras.length = 0;
  };

  const flushBullets = () => {
    if (bullets.length) sections.push({ type: "bullets", items: [...bullets] });
    bullets.length = 0;
  };

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) {
      flushBullets();
      flushParas();
      continue;
    }
    if (line.startsWith("- ") || line.startsWith("* ") || line.startsWith("• ")) {
      flushParas();
      bullets.push(normalizeBulletItem(line));
      continue;
    }
    if (/^\*\*[^*]+\*\*/.test(line)) {
      flushParas();
      bullets.push(normalizeBulletItem(line));
      continue;
    }
    flushBullets();
    paras.push(line);
  }
  flushBullets();
  flushParas();
}
