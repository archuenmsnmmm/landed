import { Suspense } from "react";
import { AuthCallbackRedirect } from "./AuthCallbackRedirect";

export const dynamic = "force-dynamic";

export default function AuthCallbackPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center px-6 text-center">
      <h1 className="text-2xl font-semibold text-zinc-900">Signing you in</h1>
      <p className="mt-3 text-[15px] leading-relaxed text-zinc-600">
        Opening Landed…
      </p>
      <Suspense fallback={null}>
        <AuthCallbackRedirect />
      </Suspense>
    </main>
  );
}
