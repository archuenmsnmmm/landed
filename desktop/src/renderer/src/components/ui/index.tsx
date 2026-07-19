export { BackButton } from "./BackButton";

export function PillButton({
  children,
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={`flex h-[46px] w-full items-center justify-center gap-1 rounded-xl bg-gradient-to-b from-[#4d9cf8] to-[#3b82f6] text-[15px] font-medium text-white shadow-[0_2px_8px_rgba(59,130,246,0.35)] transition-opacity hover:opacity-95 disabled:opacity-50 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

import landedIcon from "../../assets/landed-icon.png";
import landedLogo from "../../assets/landed-logo.png";
import landedMark from "../../assets/landed-mark.png";
import landedWordmark from "../../assets/landed-wordmark.png";
import landedWordmarkLight from "../../assets/landed-wordmark-light.png";

export function LandedLogo({
  className = "",
  variant = "icon",
  tone = "dark",
}: {
  className?: string;
  variant?: "icon" | "mark" | "wordmark";
  tone?: "dark" | "light";
}) {
  if (variant === "wordmark") {
    return (
      <img
        src={tone === "light" ? landedWordmarkLight : landedWordmark}
        alt="Landed"
        draggable={false}
        className={`inline-block shrink-0 object-contain object-left ${className || "h-8 w-auto"}`}
      />
    );
  }

  const src =
    variant === "mark"
      ? tone === "light"
        ? landedMark
        : landedLogo
      : landedIcon;

  return (
    <img
      src={src}
      alt=""
      aria-hidden
      draggable={false}
      className={`inline-block shrink-0 object-contain ${className || "h-8 w-8"}`}
    />
  );
}

export function Button({
  children,
  variant = "primary",
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "landed" | "danger";
}) {
  const styles = {
    primary: "bg-zinc-900 text-white hover:bg-zinc-800",
    secondary: "border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50",
    landed: "text-zinc-600 hover:bg-zinc-100",
    danger: "bg-red-600 text-white hover:bg-red-500",
  };
  return (
    <button
      className={`inline-flex h-10 items-center justify-center rounded-full px-5 text-[13px] font-medium transition-colors disabled:opacity-50 ${styles[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function Input({
  className = "",
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`h-11 w-full rounded-xl border border-zinc-200 bg-white px-4 text-[14px] text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 focus:border-landed-400 focus:ring-2 focus:ring-landed-100 ${className}`}
      {...props}
    />
  );
}

export function Textarea({
  className = "",
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={`w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-[14px] text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 focus:border-landed-400 focus:ring-2 focus:ring-landed-100 ${className}`}
      {...props}
    />
  );
}

export function PageHeader({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="mb-8">
      <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
        {title}
      </h1>
      {description && (
        <p className="mt-2 text-[14px] leading-relaxed text-zinc-500">
          {description}
        </p>
      )}
    </div>
  );
}

export function Switch({
  checked,
  disabled = false,
  size = "md",
  checkedClassName = "bg-landed-500",
  uncheckedClassName = "bg-zinc-200",
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  checked: boolean;
  size?: "sm" | "md";
  checkedClassName?: string;
  uncheckedClassName?: string;
}) {
  const isSm = size === "sm";

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      className={`relative shrink-0 rounded-full transition-colors ${
        isSm ? "h-[22px] w-[38px]" : "h-6 w-11"
      } ${checked ? checkedClassName : uncheckedClassName} ${
        disabled ? "cursor-not-allowed opacity-50" : ""
      } ${className}`}
      {...props}
    >
      <span
        className={`pointer-events-none absolute top-1/2 -translate-y-1/2 rounded-full bg-white transition-all ${
          isSm ? "h-4 w-4 shadow-sm" : "h-5 w-5 shadow"
        } ${
          checked
            ? isSm
              ? "right-[3px] left-auto"
              : "right-0.5 left-auto"
            : isSm
              ? "left-[3px]"
              : "left-0.5"
        }`}
      />
    </button>
  );
}

export function Toggle({
  checked,
  onChange,
  label,
  disabled = false,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <div
      className={`flex w-full items-center justify-between gap-4 rounded-xl border border-zinc-200 bg-white px-4 py-3 transition-colors hover:bg-zinc-50 ${disabled ? "opacity-60" : ""}`}
    >
      <span className="text-[14px] text-zinc-800">{label}</span>
      <Switch
        checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
      />
    </div>
  );
}

export function SelectRow({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-4 rounded-xl border border-zinc-200 bg-white px-4 py-3">
      <span className="text-[14px] text-zinc-800">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-[13px] text-zinc-700 outline-none"
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </label>
  );
}
