/** Sales playbook, pricing sheet, or product doc. */
export const MAX_KNOWLEDGE_DOCS = 1;
export const MAX_KNOWLEDGE_DOC_CHARS = 22_000;
export const MAX_KNOWLEDGE_PROMPT_CHARS = 8_000;

export interface KnowledgeDocument {
  id: string;
  name: string;
  text: string;
  uploadedAt: number;
}

export const KNOWLEDGE_ACCEPT =
  ".txt,.md,.docx,.pdf,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,text/markdown";

export const KNOWLEDGE_FORMATS_LABEL = "TXT, MD, DOCX, or PDF";

export function createKnowledgeDocument(name: string, text: string): KnowledgeDocument {
  return {
    id: `kb-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: name.trim().slice(0, 120) || "document",
    text: text.trim().slice(0, MAX_KNOWLEDGE_DOC_CHARS),
    uploadedAt: Date.now(),
  };
}

export function normalizeKnowledgeDocuments(raw: unknown): KnowledgeDocument[] {
  if (!Array.isArray(raw)) return [];

  const docs: KnowledgeDocument[] = [];
  for (const item of raw) {
    if (typeof item === "string") continue;
    if (!item || typeof item !== "object") continue;

    const record = item as Partial<KnowledgeDocument>;
    const text = typeof record.text === "string" ? record.text.trim() : "";
    const name = typeof record.name === "string" ? record.name.trim() : "";
    if (!text || !name) continue;

    docs.push({
      id:
        typeof record.id === "string" && record.id
          ? record.id
          : `kb-${docs.length}-${Date.now()}`,
      name: name.slice(0, 120),
      text: text.slice(0, MAX_KNOWLEDGE_DOC_CHARS),
      uploadedAt:
        typeof record.uploadedAt === "number" ? record.uploadedAt : Date.now(),
    });
  }

  return docs.slice(0, MAX_KNOWLEDGE_DOCS);
}

export function formatUploadedKnowledgeBlock(
  documents: KnowledgeDocument[],
  maxChars = MAX_KNOWLEDGE_PROMPT_CHARS,
): string {
  if (!documents.length) return "";

  const blocks: string[] = [];
  const usableDocuments = documents.filter((doc) => doc.text.trim());
  if (!usableDocuments.length) return "";

  for (const doc of usableDocuments) {
    const header = `[${doc.name}]\n`;
    const budget = Math.min(
      maxChars - header.length,
      MAX_KNOWLEDGE_DOC_CHARS,
    );
    if (budget < 120) break;

    const body = doc.text.trim().slice(0, budget);
    if (!body) continue;

    blocks.push(`${header}${body}`);
  }

  if (!blocks.length) return "";
  return [
    "UPLOADED PLAYBOOKS (authoritative — use these first for product, pricing, objections, competitors, and company facts):",
    blocks.join("\n\n"),
  ].join("\n");
}
