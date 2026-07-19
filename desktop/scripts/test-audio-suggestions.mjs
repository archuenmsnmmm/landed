#!/usr/bin/env node
/**
 * End-to-end smoke test for Landed audio + suggestion pipeline.
 * Run: node scripts/test-audio-suggestions.mjs
 */
import { execSync, spawnSync } from "node:child_process";
import { readFileSync, writeFileSync, unlinkSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const desktopRoot = path.join(__dirname, "..");

const TEST_PROSPECT_LINES = [
  "We're already using Salesforce for this",
  "It's quite expensive honestly",
  "I need to check with my team first",
  "What makes you different from Gong?",
  "We don't really have budget right now",
];

const MOCK_CONVERSATION = [
  { speaker: "Prospect", text: "We're already using Salesforce for this." },
  { speaker: "You", text: "Thanks for joining — walk me through how you're handling sales calls today." },
  { speaker: "Prospect", text: "It's quite expensive honestly." },
  { speaker: "You", text: "What would need to change for you to consider switching?" },
  { speaker: "Prospect", text: "I need to check with my team first." },
  { speaker: "Prospect", text: "What makes you different from Gong?" },
  { speaker: "You", text: "We give reps live suggestions during the call, not just post-call analytics." },
  { speaker: "Prospect", text: "We don't really have budget right now." },
];

const DEFAULT_PRODUCT =
  "AI sales co-pilot that gives live suggestions invisibly during sales calls";
const DEFAULT_OBJECTIONS =
  "price, already using Salesforce, need to think about it, no budget, need team approval";

function loadApiKey() {
  const envPath = path.join(desktopRoot, ".env");
  if (!existsSync(envPath)) {
    throw new Error("Missing desktop/.env — set VITE_OPENAI_API_KEY");
  }
  const raw = readFileSync(envPath, "utf8");
  const match = raw.match(/^VITE_OPENAI_API_KEY=(.+)$/m);
  const key = match?.[1]?.trim();
  if (!key) throw new Error("VITE_OPENAI_API_KEY is empty in desktop/.env");
  return key;
}

function suggestSystemPrompt(product, objections) {
  return `You are an elite sales coach embedded in a real-time overlay.
The rep sells: ${product}
Known objections: ${objections}

The prospect just finished speaking. Give the rep ONE thing to say right now.

Rules:
- Under 20 words
- Start with a quote mark so it reads as something to literally say
- Never say "I" — use "we" or direct questions
- If it's an objection, reframe it as curiosity not defence
- If there's a buying signal, ask a closing question

Also score the call state.

Respond ONLY in valid JSON, no markdown, no backticks:
{
  "suggestion": "what to say in under 20 words",
  "health": 74,
  "talkRatio": 52,
  "missing": {
    "budget": false,
    "decisionMaker": true,
    "timeline": false,
    "nextStep": false
  }
}`;
}

function buildPipelineUserPrompt(prospectText, transcript) {
  const transcriptBlock = transcript.length
    ? transcript.map((t) => `${t.speaker}: ${t.text}`).join("\n")
    : "(Conversation just started)";
  return `TRANSCRIPT (last 2 minutes):
${transcriptBlock}

Prospect just said: "${prospectText}"

TASK: Suggest what the user should say next. Under 20 words. Give exact words they can say verbatim. No preamble.`;
}

function parseSuggestionJson(raw) {
  const clean = raw.replace(/```json|```/g, "").trim();
  const parsed = JSON.parse(clean);
  if (!parsed.suggestion?.trim()) return null;
  return {
    suggestion: parsed.suggestion.trim(),
    health: Math.max(0, Math.min(100, parsed.health ?? 50)),
  };
}

async function getLandedSuggestion(apiKey, prospectText, transcript = []) {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o",
      max_tokens: 200,
      temperature: 0.4,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: suggestSystemPrompt(DEFAULT_PRODUCT, DEFAULT_OBJECTIONS) },
        { role: "user", content: buildPipelineUserPrompt(prospectText, transcript) },
      ],
    }),
  });

  if (!res.ok) {
    throw new Error(`Suggest API ${res.status}: ${await res.text()}`);
  }

  const data = await res.json();
  const raw = data.choices?.[0]?.message?.content?.trim();
  if (!raw) throw new Error("Suggest API returned empty content");
  const parsed = parseSuggestionJson(raw);
  if (!parsed) throw new Error(`Invalid suggestion JSON: ${raw}`);
  return parsed;
}

