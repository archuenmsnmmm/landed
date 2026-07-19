import { Outlet } from "react-router-dom";
import { LandedLogo } from "../../components/ui";

export function AuthLayout() {
  return (
    <div className="flex min-h-screen bg-white">
      <div className="hidden w-1/2 flex-col justify-between bg-zinc-900 p-12 lg:flex">
        <LandedLogo variant="wordmark" tone="light" className="h-8 w-auto" />
        <div>
          <h2 className="text-3xl font-semibold leading-tight text-white">
            Invisible AI for technical interviews
          </h2>
          <p className="mt-4 max-w-md text-[15px] leading-relaxed text-zinc-400">
            Sees the problem on your screen. Answers when you type. Stays
            hidden from screen share — no mic needed.
          </p>
        </div>
        <p className="text-[12px] text-zinc-600">© Landed · Built for technical interviews</p>
      </div>

      <div className="flex flex-1 items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <LandedLogo variant="wordmark" className="h-8 w-auto" />
          </div>
          <Outlet />
        </div>
      </div>
    </div>
  );
}
