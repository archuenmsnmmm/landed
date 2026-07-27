import type { Metadata } from "next";
import { Suspense } from "react";
import { LandedApp } from "@/components/app/LandedApp";

export const metadata: Metadata = {
  title: "Landed App — Never have to debug again",
  description:
    "Never have to debug alone. Landed sees what's on your screen and answers when you type. Download the desktop app for the full experience.",
};

export default function AppPage() {
  return (
    <Suspense fallback={null}>
      <LandedApp />
    </Suspense>
  );
}
