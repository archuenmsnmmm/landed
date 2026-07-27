import { getSupabaseAdmin } from "@/lib/supabase-admin";

/** USD per token — keep in sync with OpenAI list pricing. */
const MODEL_USD_PER_TOKEN: Record<
  string,
  { input: number; output: number }
> = {
  "gpt-4o-mini": { input: 0.15 / 1_000_000, output: 0.6 / 1_000_000 },
  "gpt-4.1-mini": { input: 0.4 / 1_000_000, output: 1.6 / 1_000_000 },
  "gpt-4o": { input: 2.5 / 1_000_000, output: 10 / 1_000_000 },
  "text-embedding-3-small": { input: 0.02 / 1_000_000, output: 0 },
};

export function estimateOpenAiCostUsd(
  model: string,
  promptTokens: number,
  completionTokens: number,
): number {
  const rates = MODEL_USD_PER_TOKEN[model] ?? MODEL_USD_PER_TOKEN["gpt-4o-mini"]!;
  const input = Math.max(0, promptTokens) * rates.input;
  const output = Math.max(0, completionTokens) * rates.output;
  return Math.round((input + output) * 1_000_000) / 1_000_000;
}

export async function recordAiUsage(params: {
  userId: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
}): Promise<void> {
  const costUsd = estimateOpenAiCostUsd(
    params.model,
    params.promptTokens,
    params.completionTokens,
  );

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    console.warn("[ai-usage] Supabase admin unavailable — skipping cost record");
    return;
  }

  const { error } = await supabase.rpc("record_ai_usage", {
    p_user_id: params.userId,
    p_prompt_tokens: Math.floor(params.promptTokens),
    p_completion_tokens: Math.floor(params.completionTokens),
    p_cost_usd: costUsd,
  });

  if (error) {
    console.error("[ai-usage] record_ai_usage failed:", error);
  }
}
