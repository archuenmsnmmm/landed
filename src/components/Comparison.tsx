import Image from "next/image";
import { LandedLogo } from "./LandedLogo";

type Cell = "yes" | "no" | "partial";

type Feature = {
  label: string;
  icon: "mic" | "desktop" | "share" | "transcript" | "gift" | "apps";
  values: [Cell, Cell, Cell, Cell]; // Landed, Cluely, Final Round, LockedIn
};

const features: Feature[] = [
  {
    label: "Built for technical interviews",
    icon: "desktop",
    values: ["yes", "yes", "yes", "yes"],
  },
  {
    label: "Sees the problem on your screen",
    icon: "transcript",
    values: ["yes", "yes", "yes", "yes"],
  },
  {
    label: "Type questions — no mic needed",
    icon: "mic",
    values: ["yes", "partial", "partial", "partial"],
  },
  {
    label: "Invisible on screen share",
    icon: "share",
    values: ["yes", "partial", "partial", "partial"],
  },
  {
    label: "Free plan to start",
    icon: "gift",
    values: ["yes", "yes", "partial", "no"],
  },
  {
    label: "Works over any technical interview app",
    icon: "apps",
    values: ["yes", "yes", "yes", "yes"],
  },
];

const competitors = [
  {
    name: "Cluely",
    logo: "/competitors/cluely.png",
    logoClassName: "h-5 w-5 rounded-full object-contain",
  },
  {
    name: "Final Round",
    logo: "/competitors/finalround.png",
    logoClassName: "h-5 w-5 rounded-[5px] object-contain",
  },
  {
    name: "LockedIn",
    logo: "/competitors/lockedin.png",
    logoClassName: "h-5 w-5 rounded-[5px] object-contain",
  },
] as const;

