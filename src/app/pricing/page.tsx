import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { PricingContent } from "@/components/PricingContent";
import { FAQ } from "@/components/FAQ";
import { CTA } from "@/components/CTA";
import { PRICING_FAQS } from "@/content/pricing-faq";
import { PRICING_PAGE_BG_CLASS } from "@/lib/brand";

export default function PricingPage() {
  return (
    <div className={PRICING_PAGE_BG_CLASS}>
      <Navbar variant="pricing" />
      <main className="pt-[72px]">
        <section>
          <div className="mx-auto flex max-w-[1200px] flex-col items-center px-6 py-20 md:py-28">
            <PricingContent />
          </div>
        </section>
        <FAQ faqs={PRICING_FAQS} id="pricing-faq" className={PRICING_PAGE_BG_CLASS} />
        <CTA className={PRICING_PAGE_BG_CLASS} showGlow={false} />
      </main>
      <Footer className={PRICING_PAGE_BG_CLASS} />
    </div>
  );
}
