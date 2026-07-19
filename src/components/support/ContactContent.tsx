"use client";

import { useState } from "react";
import { LEGAL } from "@/content/legal/config";

const topics = [
  "General support",
  "Privacy requests",
  "Legal notices",
  "Security",
  "Press",
] as const;

type Status = "idle" | "sending" | "success" | "error";

export function ContactContent() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [topic, setTopic] = useState<(typeof topics)[number]>("General support");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setError("");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, topic, message }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };

      if (!res.ok) {
        setStatus("error");
        setError(data.error || "Couldn't send your message. Please try again.");
        return;
      }

      setStatus("success");
      setName("");
      setEmail("");
      setTopic("General support");
      setMessage("");
    } catch {
      setStatus("error");
      setError("Couldn't send your message. Please try again.");
    }
  }

  return (
    <div className="mx-auto max-w-[720px] px-6 py-16 md:py-24">
      <div>
        <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[#a1a1aa]">
          Support
        </p>
        <h1 className="mt-3 text-[2.25rem] font-semibold leading-[1.1] tracking-[-0.03em] text-[#0a0a0a] md:text-[2.75rem]">
          Contact Us
        </h1>
        <p className="mt-4 text-[16px] leading-relaxed text-[#71717a]">
          Have a question, need help with your account, or want to report an
          issue? We&apos;re here to help.
        </p>
        <p className="mt-3 text-[15px] leading-relaxed text-[#71717a]">
          Any questions? Contact our email{" "}
          <a
            href={`mailto:${LEGAL.contact.support}`}
            className="font-medium text-[#4b8bf5] hover:text-[#3d7de8]"
          >
            {LEGAL.contact.support}
          </a>
          .
        </p>
      </div>

      <form
        className="mt-14 rounded-2xl border border-[#ececef] bg-white p-6 md:p-8"
        onSubmit={handleSubmit}
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <label className="block">
            <span className="text-[13px] font-medium text-[#0a0a0a]">Name</span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              maxLength={120}
              disabled={status === "sending"}
              className="mt-2 h-11 w-full rounded-xl border border-[#ececef] px-3 text-[14px] outline-none focus:border-[#4b8bf5] disabled:opacity-60"
            />
          </label>
          <label className="block">
            <span className="text-[13px] font-medium text-[#0a0a0a]">Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              maxLength={254}
              disabled={status === "sending"}
              className="mt-2 h-11 w-full rounded-xl border border-[#ececef] px-3 text-[14px] outline-none focus:border-[#4b8bf5] disabled:opacity-60"
            />
          </label>
        </div>

        <label className="mt-5 block">
          <span className="text-[13px] font-medium text-[#0a0a0a]">Topic</span>
          <select
            value={topic}
            onChange={(e) => setTopic(e.target.value as (typeof topics)[number])}
            disabled={status === "sending"}
            className="mt-2 h-11 w-full rounded-xl border border-[#ececef] bg-white px-3 text-[14px] outline-none focus:border-[#4b8bf5] disabled:opacity-60"
          >
            {topics.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        <label className="mt-5 block">
          <span className="text-[13px] font-medium text-[#0a0a0a]">Message</span>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
            rows={6}
            maxLength={5000}
            disabled={status === "sending"}
            className="mt-2 w-full rounded-xl border border-[#ececef] px-3 py-3 text-[14px] outline-none focus:border-[#4b8bf5] disabled:opacity-60"
            placeholder="Tell us how we can help..."
          />
        </label>

        <button
          type="submit"
          disabled={status === "sending"}
          className="mt-6 inline-flex h-11 items-center justify-center rounded-full bg-[#4b8bf5] px-6 text-[14px] font-medium text-white transition-colors hover:bg-[#3d7de8] disabled:opacity-60"
        >
          {status === "sending" ? "Sending…" : "Send message"}
        </button>

        {status === "success" && (
          <p className="mt-3 text-[13px] text-[#16a34a]">
            Message sent — we&apos;ll get back to you soon.
          </p>
        )}
        {status === "error" && error && (
          <p className="mt-3 text-[13px] text-[#dc2626]">{error}</p>
        )}
      </form>
    </div>
  );
}