async function streamLandedSuggestion(apiKey, prospectText, transcript = []) {
  const system = `You are a real-time meeting copilot embedded in a live coaching overlay.
The rep sells: ${DEFAULT_PRODUCT}
Known objections: ${DEFAULT_OBJECTIONS}

Give ONE thing to say right now — under 20 words, exact words they can say verbatim.
No preamble, no bullet lists, no JSON.`;

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o",
      max_tokens: 120,
      temperature: 0.35,
      stream: true,
      messages: [
        { role: "system", content: system },
        { role: "user", content: buildPipelineUserPrompt(prospectText, transcript) },
      ],
    }),
  });

  if (!res.ok) {
    throw new Error(`Stream suggest ${res.status}: ${await res.text()}`);
  }

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
      const trimmed = line.trim();
      if (!trimmed.startsWith("data: ")) continue;
      const payload = trimmed.slice(6);
      if (payload === "[DONE]") continue;
      try {
        const json = JSON.parse(payload);
        const chunk = json.choices?.[0]?.delta?.content;
        if (chunk) full += chunk;
      } catch {
        // ignore malformed chunks
      }
    }
  }

  const suggestion = full.trim();
  if (!suggestion) throw new Error("Stream returned empty suggestion");
  return suggestion;
}

function generateTestAudio(outPath) {
  const aiff = outPath.replace(/\.[^.]+$/, ".aiff");
  execSync(`say -o "${aiff}" "We are already using Salesforce for this"`, { stdio: "pipe" });
  execSync(`afconvert -f m4af -d aac "${aiff}" "${outPath}"`, { stdio: "pipe" });
  unlinkSync(aiff);
}

