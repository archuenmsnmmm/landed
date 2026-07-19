const CHARS_PER_TOKEN = 4;
const CHUNK_CHARS = 500 * CHARS_PER_TOKEN;
const OVERLAP_CHARS = 50 * CHARS_PER_TOKEN;

export function chunkDocumentText(text: string): string[] {
  const normalized = text.replace(/\r\n/g, "\n").trim();
  if (!normalized) return [];

  const paragraphs = normalized.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  if (!paragraphs.length) return [];

  const chunks: string[] = [];
  let current = "";

  for (const para of paragraphs) {
    if (current.length + para.length + 2 <= CHUNK_CHARS) {
      current = current ? `${current}\n\n${para}` : para;
      continue;
    }

    if (current) {
      chunks.push(current);
      const tail = current.slice(-OVERLAP_CHARS);
      current = tail ? `${tail}\n\n${para}` : para;
    } else {
      for (let i = 0; i < para.length; i += CHUNK_CHARS - OVERLAP_CHARS) {
        chunks.push(para.slice(i, i + CHUNK_CHARS));
      }
      current = "";
    }
  }

  if (current.trim()) chunks.push(current.trim());
  return chunks.filter((c) => c.length >= 40);
}

export function estimateTokenCount(text: string): number {
  return Math.ceil(text.length / CHARS_PER_TOKEN);
}
