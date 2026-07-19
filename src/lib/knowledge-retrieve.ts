import { embedQuery } from "@/lib/knowledge-embed";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export type RetrievedChunk = {
  id: string;
  documentName: string;
  content: string;
  similarity: number;
};

export async function retrieveKnowledge(
  userId: string,
  query: string,
  topK = 3,
  threshold = 0.58,
): Promise<RetrievedChunk[]> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return [];

  const trimmed = query.trim();
  if (!trimmed) return [];

  let embedding: number[];
  try {
    embedding = await embedQuery(trimmed);
  } catch (err) {
    console.error("[knowledge-retrieve] embed failed:", err);
    return [];
  }

  const { data, error } = await supabase.rpc("match_knowledge_chunks", {
    query_embedding: embedding,
    match_user_id: userId,
    match_count: topK,
    match_threshold: threshold,
  });

  if (error) {
    console.error("[knowledge-retrieve] rpc failed:", error);
    return [];
  }

  return (data ?? []).map(
    (row: {
      id: string;
      document_name: string;
      content: string;
      similarity: number;
    }) => ({
      id: row.id,
      documentName: row.document_name,
      content: row.content,
      similarity: row.similarity,
    }),
  );
}
