import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Landed — Live Demo",
  description:
    "Try Landed’s live demo — ask about the problem on screen and get an answer.",
};

export default function OverlayLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
