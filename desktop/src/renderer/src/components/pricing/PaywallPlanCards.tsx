import type { ReactNode } from "react";
import type { BillingInterval } from "../../lib/pricing";
import type { BillingCurrency } from "../../lib/regional-pricing";
import {
  LIFETIME_CARD_FEATURES,
  PRO_CARD_FEATURES,
  getAnnualDiscountPercent,
  priceForInterval,
  priceForLifetime,
} from "../../lib/pricing";

export type PricingTone = "light" | "dark";

function InfinityIcon({ className }: { className?: string }) {
  return <span className={`inline-block text-[13px] leading-none ${className ?? ""}`}>∞</span>;
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
  );
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.25}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function BillingToggle({
  interval,
  onChange,
  currency = "usd",
  compact = false,
  tone = "light",
}: {
  interval: BillingInterval;
  onChange: (interval: BillingInterval) => void;
  currency?: BillingCurrency;
  compact?: boolean;
  tone?: PricingTone;
}) {
  const discountPercent = getAnnualDiscountPercent(currency);
  const dark = tone === "dark";

  return (
    <div
      className={`inline-flex items-center gap-1 rounded-full ${compact ? "p-0.5" : "p-1"} ${
        dark ? "bg-white/[0.08]" : "bg-zinc-200/80"
      }`}
    >
      <button
        type="button"
        onClick={() => onChange("monthly")}
        className={`rounded-full font-medium transition-all ${
          compact ? "px-3 py-1 text-[11px]" : "px-5 py-2 text-[13px]"
        } ${
          interval === "monthly"
            ? dark
              ? "bg-white/[0.14] text-white shadow-sm"
              : "bg-white text-zinc-900 shadow-sm"
            : dark
              ? "text-zinc-400 hover:text-zinc-200"
              : "text-zinc-500 hover:text-zinc-700"
        }`}
      >
        Monthly
      </button>
      <button
        type="button"
        onClick={() => onChange("annual")}
        className={`flex items-center gap-1.5 rounded-full font-medium transition-all ${
          compact ? "px-3 py-1 text-[11px]" : "gap-2 px-5 py-2 text-[13px]"
        } ${
          interval === "annual"
            ? dark
              ? "bg-white/[0.14] text-white shadow-sm"
              : "bg-white text-zinc-900 shadow-sm"
            : dark
              ? "text-zinc-400 hover:text-zinc-200"
              : "text-zinc-500 hover:text-zinc-700"
        }`}
      >
        Annual
        <span
          className={`rounded-full font-semibold ${
            compact ? "px-1.5 py-px text-[9px]" : "px-2 py-0.5 text-[11px]"
          } ${
            dark
              ? "bg-[#93c5fd] text-[#1e3a8a]"
              : "bg-[#3b82f6] text-white"
          }`}
        >
          Save {discountPercent}%
        </span>
      </button>
    </div>
  );
}

function UpgradeButton({
  variant,
  loading,
  isCurrent = false,
  showDiscount,
  discountPercent,
  onClick,
  compact = false,
}: {
  variant: "light" | "blue";
  loading: boolean;
  isCurrent?: boolean;
  showDiscount: boolean;
  discountPercent: number;
  onClick: () => void;
  compact?: boolean;
}) {
  const isLight = variant === "light";

  return (
    <button
      type="button"
      disabled={loading || isCurrent}
      onClick={onClick}
      className={`flex w-full items-center justify-center gap-2 font-semibold transition-opacity disabled:cursor-default disabled:opacity-70 ${
        compact ? "h-11 rounded-xl text-[13px]" : "h-12 rounded-2xl text-[15px]"
      } ${
        isLight
          ? "bg-white text-zinc-900 hover:bg-white/95"
          : "bg-gradient-to-b from-[#5aa7f9] to-[#3b82f6] text-white hover:opacity-95"
      }`}
    >
      {loading ? (
        <span
          className={`animate-spin rounded-full border-2 border-t-transparent ${
            compact ? "h-3.5 w-3.5" : "h-4 w-4"
          } ${isLight ? "border-zinc-900" : "border-white"}`}
        />
      ) : isCurrent ? (
        "Current plan"
      ) : (
        <>
          Upgrade
          {showDiscount ? (
            <span
              className={`rounded-full font-bold ${
                compact ? "px-1.5 py-px text-[10px]" : "px-2 py-0.5 text-[11px]"
              } ${
                isLight
                  ? "bg-[#dbeafe] text-[#3b82f6]"
                  : "bg-white/20 text-white"
              }`}
            >
              -{discountPercent}%
            </span>
          ) : null}
        </>
      )}
    </button>
  );
}

