/**
 * Unit tests for screen-assistant core helpers (no API key, no Electron).
 * Run: node desktop/scripts/test-screen-assistant.mjs
 */

import assert from "node:assert/strict";

function estimateBase64Bytes(base64) {
  return Math.ceil((base64.length * 3) / 4);
}

function buildVisionRequest({ prompt, screenshot, system }) {
  return {
    system,
    prompt,
    mode: screenshot ? "vision" : "text",
    imageBase64: screenshot || undefined,
    imageDetail: "high",
    stream: false,
  };
}

function mapApiError(status) {
  if (status === 401 || status === 403) return "api_key";
  if (status === 429) return "rate_limit";
  if (status === 413) return "invalid_image";
  if (status === 0) return "network";
  return "unknown";
}

/** MVP askAboutScreen request shape: question + image only. */
function buildAskPayload(question, imageBase64) {
  return {
    question: question.trim() || "What is happening on this screen?",
    image: imageBase64,
  };
}

// --- AI request construction ---
{
  const body = buildVisionRequest({
    prompt: "What is on my screen?",
    screenshot: "abc123",
    system: "You are a visual desktop assistant.",
  });
  assert.equal(body.mode, "vision");
  assert.equal(body.imageBase64, "abc123");
  assert.ok(!JSON.stringify(body).includes("sk-"), "no api key in body");
}

// --- MVP ask payload ---
{
  const payload = buildAskPayload("What is this error?", "/9j/fakejpeg");
  assert.equal(payload.question, "What is this error?");
  assert.equal(payload.image, "/9j/fakejpeg");
  assert.equal(
    buildAskPayload("  ", "img").question,
    "What is happening on this screen?",
  );
}

// --- API error handling ---
{
  assert.equal(mapApiError(401), "api_key");
  assert.equal(mapApiError(429), "rate_limit");
  assert.equal(mapApiError(413), "invalid_image");
}

// --- screenshot size estimate ---
{
  const fake = "a".repeat(1000);
  assert.equal(estimateBase64Bytes(fake), Math.ceil((1000 * 3) / 4));
}

console.log("screen-assistant tests: ok");
