import { useEffect } from "react";
import { getSupabase, isSupabaseConfigured, toAppUser } from "../lib/supabase";
import { syncAccountData } from "../services/account-sync";
import { syncBillingState } from "../services/billing";
import { syncKnowledgeIndex } from "../services/knowledge-index";
import { ensureLegacyOnboardingSkipped } from "../lib/onboarding-flow";
import { useAppStore } from "../store/useAppStore";

/** Tear down Electron session windows when auth disappears. */
async function teardownUnauthenticatedSession(): Promise<void> {
  try {
    useAppStore.getState().setSessionActive(false);
    window.landed?.setSessionListening?.(false);
    await window.landed?.stopSession?.();
    await window.landed?.hideMicHelper?.();
  } catch {
    // Best effort.
  }
  if (useAppStore.getState().isAuthenticated) {
    useAppStore.getState().logout();
  }
  if (
    typeof window.landed?.focusDashboard === "function" &&
    !window.location.hash.includes("/auth")
  ) {
    void window.landed.focusDashboard("/auth");
  } else if (!window.location.hash.includes("/auth")) {
    window.location.hash = "#/auth";
  }
}

/** Restore Supabase session and keep the Zustand auth state in sync. */
export function useAuthBootstrap() {
  useEffect(() => {
    const supabase = getSupabase();
    if (!isSupabaseConfigured() || !supabase) return;

    const syncUser = async (authenticated: boolean, user?: ReturnType<typeof toAppUser>) => {
      if (authenticated && user) {
        useAppStore.getState().setUser(user);
        ensureLegacyOnboardingSkipped();
        await Promise.all([
          syncBillingState(user.id),
          syncAccountData(user.id),
        ]);
        void syncKnowledgeIndex(useAppStore.getState().knowledgeFiles);
      }
    };

    void supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        void syncUser(true, toAppUser(session.user));
      } else if (useAppStore.getState().isAuthenticated) {
        // Persisted Zustand auth without a live Supabase session → clear + close session.
        void teardownUnauthenticatedSession();
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        void syncUser(true, toAppUser(session.user));
        return;
      }
      if (event === "SIGNED_OUT" || useAppStore.getState().isAuthenticated) {
        void teardownUnauthenticatedSession();
      }
    });

    return () => subscription.unsubscribe();
  }, []);
}
