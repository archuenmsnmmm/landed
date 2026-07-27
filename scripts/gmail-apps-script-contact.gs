/**
 * Google Apps Script for Landed contact form email (no Gmail app password needed).
 *
 * Setup:
 *   1. Sign in to the Gmail account that should SEND mail (e.g. landed.support@gmail.com)
 *   2. Open https://script.google.com/create
 *   3. Paste this entire file, replace YOUR_WEBHOOK_SECRET with CONTACT_WEBHOOK_SECRET from .env
 *   4. Deploy → New deployment → Web app
 *      - Execute as: Me
 *      - Who has access: Anyone
 *   5. Copy the web app URL → CONTACT_APPS_SCRIPT_URL on Vercel + .env
 *
 * Or run: node scripts/setup-contact-email.mjs
 */

const WEBHOOK_SECRET = "YOUR_WEBHOOK_SECRET";

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    if (body.secret !== WEBHOOK_SECRET) {
      return jsonResponse({ ok: false, error: "Unauthorized" }, 401);
    }

    const to = body.to || "landed.support@gmail.com";
    const subject = body.subject || "Landed contact form";
    const text = body.text || "";
    const replyTo = body.replyTo || "";

    GmailApp.sendEmail(to, subject, text, {
      replyTo: replyTo || undefined,
      name: "Landed Contact",
    });

    return jsonResponse({ ok: true });
  } catch (err) {
    return jsonResponse(
      { ok: false, error: err instanceof Error ? err.message : "Send failed" },
      500,
    );
  }
}

function jsonResponse(payload, statusCode) {
  const output = ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(
    ContentService.MimeType.JSON,
  );
  // Apps Script web apps don't support HTTP status codes in doPost return;
  // the client checks payload.ok instead.
  return output;
}
