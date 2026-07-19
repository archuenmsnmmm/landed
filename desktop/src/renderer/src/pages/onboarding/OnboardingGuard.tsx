import { Navigate } from "react-router-dom";
import { getOnboardingFunnelRoute, funnelStateFromStore } from "../../lib/onboarding-flow";
import { useAppStore } from "../../store/useAppStore";

/** Redirect legacy funnel URLs into the current auth → screen → paywall flow. */
export function FunnelRedirect() {
  const isAuthenticated = useAppStore((s) => s.isAuthenticated);

  if (!isAuthenticated) return <Navigate to="/auth" replace />;

  const next = getOnboardingFunnelRoute(funnelStateFromStore());
  return <Navigate to={next ?? "/"} replace />;
}
