import { getSupabaseAdmin } from "@/lib/supabase-admin";

export type PriorCallSummary = {
  date: string;
  title: string;
  summary: string;
  nextSteps: string[];
  objections: string[];
  dealOutcome: string;
};

export async function fetchPriorCallContext(
  userId: string,
  company: string,
  limit = 3,
): Promise<string> {
  const supabase = getSupabaseAdmin();
  if (!supabase || !company.trim()) return "";

  const { data, error } = await supabase
    .from("meetings")
    .select("title, call_date, summary, next_steps, objections, deal_outcome")
    .eq("user_id", userId)
    .ilike("company", `%${company.trim()}%`)
    .order("call_date", { ascending: false })
    .limit(limit);

  if (error || !data?.length) return "";

  const lines = data.map((m) => {
    const date = m.call_date
      ? new Date(m.call_date).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        })
      : "prior";
    const summary = (m.summary ?? "").slice(0, 200);
    const nextSteps = Array.isArray(m.next_steps)
      ? (m.next_steps as string[]).slice(0, 3).join(", ")
      : "";
    const objections = Array.isArray(m.objections)
      ? (m.objections as string[]).slice(0, 3).join(", ")
      : "";
    return `- ${date} (${m.title || "session"}): ${summary || "No summary"}. Open items: ${nextSteps || "none"}. Difficult questions: ${objections || "none"}. Outcome: ${m.deal_outcome ?? "open"}.`;
  });

  return `PRIOR TECHNICAL INTERVIEWS WITH ${company.trim().toUpperCase()}:\n${lines.join("\n")}`;
}