export function Comparison() {
  return (
    <section id="comparison" className="border-t border-[#f0f0f2] bg-white">
      <div className="mx-auto max-w-[1200px] px-6 py-24 md:py-32">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between md:gap-12">
          <h2 className="max-w-[520px] text-[2rem] font-semibold leading-[1.15] tracking-[-0.03em] text-[#0a0a0a] md:text-[2.5rem]">
            The proof is in the comparison
          </h2>
          <p className="max-w-[400px] text-[15px] leading-[1.55] text-[#71717a] md:pb-1 md:text-right md:text-[16px]">
            Invisible AI for technical interviews — Landed sees your screen, answers
            when you type, and stays off screen share.
          </p>
        </div>

        <div className="mt-12 overflow-x-auto pb-2 md:mt-14">
          <div className="min-w-[740px] overflow-hidden rounded-[18px] border border-[#e4e4e7]">
            {/* Header */}
            <div className="grid grid-cols-[minmax(240px,1.7fr)_repeat(4,minmax(112px,1fr))] border-b border-[#e4e4e7] bg-[#f7f8fa]">
              <div className="flex items-center px-5 py-4">
                <span className="text-[13px] font-medium text-[#52525b]">
                  Product features
                </span>
              </div>

              <div className="relative flex items-center justify-center px-3 py-4">
                <div className="absolute inset-y-0 inset-x-1 rounded-t-[14px] border border-b-0 border-[#bfdbfe] bg-[#eff6ff]" />
                <div className="relative z-10 flex items-center gap-2">
                  <LandedLogo className="h-5 w-5" variant="mark" />
                  <span className="text-[14px] font-semibold tracking-[-0.02em] text-[#0a0a0a]">
                    Landed
                  </span>
                </div>
              </div>

              {competitors.map((competitor) => (
                <div
                  key={competitor.name}
                  className="flex items-center justify-center gap-2 px-3 py-4"
                >
                  <Image
                    src={competitor.logo}
                    alt=""
                    width={20}
                    height={20}
                    className={competitor.logoClassName}
                    draggable={false}
                  />
                  <span className="truncate text-[13px] font-medium text-[#3f3f46]">
                    {competitor.name}
                  </span>
                </div>
              ))}
            </div>

            {/* Rows */}
            {features.map((feature, rowIndex) => {
              const isLast = rowIndex === features.length - 1;
              return (
                <div
                  key={feature.label}
                  className={`grid grid-cols-[minmax(240px,1.7fr)_repeat(4,minmax(112px,1fr))] ${
                    isLast ? "" : "border-b border-[#e4e4e7]"
                  }`}
                >
                  <div className="flex items-center gap-3 bg-white px-5 py-4">
                    <FeatureIcon name={feature.icon} />
                    <span className="text-[14px] font-medium text-[#0a0a0a]">
                      {feature.label}
                    </span>
                  </div>

                  <div className="relative flex items-center justify-center px-3 py-4">
                    <div
                      className={`absolute inset-x-1 inset-y-0 border-x border-[#bfdbfe] bg-[#eff6ff] ${
                        isLast ? "bottom-1 rounded-b-[14px] border-b" : ""
                      }`}
                    />
                    <div className="relative z-10">
                      <StatusIcon value={feature.values[0]} highlighted />
                    </div>
                  </div>

                  {feature.values.slice(1).map((value, i) => (
                    <div
                      key={`${feature.label}-${i}`}
                      className="flex items-center justify-center bg-white px-3 py-4"
                    >
                      <StatusIcon value={value} />
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

function StatusIcon({
  value,
  highlighted = false,
}: {
  value: Cell;
  highlighted?: boolean;
}) {
  if (value === "yes") {
    if (highlighted) {
      return (
        <span
          className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#4b8bf5] text-white shadow-[0_1px_2px_rgba(75,139,245,0.35)]"
          aria-label="Supported"
        >
          <CheckIcon className="h-3.5 w-3.5" />
        </span>
      );
    }
    return (
      <span className="text-[#18181b]" aria-label="Supported">
        <CheckIcon className="h-4 w-4" strokeWidth={2.2} />
      </span>
    );
  }

  if (value === "partial") {
    return (
      <span
        className="text-[#a1a1aa]"
        aria-label="Limited or paid only"
        title="Limited or paid only"
      >
        <DashIcon className="h-4 w-4" />
      </span>
    );
  }

  return (
    <span className="text-[#ef4444]" aria-label="Not supported">
      <XIcon className="h-4 w-4" />
    </span>
  );
}

function FeatureIcon({ name }: { name: Feature["icon"] }) {
  const className = "h-4 w-4 shrink-0 text-[#71717a]";
  switch (name) {
    case "mic":
      return <MicIcon className={className} />;
    case "desktop":
      return <DesktopIcon className={className} />;
    case "share":
      return <ShareIcon className={className} />;
    case "transcript":
      return <TranscriptIcon className={className} />;
    case "gift":
      return <GiftIcon className={className} />;
    case "apps":
      return <AppsIcon className={className} />;
  }
}

function CheckIcon({
  className,
  strokeWidth = 2,
}: {
  className?: string;
  strokeWidth?: number;
}) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" aria-hidden>
      <path
        d="M3.5 8.2 6.4 11l6.1-6.5"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" aria-hidden>
      <path
        d="M4 4l8 8M12 4l-8 8"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function DashIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" aria-hidden>
      <path d="M4 8h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function MicIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" aria-hidden>
      <rect x="5.5" y="1.5" width="5" height="8" rx="2.5" stroke="currentColor" strokeWidth="1.4" />
      <path d="M3.5 7.5a4.5 4.5 0 0 0 9 0" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M8 12v2.5M5.5 14.5h5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function DesktopIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" aria-hidden>
      <rect x="1.5" y="2.5" width="13" height="8.5" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
      <path d="M5.5 14h5M8 11v3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function ShareIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" aria-hidden>
      <rect x="1.5" y="2.5" width="13" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
      <path d="M5 14h6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <path
        d="M8 7.5V5m0 0 1.5 1.5M8 5 6.5 6.5"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function TranscriptIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" aria-hidden>
      <path d="M3.5 2.5h9v11h-9z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M5.5 5.5h5M5.5 8h5M5.5 10.5h3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function GiftIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" aria-hidden>
      <rect x="2.5" y="6.5" width="11" height="7" rx="1" stroke="currentColor" strokeWidth="1.4" />
      <path d="M2.5 9.5h11M8 6.5v7" stroke="currentColor" strokeWidth="1.4" />
      <path
        d="M8 6.5c-1.5-2.5-4-1.5-4 0s2.5 1.5 4 0Zm0 0c1.5-2.5 4-1.5 4 0s-2.5 1.5-4 0Z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function AppsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" aria-hidden>
      <rect x="2" y="2" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.4" />
      <rect x="9" y="2" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.4" />
      <rect x="2" y="9" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.4" />
      <rect x="9" y="9" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}
