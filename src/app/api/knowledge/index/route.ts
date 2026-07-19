import { NextResponse } from "next/server";
import { verifyAuthenticatedRequest } from "@/lib/api-auth";
import { apiErrorResponse } from "@/lib/api-errors";
import { rateLimit } from "@/lib/api-rate-limit";
import { chunkDocumentText, estimateTokenCount } from "@/lib/knowledge-chunking";
import { embedTexts } from "@/lib/knowledge-embed";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export async function POST(request: Request) {
  try {
    const auth = await verifyAuthenticatedRequest(request);
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const limited = rateLimit(request, {
      scope: `knowledge:index:${auth.userId}`,
      limit: 20,
      windowMs: 60_000,
    });
    if (limited) return limited;

    const body = (await request.json()) as {
      documentId?: string;
      documentName?: string;
      text?: string;
    };

    const documentId = body.documentId?.trim();
    const documentName = body.documentName?.trim();
    const text = body.text?.trim();

    if (!documentId || !documentName || !text) {
      return NextResponse.json(
        { error: "documentId, documentName, and text are required" },
        { status: 400 },
      );
    }

    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return NextResponse.json({ error: "Database not configured" }, { status: 503 });
    }

    await supabase
      .from("knowledge_chunks")
      .delete()
      .eq("user_id", auth.userId)
      .eq("document_id", documentId);

    const chunks = chunkDocumentText(text);
    if (!chunks.length) {
      return NextResponse.json({ indexed: 0 });
    }

    const embeddings = await embedTexts(chunks);
    const rows = chunks.map((content, chunkIndex) => ({
      user_id: auth.userId,
      document_id: documentId,
      document_name: documentName.slice(0, 120),
      chunk_index: chunkIndex,
      content,
      token_count: estimateTokenCount(content),
      embedding: embeddings[chunkIndex],
    }));

    const { error } = await supabase.from("knowledge_chunks").insert(rows);
    if (error) {
      console.error("[knowledge/index] insert failed:", error);
      return NextResponse.json({ error: "Failed to index document" }, { status: 500 });
    }

    return NextResponse.json({ indexed: rows.length });
  } catch (err) {
    const { message, status } = apiErrorResponse(err, "Knowledge index failed");
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(request: Request) {
  try {
    const auth = await verifyAuthenticatedRequest(request);
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { searchParams } = new URL(request.url);
    const documentId = searchParams.get("documentId")?.trim();
    if (!documentId) {
      return NextResponse.json({ error: "documentId is required" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return NextResponse.json({ error: "Database not configured" }, { status: 503 });
    }

    await supabase
      .from("knowledge_chunks")
      .delete()
      .eq("user_id", auth.userId)
      .eq("document_id", documentId);

    return NextResponse.json({ ok: true });
  } catch (err) {
    const { message, status } = apiErrorResponse(err, "Knowledge delete failed");
    return NextResponse.json({ error: message }, { status });
  }
}
