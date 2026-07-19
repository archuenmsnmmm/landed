import { getSupabase, isSupabaseConfigured } from "./supabase";
import { useAppStore } from "../store/useAppStore";

/**
 * Fully tear down an active Landed session and sign the user out.
 * Closes overlay, stops mic helper, clears auth, and routes to /auth.
 */
export async function signOutLanded(options?: {
  navigate?: (path: string) => void;
}): Promise<void> {
  try {
    useAppStore.getState().setSessionActive(false);
    window.landed?.setSessionListening?.(false);
    await window.landed?.stopSession?.();
    await window.landed?.hideMicHelper?.();
  } catch {
    // Best effort — continue to clear auth even if windows are already gone.
  }

  useAppStore.getState().logout();

  if (isSupabaseConfigured()) {
    try {
      await getSupabase()?.auth.signOut();
    } catch {
      // Ignore sign-out network errors; local auth is already cleared.
    }
  }

  if (typeof window.landed?.focusDashboard === "function") {
    try {
      await window.landed.focusDashboard("/auth");
      return;
    } catch {
      // Fall through to hash navigation.
    }
  }

  if (options?.navigate) {
    options.navigate("/auth");
    return;
  }

  if (!window.location.hash.includes("/auth")) {
    window.location.hash = "#/auth";
  }
}
