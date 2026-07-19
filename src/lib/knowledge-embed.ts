import { getOpenAIClient } from "@/lib/openai";
import { OPENAI_MODELS } from "@/lib/openai-config";

export async function embedTexts(texts: string[]): Promise<number[][]> {
  if (!texts.length) return [];

  const openai = getOpenAIClient();
  const { data } = await openai.embeddings.create({
    model: OPENAI_MODELS.embedding,
    input: texts,
  });

  return data
    .sort((a, b) => a.index - b.index)
    .map((row) => row.embedding);
}

export async function embedQuery(query: string): Promise<number[]> {
  const [embedding] = await embedTexts([query]);
  if (!embedding) throw new Error("Embedding failed");
  return embedding;
}
