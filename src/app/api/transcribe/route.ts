import { NextResponse } from "next/server";
import { verifyAuthenticatedRequest } from "@/lib/api-auth";
import { apiErrorResponse } from "@/lib/api-errors";
import {
  checkAiEntitlement,
  entitlementDeniedResponse,
} from "@/lib/entitlements";
import { rateLimit } from "@/lib/api-rate-limit";
import { getOpenAIClient } from "@/lib/openai";
import { OPENAI_MODELS } from "@/lib/openai-config";

const MAX_AUDIO_BYTES = 5 * 1024 * 1024;

export async function POST(request: Request) {
  try {
    const auth = await verifyAuthenticatedRequest(request);
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const entitlement = await checkAiEntitlement(auth.userId);
    if (!entitlement.ok) return entitlementDeniedResponse(entitlement);

    const limited = rateLimit(request, {
      scope: `ai:transcribe:${auth.userId}`,
      limit: 120,
      windowMs: 60_000,
    });
    if (limited) return limited;

    const formData = await request.formData();
    const file = formData.get("file");
    const language = formData.get("language")?.toString();

    if (!(file instanceof Blob) || file.size < 80) {
      return NextResponse.json({ error: "Audio file too small" }, { status: 400 });
    }
    if (file.size > MAX_AUDIO_BYTES) {
      return NextResponse.json({ error: "Audio file too large" }, { status: 413 });
    }

    const openai = getOpenAIClient();
    const upload = new File([file], "audio.webm", { type: file.type || "audio/webm" });

    const transcription = await openai.audio.transcriptions.create({
      file: upload,
      model: OPENAI_MODELS.whisper,
      ...(language ? { language } : {}),
    });

    const text = transcription.text?.trim() ?? "";
    return NextResponse.json({ text });
  } catch (err) {
    const { message, status } = apiErrorResponse(err, "Transcription failed");
    return NextResponse.json({ error: message }, { status });
  }
}
