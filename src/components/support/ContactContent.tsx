"use client";

import { useState } from "react";
import Link from "next/link";
import { LEGAL, SUPPORT_ROUTES } from "@/content/legal/config";

const contactOptions = [
  {
    title: "General support",
    description: "Product questions, billing, and account help.",
    email: LEGAL.contact.support,
  },
  {
    title: "Privacy requests",
    description: "Data access, deletion, and privacy inquiries.",
    email: LEGAL.contact.privacy,
  },
  {
    title: "Legal notices",
    description: "Terms, compliance, and legal correspondence.",
    email: LEGAL.contact.legal,
  },
  {
    title: "Security",
    description: "Report vulnerabilities or security concerns.",
    email: LEGAL.contact.support,
  },
  {
    title: "Press",
    description: "Media inquiries and press requests.",
    email: LEGAL.contact.support,
  },
];

export function ContactContent() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [topic, setTopic] = useState("General support");
  const [message, setMessage] = useState("");

  const mailtoHref = `mailto:${LEGAL.contact.support}?subject=${encodeURIComponent(
    `[Landed] ${topic}`,
  )}&body=${encodeURIComponent(
    `Name: ${name}\nEmail: ${email}\nTopic: ${topic}\n\n${message}`,
  )}`;

  return (
    <div className="mx-auto max-w-[1200px] px-6 py-16 md:py-24">
      <div className="max-w-3xl">
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
      </div>

      <div className="mt-14 grid gap-12 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-16">
        <form
          className="rounded-2xl border border-[#ececef] bg-white p-6 md:p-8"
          onSubmit={(e) => {
            e.preventDefault();
            window.location.href = mailtoHref;
          }}
        >
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="block">
              <span className="text-[13px] font-medium text-[#0a0a0a]">Name</span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="mt-2 h-11 w-full rounded-xl border border-[#ececef] px-3 text-[14px] outline-none focus:border-[#4b8bf5]"
              />
            </label>
            <label className="block">
              <span className="text-[13px] font-medium text-[#0a0a0a]">Email</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-2 h-11 w-full rounded-xl border border-[#ececef] px-3 text-[14px] outline-none focus:border-[#4b8bf5]"
              />
            </label>
          </div>

          <label className="mt-5 block">
            <span className="text-[13px] font-medium text-[#0a0a0a]">Topic</span>
            <select
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="mt-2 h-11 w-full rounded-xl border border-[#ececef] bg-white px-3 text-[14px] outline-none focus:border-[#4b8bf5]"
            >
              {contactOptions.map((option) => (
                <option key={option.title} value={option.title}>
                  {option.title}
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
              className="mt-2 w-full rounded-xl border border-[#ececef] px-3 py-3 text-[14px] outline-none focus:border-[#4b8bf5]"
              placeholder="Tell us how we can help..."
            />
          </label>

          <button
            type="submit"
            className="mt-6 inline-flex h-11 items-center justify-center rounded-full bg-[#4b8bf5] px-6 text-[14px] font-medium text-white transition-colors hover:bg-[#3d7de8]"
          >
            Send message
          </button>
          <p className="mt-3 text-[12px] text-[#a1a1aa]">
            This opens your email client with your message pre-filled.
          </p>
        </form>

        <aside className="space-y-4">
          {contactOptions.map((option) => (
            <div
              key={option.title}
              className="rounded-2xl border border-[#ececef] bg-[#fafafa] p-5"
            >
              <p className="text-[14px] font-semibold text-[#0a0a0a]">{option.title}</p>
              <p className="mt-1 text-[13px] leading-relaxed text-[#71717a]">
                {option.description}
              </p>
              <a
                href={`mailto:${option.email}`}
                className="mt-3 inline-block text-[14px] font-medium text-[#4b8bf5] hover:text-[#3d7de8]"
              >
                {option.email}
              </a>
            </div>
          ))}

          <div className="rounded-2xl border border-[#ececef] bg-white p-5">
            <p className="text-[14px] font-semibold text-[#0a0a0a]">Help Center</p>
            <p className="mt-1 text-[13px] leading-relaxed text-[#71717a]">
              Browse common questions before reaching out.
            </p>
            <Link
              href={SUPPORT_ROUTES.helpCenter}
              className="mt-3 inline-block text-[14px] font-medium text-[#4b8bf5] hover:text-[#3d7de8]"
            >
              Visit Help Center
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
