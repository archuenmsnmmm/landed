import { HashRouter, Navigate, Route, Routes } from "react-router-dom";
import { useEffect } from "react";
import { useAuthBootstrap } from "./hooks/useAuthBootstrap";
import { useAuthCallback } from "./hooks/useAuthCallback";
import { useBillingReturn } from "./hooks/useBillingReturn";
import { usePaywallEnforcement } from "./hooks/usePaywallEnforcement";
import { useStoreHydrated } from "./hooks/useStoreHydrated";
import { bootstrapOpenAIKey } from "./services/whisper";
import { resolveApiBase } from "./lib/billing-api-base";
import { funnelStateFromStore, getOnboardingFunnelRoute } from "./lib/onboarding-flow";
import { MicHelperApp } from "./mic/MicHelperApp";
import { useAppStore } from "./store/useAppStore";
import { AuthPage } from "./pages/auth/AuthPage";
import { FunnelRedirect } from "./pages/onboarding/OnboardingGuard";
import { OnboardingPage } from "./pages/onboarding/OnboardingPage";
import { PaywallPage } from "./pages/paywall/PaywallPage";
import { OverlayApp } from "./overlay/OverlayApp";
import { SettingsShell } from "./pages/dashboard/SettingsShell";

function useFunnelRedirect(): string | null {
  return getOnboardingFunnelRoute(funnelStateFromStore());
}

function RootRedirect() {
  const isAuthenticated = useAppStore((s) => s.isAuthenticated);
  const funnelRoute = useFunnelRedirect();
  if (!isAuthenticated) return <Navigate to="/auth" replace />;
  if (funnelRoute) return <Navigate to={funnelRoute} replace />;
  return <Navigate to="/" replace />;
}

function AppGuard() {
  const isAuthenticated = useAppStore((s) => s.isAuthenticated);
  const funnelRoute = useFunnelRedirect();
  usePaywallEnforcement();

  if (!isAuthenticated) return <Navigate to="/auth" replace />;
  if (funnelRoute) return <Navigate to={funnelRoute} replace />;

  return <SettingsShell />;
}

function AppRoutes() {
  const hydrated = useStoreHydrated();
  const raw = window.location.hash.replace(/^#/, "") || "/";
  const hash = raw.startsWith("/") ? raw : `/${raw}`;
  if (hash.startsWith("/mic-helper")) return <MicHelperApp />;
  if (hash.startsWith("/overlay")) return <OverlayApp />;

  // Wait for persist so returning users never flash auth/onboarding.
  if (!hydrated) return null;

  return (
    <Routes>
      <Route path="/welcome" element={<Navigate to="/auth" replace />} />
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/onboarding" element={<OnboardingPage />} />
      <Route path="/try" element={<FunnelRedirect />} />
      <Route path="/paywall" element={<PaywallPage />} />
      <Route path="/" element={<AppGuard />} />
      <Route path="/upcoming" element={<Navigate to="/" replace />} />
      <Route path="/meetings/:id" element={<Navigate to="/" replace />} />
      <Route path="/*" element={<RootRedirect />} />
    </Routes>
  );
}

function AppShell() {
  useBillingReturn();
  useAuthCallback();
  return <AppRoutes />;
}

export default function App() {
  useAuthBootstrap();

  useEffect(() => {
    void bootstrapOpenAIKey();
    void resolveApiBase();
  }, []);

  return (
    <HashRouter>
      <AppShell />
    </HashRouter>
  );
}
