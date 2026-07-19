import Image from "next/image";

const MARK = { width: 436, height: 436 } as const;
const WORDMARK = { width: 1871, height: 404 } as const;
const ICON = { width: 28, height: 28 } as const;

export function LandedLogo({
  className = "h-7 w-7",
  variant = "icon",
  tone = "dark",
  priority = false,
}: {
  className?: string;
  variant?: "icon" | "mark" | "wordmark";
  tone?: "dark" | "light";
  priority?: boolean;
}) {
  if (variant === "wordmark") {
    return (
      <Image
        src={tone === "light" ? "/landed-wordmark-light.png" : "/landed-wordmark.png"}
        alt="Landed"
        width={WORDMARK.width}
        height={WORDMARK.height}
        priority={priority}
        draggable={false}
        className={`inline-block shrink-0 object-contain object-left ${className || "h-7 w-auto"}`}
      />
    );
  }

  if (variant === "mark") {
    const src = tone === "light" ? "/landed-mark.png" : "/landed-logo.png";
    return (
      <Image
        src={src}
        alt=""
        width={MARK.width}
        height={MARK.height}
        aria-hidden
        priority={priority}
        draggable={false}
        className={`inline-block shrink-0 object-contain ${className}`}
      />
    );
  }

  return (
    <Image
      src={tone === "light" ? "/landed-mark.png" : "/landed-logo.png"}
      alt=""
      width={ICON.width}
      height={ICON.height}
      aria-hidden
      priority={priority}
      draggable={false}
      className={`inline-block shrink-0 object-contain ${className}`}
    />
  );
}
