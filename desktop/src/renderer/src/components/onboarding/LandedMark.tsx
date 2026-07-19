import landedMark from "../../assets/landed-mark.png";

export function LandedMark() {
  return (
    <img
      src={landedMark}
      alt=""
      aria-hidden
      draggable={false}
      className="inline-block h-8 w-8 shrink-0 object-contain"
    />
  );
}
