import { getSupabaseAdmin } from "@/lib/supabase-admin";

export type ContactSubmission = {
  name: string;
  email: string;
  topic: string;
  message: string;
};

export async function saveContactSubmission(
  submission: ContactSubmission,
): Promise<void> {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    throw new Error("Supabase is not configured");
  }
  const { error } = await supabase.from("contact_submissions").insert({
    name: submission.name,
    email: submission.email,
    topic: submission.topic,
    message: submission.message,
  });

  if (error) {
    throw new Error(error.message);
  }
}
