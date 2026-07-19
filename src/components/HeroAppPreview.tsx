"use client";

import Image from "next/image";

export function HeroAppPreview() {
  return (
    <div className="relative mx-auto w-full max-w-[1200px] px-6">
      <div className="relative overflow-hidden rounded-[12px] shadow-[0_28px_80px_rgba(15,23,42,0.14)]">
        <Image
          src="/landed-hero-leetcode-full.png"
          alt="Landed invisible AI overlay during a technical interview"
          width={2816}
          height={1762}
          priority
          draggable={false}
          className="h-auto w-full"
        />
      </div>
    </div>
  );
}
