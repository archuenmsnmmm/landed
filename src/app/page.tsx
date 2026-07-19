import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { MeetingHelp } from "@/components/MeetingHelp";
import { Comparison } from "@/components/Comparison";
import { RealTimeTranscription } from "@/components/RealTimeTranscription";
import { LandingPricing } from "@/components/LandingPricing";
import { FAQ } from "@/components/FAQ";
import { CTA } from "@/components/CTA";
import { Footer } from "@/components/Footer";

export default function Home() {
  return (
    <div className="overflow-hidden bg-white">
      <div className="relative min-h-screen bg-[#d6e4ff]">
        <div className="pointer-events-none absolute inset-x-3 top-3 bottom-0 rounded-[28px] bg-[radial-gradient(ellipse_70%_60%_at_50%_40%,rgba(147,197,253,0.5)_0%,rgba(191,219,254,0.28)_45%,rgba(255,255,255,0.05)_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.5)] md:inset-x-6 md:top-4 md:rounded-[32px]" />
        <div className="relative flex min-h-screen flex-col">
          <Navbar variant="landing" />
          <Hero />
        </div>
      </div>
      <main>
        <MeetingHelp />
        <RealTimeTranscription />
        <Comparison />
        <LandingPricing />
        <FAQ />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}