async function transcribeAudio(apiKey, filePath) {
  const blob = new Blob([readFileSync(filePath)]);
  const formData = new FormData();
  formData.append("file", blob, "audio.m4a");
  formData.append("model", "whisper-1");
  formData.append("response_format", "json");
  formData.append("language", "en");

  const res = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}` },
    body: formData,
  });

  if (!res.ok) {
    throw new Error(`Whisper ${res.status}: ${await res.text()}`);
  }

  const data = await res.json();
  return data.text?.trim() ?? "";
}

function isLikelyProspectUtterance(text) {
  const trimmed = text.replace(/\s+/g, " ").trim();
  if (trimmed.length < 8) return false;
  if (/\?\s*$/.test(trimmed)) return true;
  if (/\b(price|pricing|cost|budget|expensive|already using|salesforce|gong)\b/i.test(trimmed)) return true;
  if (/\b(we're|we are|our team|my team|our budget|check with|need to check|team first|team approval)\b/i.test(trimmed)) return true;
  return false;
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const results = { passed: 0, failed: 0, tests: [] };

function pass(name, detail = "") {
  results.passed += 1;
  results.tests.push({ name, ok: true, detail });
  console.log(`  ✓ ${name}${detail ? ` — ${detail}` : ""}`);
}

function fail(name, err) {
  results.failed += 1;
  const detail = err instanceof Error ? err.message : String(err);
  results.tests.push({ name, ok: false, detail });
  console.error(`  ✗ ${name} — ${detail}`);
}

async function main() {
  console.log("\nLanded audio + suggestions smoke test\n");

  let apiKey;
  try {
    apiKey = loadApiKey();
    pass("API key loaded");
  } catch (err) {
    fail("API key loaded", err);
    process.exit(1);
  }

  // 1. Suggestion API — all test lines
  console.log("\n1. Landed suggestions (JSON API)");
  const transcript = MOCK_CONVERSATION.slice(0, 4);
  for (const line of TEST_PROSPECT_LINES) {
    try {
      const result = await getLandedSuggestion(apiKey, line, transcript);
      assert(result.suggestion.length > 5, "suggestion too short");
      assert(result.suggestion.split(/\s+/).length <= 30, "suggestion too long");
      assert(result.health >= 0 && result.health <= 100, "invalid health");
      pass(`suggest: "${line.slice(0, 40)}…"`, `"${result.suggestion}" (health ${result.health})`);
    } catch (err) {
      fail(`suggest: "${line}"`, err);
    }
  }

  // 2. Streaming suggestion
  console.log("\n2. Streaming suggestion");
  try {
    const streamed = await streamLandedSuggestion(
      apiKey,
      "What makes you different from Gong?",
      transcript,
    );
    assert(streamed.length > 5, "stream empty");
    pass("stream suggest", `"${streamed}"`);
  } catch (err) {
    fail("stream suggest", err);
  }

  // 3. Whisper transcription
  console.log("\n3. Whisper audio transcription");
  const audioPath = path.join(desktopRoot, ".test-audio.m4a");
  try {
    generateTestAudio(audioPath);
    pass("generate test audio (macOS say)");
  } catch (err) {
    fail("generate test audio", err);
  }

  if (existsSync(audioPath)) {
    try {
      const text = await transcribeAudio(apiKey, audioPath);
      assert(text.length > 5, "whisper returned empty");
      assert(/salesforce/i.test(text), `unexpected transcript: ${text}`);
      pass("whisper transcribe", `"${text}"`);
    } catch (err) {
      fail("whisper transcribe", err);
    } finally {
      unlinkSync(audioPath);
    }
  }

  // 4. Mock conversation trigger logic
  console.log("\n4. Auto-trigger heuristics");
  try {
    const prospectLines = MOCK_CONVERSATION.filter((e) => e.speaker === "Prospect");
    for (const entry of prospectLines) {
      assert(isLikelyProspectUtterance(entry.text), `should trigger: ${entry.text}`);
    }
    assert(!isLikelyProspectUtterance("ok"), "short ack should not trigger");
    pass("prospect utterance detection", `${prospectLines.length} lines trigger correctly`);
  } catch (err) {
    fail("prospect utterance detection", err);
  }

  // 5. Mock mode env
  console.log("\n5. Dev mock audio config");
  try {
    const envRaw = readFileSync(path.join(desktopRoot, ".env"), "utf8");
    const mockFlag = envRaw.match(/^VITE_USE_MOCK_AUDIO=(.+)$/m)?.[1]?.trim();
    assert(mockFlag === "true", "expected VITE_USE_MOCK_AUDIO=true for dev testing");
    pass("VITE_USE_MOCK_AUDIO", mockFlag ?? "(unset)");
  } catch (err) {
    fail("mock audio config", err);
  }

  // 6. Full mock pipeline — prospect lines → auto suggestions
  console.log("\n6. Mock conversation → suggestion pipeline");
  const accumulated = [];
  for (const entry of MOCK_CONVERSATION) {
    accumulated.push(entry);
    if (entry.speaker !== "Prospect") continue;
    try {
      const result = await streamLandedSuggestion(apiKey, entry.text, accumulated);
      assert(result.length > 5, "empty suggestion");
      pass(`mock line: "${entry.text.slice(0, 42)}…"`, `"${result}"`);
    } catch (err) {
      fail(`mock line: "${entry.text}"`, err);
    }
  }

  // 7. Capture mode defaults
  console.log("\n7. Audio capture mode logic");
  try {
    const mockFlag = readFileSync(path.join(desktopRoot, ".env"), "utf8")
      .match(/^VITE_USE_MOCK_AUDIO=(.+)$/m)?.[1]?.trim();
    function shouldUseMockAudio(mode) {
      if (mode === "mock") return true;
      if (mode === "mic" || mode === "system") return false;
      return mockFlag === "true";
    }
    assert(shouldUseMockAudio("auto") === true, "auto should use mock in dev");
    assert(shouldUseMockAudio("mic") === false, "mic should not use mock");
    assert(shouldUseMockAudio("mock") === true, "mock mode explicit");
    pass("shouldUseMockAudio", "auto→mock, mic→live");
  } catch (err) {
    fail("shouldUseMockAudio", err);
  }

  console.log(`\n${"─".repeat(48)}`);
  console.log(`Results: ${results.passed} passed, ${results.failed} failed`);
  console.log(`${"─".repeat(48)}\n`);

  process.exit(results.failed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
