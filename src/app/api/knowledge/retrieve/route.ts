import { NextResponse } from "next/server";
import { verifyAuthenticatedRequest } from "@/lib/api-auth";
import { apiErrorResponse } from "@/lib/api-errors";
import { rateLimit } from "@/lib/api-rate-limit";
import { retrieveKnowledge } from "@/lib/knowledge-retrieve";
import { formatRagBlock } from "@/lib/subprompts";
import { formatRecentTranscript } from "@/lib/openai-config";
import type { TranscriptLine } from "@/types/landed";

export async function POST(request: Request) {
  try {
    const auth = await verifyAuthenticatedRequest(request);
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const limited = rateLimit(request, {
      scope: `knowledge:retrieve:${auth.userId}`,
      limit: 120,
      windowMs: 60_000,
    });
    if (limited) return limited;

    const body = (await request.json()) as {
      query?: string;
      transcript?: TranscriptLine[];
      topK?: number;
    };

    const query = body.query?.trim();
    if (!query) {
      return NextResponse.json({ error: "query is required" }, { status: 400 });
    }

    const recent = formatRecentTranscript(body.transcript ?? []);
    const searchQuery = recent ? `${query}\n${recent}` : query;

    const chunks = await retrieveKnowledge(
      auth.userId,
      searchQuery,
      body.topK ?? 3,
    );

    return NextResponse.json({
      chunks,
      ragBlock: formatRagBlock(
        chunks.map((c) => ({
          documentName: c.documentName,
          content: c.content,
        })),
      ),
    });
  } catch (err) {
    const { message, status } = apiErrorResponse(err, "Knowledge retrieve failed");
    return NextResponse.json({ error: message }, { status });
  }
}