function FeatureIcon({
  icon,
  tone,
  compact = false,
}: {
  icon: "infinity" | "check" | "plus";
  tone: "blue" | "light" | "muted";
  compact?: boolean;
}) {
  const size = compact ? "h-4 w-4" : "h-[18px] w-[18px]";
  const circleSize = compact ? "h-6 w-6" : "h-7 w-7";
  const color =
    tone === "blue"
      ? "text-white/90"
      : tone === "muted"
        ? "text-zinc-200"
        : "text-zinc-700";
  const circle =
    tone === "blue"
      ? "border border-white/30"
      : tone === "muted"
        ? "border border-white/15 bg-white/[0.06]"
        : "border border-zinc-200 bg-zinc-50";

  return (
    <div className={`flex ${circleSize} shrink-0 items-center justify-center rounded-full ${circle}`}>
      {icon === "infinity" ? (
        <InfinityIcon className={`${color} ${compact ? "text-[12px]" : "text-[14px]"}`} />
      ) : icon === "plus" ? (
        <PlusIcon className={`shrink-0 ${color} ${size}`} />
      ) : (
        <CheckIcon className={`shrink-0 ${color} ${size}`} />
      )}
    </div>
  );
}

export function PricingCardsRow({
  className = "",
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={`flex w-full items-stretch gap-4 ${className}`}>
      {children}
    </div>
  );
}

export function PricingCardColumn({ children }: { children: ReactNode }) {
  return <div className="flex min-h-0 min-w-0 flex-1 flex-col self-stretch [&>*]:h-full">{children}</div>;
}

/** Bottom free-plan link — keeps Starter available without a third card. */
export function FreePlanLink({
  onSelect,
  disabled = false,
  label,
  detail,
  tone = "light",
}: {
  onSelect: () => void;
  disabled?: boolean;
  label?: string;
  detail?: string;
  tone?: PricingTone;
}) {
  const buttonLabel = label ?? "Continue free";
  const dark = tone === "dark";
  return (
    <div className="flex flex-col items-center gap-1.5 text-center">
      {detail ? (
        <p className={`text-[12px] leading-relaxed ${dark ? "text-zinc-500" : "text-zinc-500"}`}>
          {detail}
        </p>
      ) : null}
      <button
        type="button"
        disabled={disabled}
        onClick={onSelect}
        className={`text-[13px] font-medium underline underline-offset-2 transition-colors disabled:cursor-default disabled:opacity-50 disabled:no-underline ${
          dark
            ? "text-zinc-400 decoration-zinc-600 hover:text-zinc-200 hover:decoration-zinc-400"
            : "text-zinc-600 decoration-zinc-300 hover:text-zinc-900 hover:decoration-zinc-500"
        }`}
      >
        {buttonLabel}
      </button>
    </div>
  );
}

