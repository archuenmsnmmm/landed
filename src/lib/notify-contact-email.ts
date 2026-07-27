import { LEGAL } from "@/content/legal/config";

export type ContactEmailPayload = {
  name: string;
  email: string;
  topic: string;
  message: string;
};

function buildEmailText(payload: ContactEmailPayload): string {
  return [
    `Name: ${payload.name}`,
    `Email: ${payload.email}`,
    `Topic: ${payload.topic}`,
    "",
    payload.message,
  ].join("\n");
}

export function getContactAppsScriptUrl(): string | null {
  const url = process.env.CONTACT_APPS_SCRIPT_URL?.trim();
  return url && url.startsWith("https://script.google.com/") ? url : null;
}

export function getContactWebhookSecret(): string | null {
  const secret = process.env.CONTACT_WEBHOOK_SECRET?.trim();
  return secret && secret.length >= 16 ? secret : null;
}

/** Send via Google Apps Script web app (no Gmail app password required). */
export async function sendContactViaAppsScript(payload: ContactEmailPayload): Promise<void> {
  const url = getContactAppsScriptUrl();
  const secret = getContactWebhookSecret();
  if (!url || !secret) {
    throw new Error("Apps Script contact webhook not configured");
  }

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      secret,
      to: process.env.CONTACT_TO_EMAIL?.trim() || LEGAL.contact.support,
      subject: `[Landed] ${payload.topic} — ${payload.name}`,
      replyTo: payload.email,
      text: buildEmailText(payload),
    }),
    signal: AbortSignal.timeout(15_000),
  });

  const data = (await response.json().catch(() => ({}))) as { ok?: boolean; error?: string };
  if (!response.ok || !data.ok) {
    throw new Error(data.error || `Apps Script webhook failed (${response.status})`);
  }
}

export async function notifyContactInbox(payload: ContactEmailPayload): Promise<void> {
  const appsScriptUrl = getContactAppsScriptUrl();
  const webhookSecret = getContactWebhookSecret();

  if (appsScriptUrl && webhookSecret) {
    await sendContactViaAppsScript(payload);
    return;
  }

  const { getContactSmtpConfig, sendContactEmail } = await import("@/lib/send-contact-email");
  if (getContactSmtpConfig()) {
    await sendContactEmail(payload);
  }
}
