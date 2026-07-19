import klavioPreview from "../../assets/onboarding/klavio.png";

export function WelcomePreview() {
  return (
    <div className="flex h-full w-full min-h-0 flex-col">
      <p className="shrink-0 w-full px-8 pt-10 text-center text-[15px] font-semibold tracking-[-0.01em] text-zinc-500">
        Invisible AI for technical interviews —
        <br />
        see the problem, stay off screen share
      </p>

      <div className="relative mt-6 min-h-0 flex-1 overflow-hidden pr-6 pb-6">
        <img
          src={klavioPreview}
          alt="Landed overlay during a technical interview"
          className="h-full w-full select-none rounded-r-[28px] object-cover object-left"
          draggable={false}
        />
      </div>
    </div>
  );
}