export function ProPlanCard({
  interval,
  loading,
  isCurrent = false,
  currency = "usd",
  onSelect,
  onManageBilling,
  portalLoading = false,
  compact = false,
  disabled = false,
  ctaLabel,
  tone = "light",
}: {
  interval: BillingInterval;
  loading: boolean;
  isCurrent?: boolean;
  currency?: BillingCurrency;
  onSelect: () => void;
  onManageBilling?: () => void;
  portalLoading?: boolean;
  compact?: boolean;
  disabled?: boolean;
  ctaLabel?: string;
  tone?: PricingTone;
}) {
  const { current, original } = priceForInterval("pro", interval, currency);
  const showDiscount = interval === "annual";
  const discountPercent = getAnnualDiscountPercent(currency);
  const manageCurrent = Boolean(isCurrent && onManageBilling && !ctaLabel);
  const locked = disabled || Boolean(ctaLabel);
  const dark = tone === "dark";

  if (dark) {
    return (
      <div
        className={`relative flex h-full w-full flex-col bg-gradient-to-b from-[#5aa7f9] to-[#3b82f6] shadow-[0_20px_50px_rgba(59,130,246,0.22)] ${
          compact
            ? "min-h-[380px] rounded-2xl p-5"
            : "min-h-[440px] rounded-[22px] p-7"
        }`}
      >
        <p className={`font-semibold text-white/90 ${compact ? "text-[14px]" : "text-[16px]"}`}>
          Pro plan
        </p>

        <div className={`flex items-baseline gap-2 ${compact ? "mt-3" : "mt-4"}`}>
          {original ? (
            <span className={`text-white/45 line-through ${compact ? "text-[12px]" : "text-[14px]"}`}>
              {original}
            </span>
          ) : null}
          <span
            className={`font-bold leading-none tracking-[-0.03em] text-white ${
              compact ? "text-[28px]" : "text-[36px]"
            }`}
          >
            {current}
          </span>
          <span className={`text-white/70 ${compact ? "text-[12px]" : "text-[14px]"}`}>/month</span>
        </div>

        <div className={`border-t border-white/20 ${compact ? "mt-4 pt-4" : "mt-5 pt-5"}`} />

        <ul className={`flex-1 ${compact ? "space-y-3" : "space-y-3.5"}`}>
          {PRO_CARD_FEATURES.map((feature) => {
            const isIncludes = feature.label.startsWith("Everything in");
            return (
              <li key={feature.label} className={`flex items-center ${compact ? "gap-2.5" : "gap-3"}`}>
                <FeatureIcon
                  icon={isIncludes ? "plus" : feature.icon}
                  tone="blue"
                  compact={compact}
                />
                <span
                  className={`leading-snug text-white/95 ${compact ? "text-[12px]" : "text-[14px]"}`}
                >
                  {feature.label}
                </span>
              </li>
            );
          })}
        </ul>

        <div className={compact ? "mt-6" : "mt-8"}>
          {manageCurrent ? (
            <button
              type="button"
              disabled={portalLoading}
              onClick={onManageBilling}
              className={`flex w-full items-center justify-center gap-2 bg-white font-semibold text-zinc-900 transition-opacity hover:bg-white/95 disabled:cursor-default disabled:opacity-70 ${
                compact ? "h-11 rounded-xl text-[13px]" : "h-12 rounded-2xl text-[15px]"
              }`}
            >
              {portalLoading ? (
                <span
                  className={`animate-spin rounded-full border-2 border-zinc-900 border-t-transparent ${
                    compact ? "h-3.5 w-3.5" : "h-4 w-4"
                  }`}
                />
              ) : null}
              {portalLoading ? "Opening…" : "Manage Billing"}
            </button>
          ) : locked ? (
            <button
              type="button"
              disabled
              className={`flex w-full items-center justify-center bg-white/90 font-semibold text-zinc-900 disabled:cursor-default disabled:opacity-70 ${
                compact ? "h-11 rounded-xl text-[13px]" : "h-12 rounded-2xl text-[15px]"
              }`}
            >
              {ctaLabel ?? "Current plan"}
            </button>
          ) : (
            <UpgradeButton
              variant="light"
              loading={loading}
              isCurrent={isCurrent}
              showDiscount={showDiscount}
              discountPercent={discountPercent}
              onClick={onSelect}
              compact={compact}
            />
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`relative flex h-full w-full flex-col border border-zinc-200 bg-white shadow-[0_12px_40px_rgba(0,0,0,0.06)] ${
        compact
          ? "min-h-[380px] rounded-2xl p-5"
          : "min-h-[440px] rounded-[22px] p-7"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <p className={`font-semibold text-zinc-900 ${compact ? "text-[14px]" : "text-[16px]"}`}>
          Pro
        </p>
        {showDiscount ? (
          <span
            className={`shrink-0 font-medium text-[#3b82f6] ${
              compact ? "text-[11px]" : "text-[13px]"
            }`}
          >
            Save {discountPercent}%
          </span>
        ) : null}
      </div>

      <div className={`flex items-baseline gap-2 ${compact ? "mt-3" : "mt-4"}`}>
        {original ? (
          <span className={`text-zinc-400 line-through ${compact ? "text-[12px]" : "text-[14px]"}`}>
            {original}
          </span>
        ) : null}
        <span
          className={`font-bold leading-none tracking-[-0.03em] text-zinc-900 ${
            compact ? "text-[28px]" : "text-[36px]"
          }`}
        >
          {current}
        </span>
        <span className={`text-zinc-500 ${compact ? "text-[12px]" : "text-[14px]"}`}>/ month</span>
      </div>

      <ul className={`flex-1 ${compact ? "mt-6 space-y-3" : "mt-8 space-y-3.5"}`}>
        {PRO_CARD_FEATURES.map((feature) => {
          const isIncludes = feature.label.startsWith("Everything in");
          return (
            <li key={feature.label} className={`flex items-center ${compact ? "gap-2.5" : "gap-3"}`}>
              <FeatureIcon
                icon={isIncludes ? "plus" : feature.icon}
                tone="light"
                compact={compact}
              />
              <span
                className={`leading-snug text-zinc-700 ${compact ? "text-[12px]" : "text-[14px]"}`}
              >
                {feature.label}
              </span>
            </li>
          );
        })}
      </ul>

      <div className={compact ? "mt-6" : "mt-8"}>
        {manageCurrent ? (
          <button
            type="button"
            disabled={portalLoading}
            onClick={onManageBilling}
            className={`flex w-full items-center justify-center gap-2 bg-gradient-to-b from-[#5aa7f9] to-[#3b82f6] font-semibold text-white transition-opacity hover:opacity-95 disabled:cursor-default disabled:opacity-70 ${
              compact ? "h-11 rounded-xl text-[13px]" : "h-12 rounded-2xl text-[15px]"
            }`}
          >
            {portalLoading ? (
              <span
                className={`animate-spin rounded-full border-2 border-white border-t-transparent ${
                  compact ? "h-3.5 w-3.5" : "h-4 w-4"
                }`}
              />
            ) : null}
            {portalLoading ? "Opening…" : "Manage billing"}
          </button>
        ) : locked ? (
          <button
            type="button"
            disabled
            className={`flex w-full items-center justify-center bg-gradient-to-b from-[#5aa7f9] to-[#3b82f6] font-semibold text-white disabled:cursor-default disabled:opacity-70 ${
              compact ? "h-11 rounded-xl text-[13px]" : "h-12 rounded-2xl text-[15px]"
            }`}
          >
            {ctaLabel ?? "Current plan"}
          </button>
        ) : (
          <UpgradeButton
            variant="blue"
            loading={loading}
            isCurrent={isCurrent}
            showDiscount={showDiscount}
            discountPercent={discountPercent}
            onClick={onSelect}
            compact={compact}
          />
        )}
      </div>
    </div>
  );
}

export function LifetimePlanCard({
  loading,
  isCurrent = false,
  currency = "usd",
  onSelect,
  compact = false,
  tone = "light",
}: {
  loading: boolean;
  isCurrent?: boolean;
  currency?: BillingCurrency;
  onSelect: () => void;
  compact?: boolean;
  tone?: PricingTone;
}) {
  const { current, original, discountPercent } = priceForLifetime(currency);
  const dark = tone === "dark";

  if (dark) {
    return (
      <div
        className={`relative flex h-full w-full flex-col border border-zinc-200 bg-white shadow-[0_12px_40px_rgba(0,0,0,0.08)] ${
          compact
            ? "min-h-[380px] rounded-2xl p-5"
            : "min-h-[440px] rounded-[22px] p-7"
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <p className={`font-semibold text-zinc-900 ${compact ? "text-[14px]" : "text-[16px]"}`}>
            Lifetime
          </p>
          <span
            className={`shrink-0 rounded-full bg-zinc-100 px-2 py-0.5 font-medium text-zinc-600 ${
              compact ? "text-[10px]" : "text-[12px]"
            }`}
          >
            Popular
          </span>
        </div>

        <div className={`flex items-baseline gap-2 ${compact ? "mt-3" : "mt-4"}`}>
          <span className={`text-zinc-400 line-through ${compact ? "text-[12px]" : "text-[14px]"}`}>
            {original}
          </span>
          <span
            className={`font-bold leading-none tracking-[-0.03em] text-zinc-900 ${
              compact ? "text-[28px]" : "text-[36px]"
            }`}
          >
            {current}
          </span>
          <span className={`text-zinc-500 ${compact ? "text-[12px]" : "text-[14px]"}`}>once</span>
        </div>

        <div className={`border-t border-zinc-100 ${compact ? "mt-4 pt-4" : "mt-5 pt-5"}`} />

        <ul className={`flex-1 ${compact ? "space-y-3" : "space-y-3.5"}`}>
          {LIFETIME_CARD_FEATURES.map((feature) => {
            const isIncludes = feature.label.startsWith("Everything in");
            return (
              <li key={feature.label} className={`flex items-center ${compact ? "gap-2.5" : "gap-3"}`}>
                <FeatureIcon
                  icon={isIncludes ? "plus" : feature.icon}
                  tone="light"
                  compact={compact}
                />
                <span
                  className={`leading-snug text-zinc-700 ${compact ? "text-[12px]" : "text-[14px]"}`}
                >
                  {feature.label}
                </span>
              </li>
            );
          })}
        </ul>

        <div className={compact ? "mt-6" : "mt-8"}>
          <UpgradeButton
            variant="blue"
            loading={loading}
            isCurrent={isCurrent}
            showDiscount
            discountPercent={discountPercent}
            onClick={onSelect}
            compact={compact}
          />
        </div>
      </div>
    );
  }

  return (
    <div
      className={`relative flex h-full w-full flex-col bg-gradient-to-b from-[#4d9aff] to-[#3b82f6] shadow-[0_20px_50px_rgba(59,130,246,0.18)] ${
        compact
          ? "min-h-[380px] rounded-2xl p-5"
          : "min-h-[440px] rounded-[22px] p-7"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <p className={`font-semibold text-white ${compact ? "text-[14px]" : "text-[16px]"}`}>
          Lifetime
        </p>
        <span
          className={`shrink-0 font-medium text-white/85 ${
            compact ? "text-[11px]" : "text-[13px]"
          }`}
        >
          Best value · -{discountPercent}%
        </span>
      </div>

      <div className={`flex items-baseline gap-2 ${compact ? "mt-3" : "mt-4"}`}>
        <span className={`text-white/50 line-through ${compact ? "text-[12px]" : "text-[14px]"}`}>
          {original}
        </span>
        <span
          className={`font-bold leading-none tracking-[-0.03em] text-white ${
            compact ? "text-[28px]" : "text-[36px]"
          }`}
        >
          {current}
        </span>
        <span className={`text-white/70 ${compact ? "text-[12px]" : "text-[14px]"}`}>once</span>
      </div>

      <ul className={`flex-1 ${compact ? "mt-6 space-y-3" : "mt-8 space-y-3.5"}`}>
        {LIFETIME_CARD_FEATURES.map((feature) => {
          const isIncludes = feature.label.startsWith("Everything in");
          return (
            <li key={feature.label} className={`flex items-center ${compact ? "gap-2.5" : "gap-3"}`}>
              <FeatureIcon
                icon={isIncludes ? "plus" : feature.icon}
                tone="blue"
                compact={compact}
              />
              <span
                className={`leading-snug text-white/95 ${compact ? "text-[12px]" : "text-[14px]"}`}
              >
                {feature.label}
              </span>
            </li>
          );
        })}
      </ul>

      <div className={compact ? "mt-6" : "mt-8"}>
        <UpgradeButton
          variant="light"
          loading={loading}
          isCurrent={isCurrent}
          showDiscount
          discountPercent={discountPercent}
          onClick={onSelect}
          compact={compact}
        />
      </div>
    </div>
  );
}
