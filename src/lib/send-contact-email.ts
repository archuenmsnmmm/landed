import nodemailer from "nodemailer";
import { LEGAL } from "@/content/legal/config";

export type ContactEmailPayload = {
  name: string;
  email: string;
  topic: string;
  message: string;
};

type SmtpConfig = {
  host: string;
  port: number;
  user: string;
  pass: string;
};

export function getContactSmtpConfig(): SmtpConfig | null {
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS?.trim();
  if (!user || !pass) return null;

  const host = process.env.SMTP_HOST?.trim() || "smtp.gmail.com";
  const port = Number(process.env.SMTP_PORT?.trim() || "587");
  if (!Number.isFinite(port) || port <= 0) return null;

  return { host, port, user, pass };
}

export async function sendContactEmail(payload: ContactEmailPayload): Promise<void> {
  const smtp = getContactSmtpConfig();
  if (!smtp) {
    throw new Error("SMTP not configured");
  }

  const to = process.env.CONTACT_TO_EMAIL?.trim() || LEGAL.contact.support;
  const fromName = process.env.CONTACT_FROM_NAME?.trim() || "Landed Contact";

  const transporter = nodemailer.createTransport({
    host: smtp.host,
    port: smtp.port,
    secure: smtp.port === 465,
    auth: {
      user: smtp.user,
      pass: smtp.pass,
    },
  });

  await transporter.sendMail({
    from: `"${fromName}" <${smtp.user}>`,
    to,
    replyTo: payload.email,
    subject: `[Landed] ${payload.topic} — ${payload.name}`,
    text: [
      `Name: ${payload.name}`,
      `Email: ${payload.email}`,
      `Topic: ${payload.topic}`,
      "",
      payload.message,
    ].join("\n"),
  });
}
