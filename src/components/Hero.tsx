"use client";

import { motion } from "framer-motion";
import { HeroAppPreview } from "./HeroAppPreview";
import { DetectedDownloadButton } from "./DownloadLink";
import { BRAND_BLUE } from "@/lib/brand";

const primaryButtonClassName =
  "inline-flex h-12 shrink-0 items-center justify-center gap-2.5 whitespace-nowrap rounded-full bg-gradient-to-b from-[#5BA3F0] to-[#3B7FD4] px-7 text-[15px] font-medium text-white shadow-[0_6px_20px_rgba(74,144,226,0.45),inset_0_1px_0_rgba(255,255,255,0.28),inset_0_-1px_0_rgba(0,0,0,0.12)] transition-[filter,transform] hover:brightness-[1.05] active:translate-y-px";

export function Hero() {
  return (
    <section
      id="download"
      className="relative flex flex-1 flex-col overflow-hidden pb-0 pt-14 md:pt-20"
    >
      <div className="relative z-10 mx-auto w-full max-w-[1200px] px-6">
        <div className="max-w-[720px]">
          <motion.h1
            className="text-balance text-[2.35rem] font-semibold leading-[1.08] tracking-[-0.04em] text-[#0a0a0a] sm:text-[3rem] md:text-[3.5rem]"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            Give yourself an unfair advantage
            <span
              className="mb-[0.18em] ml-[0.12em] inline-block h-[0.22em] w-[0.22em] align-baseline"
              style={{ backgroundColor: BRAND_BLUE }}
              aria-hidden
            />
          </motion.h1>

          <motion.p
            className="mt-5 max-w-[520px] text-[15px] leading-relaxed text-[#5c6b7a] sm:text-[17px] md:mt-6"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.06, ease: [0.22, 1, 0.36, 1] }}
          >
            The No. 1 Undetectable AI For Technical Interviews
          </motion.p>

          <motion.div
            className="mt-8 flex flex-wrap items-center gap-3 md:mt-10"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
          >
            <DetectedDownloadButton className={primaryButtonClassName} />
          </motion.div>
        </div>
      </div>

      <motion.div
        className="relative mt-14 w-full flex-1 md:mt-20"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.65, delay: 0.18, ease: [0.22, 1, 0.36, 1] }}
      >
        <HeroAppPreview />
      </motion.div>
    </section>
  );
}
