import type { Metadata } from "next";
import { Suspense } from "react";
import { LandedApp } from "@/components/app/LandedApp";

export const metadata: Metadata = {
  title: "Landed App — Invisible AI for technical interviews",
  description:
    "Invisible AI for technical interviews — type questions about what’s on your screen. No mic needed.",
};

export default function AppPage() {
  return (
    <Suspense fallback={null}>
      <LandedApp />
    </Suspense>
  );
}
