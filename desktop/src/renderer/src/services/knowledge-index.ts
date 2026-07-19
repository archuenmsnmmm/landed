import { apiFetch, apiJson, hasAuthenticatedApiAccess } from "../lib/api-client";
import type { KnowledgeDocument } from "../lib/knowledge-documents";

export async function indexKnowledgeDocument(doc: KnowledgeDocument): Promise<boolean> {
  if (!(await hasAuthenticatedApiAccess())) return false;

  const result = await apiJson<{ indexed: number }>("/api/knowledge/index", {
    method: "POST",
    body: JSON.stringify({
      documentId: doc.id,
      documentName: doc.name,
      text: doc.text,
    }),
  });

  if (!result.ok) {
    console.warn("[knowledge] index failed:", result.error);
    return false;
  }

  return result.data.indexed > 0;
}

export async function syncKnowledgeIndex(documents: KnowledgeDocument[]): Promise<void> {
  for (const doc of documents) {
    if (doc.text.trim()) {
      await indexKnowledgeDocument(doc);
    }
  }
}

export async function removeKnowledgeIndex(documentId: string): Promise<void> {
  if (!(await hasAuthenticatedApiAccess())) return;

  await apiFetch(
    `/api/knowledge/index?documentId=${encodeURIComponent(documentId)}`,
    { method: "DELETE" },
  );
}
