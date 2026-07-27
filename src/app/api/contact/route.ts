import { NextResponse } from "next/server";
import { rateLimit } from "@/lib/api-rate-limit";
import { apiErrorResponse } from "@/lib/api-errors";
import { saveContactSubmission } from "@/lib/save-contact-submission";
import { notifyContactInbox } from "@/lib/notify-contact-email";

const TOPICS = new Set([
  "General support",
  "Privacy requests",
  "Legal notices",
  "Security",
  "Press",
]);

const MAX_NAME = 120;
const MAX_EMAIL = 254;
const MAX_MESSAGE = 5000;

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function POST(request: Request) {
  try {
    const limited = rateLimit(request, {
      scope: "contact",
      limit: 5,
      windowMs: 15 * 60_000,
    });
    if (limited) return limited;

    const body = (await request.json()) as {
      name?: string;
      email?: string;
      topic?: string;
      message?: string;
    };

    const name = body.name?.trim() ?? "";
    const email = body.email?.trim() ?? "";
    const topic = body.topic?.trim() ?? "General support";
    const message = body.message?.trim() ?? "";

    if (!name || name.length > MAX_NAME) {
      return NextResponse.json({ error: "Please enter a valid name." }, { status: 400 });
    }
    if (!email || email.length > MAX_EMAIL || !isValidEmail(email)) {
      return NextResponse.json({ error: "Please enter a valid email." }, { status: 400 });
    }
    if (!TOPICS.has(topic)) {
      return NextResponse.json({ error: "Please choose a valid topic." }, { status: 400 });
    }
    if (!message || message.length > MAX_MESSAGE) {
      return NextResponse.json(
        { error: "Please enter a message (up to 5000 characters)." },
        { status: 400 },
      );
    }

    const submission = { name, email, topic, message };

    try {
      await saveContactSubmission(submission);
    } catch (err) {
      console.error("[contact] Supabase save error:", err);
      return NextResponse.json(
        { error: "Couldn't send your message. Please try again or email us directly." },
        { status: 502 },
      );
    }

    try {
      await notifyContactInbox(submission);
    } catch (err) {
      // Saved to Supabase — inbox email is best-effort.
      console.error("[contact] Inbox notify error:", err);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    const { message, status } = apiErrorResponse(err, "Couldn't send your message.");
    return NextResponse.json({ error: message }, { status });
  }
}
