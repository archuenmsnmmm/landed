import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getSupabase,
  toAppUser,
  isSupabaseConfigured,
  isGoogleAuthEnabled,
} from "../../lib/supabase";
import {
  recordTermsAcceptance,
  termsAcceptanceMetadata,
} from "../../lib/legal-acceptance";
import {
  ensureLegacyOnboardingSkipped,
  funnelStateFromStore,
  getOnboardingFunnelRoute,
} from "../../lib/onboarding-flow";
import { hasLocalAccountProfile } from "../../services/account-sync";
import { useAppStore } from "../../store/useAppStore";
import { OnboardingShell } from "../../components/onboarding/OnboardingShell";
import { PillButton, LandedLogo } from "../../components/ui";
import { legalLinks, openLegalLink } from "../../lib/legal-urls";
import { getOAuthRedirectTo } from "../../lib/oauth-redirect";
import { LANDED_MARKETING_ORIGIN } from "../../lib/landed-urls";

type Mode = "signin" | "signup";
type Step = "welcome" | "email";

const AUTH_NOT_CONFIGURED_MESSAGE = import.meta.env.DEV
  ? "Sign-in is not configured. Add Supabase credentials to desktop/.env and restart the app."
  : "Sign-in is temporarily unavailable. Download the latest app from https://landed-ai.com/download or contact landed.support@gmail.com.";

export function AuthPage() {
  const navigate = useNavigate();
  const login = useAppStore((s) => s.login);
  const isAuthenticated = useAppStore((s) => s.isAuthenticated);
  const [step, setStep] = useState<Step>("welcome");
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const configured = isSupabaseConfigured();

  useEffect(() => {
    void window.landed?.setDashboardLayout?.("onboarding");
  }, []);

  // Show the host only when sign-in is actually needed (not for returning users).
  useEffect(() => {
    if (isAuthenticated) return;
    void window.landed?.focusDashboard?.("/auth");
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return;
    const next = getOnboardingFunnelRoute(funnelStateFromStore());
    navigate(next ?? "/", { replace: true });
  }, [isAuthenticated, navigate]);

  const afterAuth = useCallback(
    async (
      userEmail: string,
      name?: string,
      isNewAccount = false,
      userId?: string,
      avatar?: string,
    ) => {
      login(userEmail, name, userId, avatar, isNewAccount);
      if (userId) {
        try {
          const { syncAccountData } = await import("../../services/account-sync");
          await syncAccountData(userId);
        } catch {
          // Local profile still works offline.
        }
        try {
          const { syncBillingState } = await import("../../services/billing");
          await syncBillingState(userId);
        } catch {
          // Billing sync also runs on paywall/dashboard, so auth can continue.
        }
      }

      ensureLegacyOnboardingSkipped();

      const next = getOnboardingFunnelRoute(funnelStateFromStore());
      navigate(next ?? "/");
    },
    [login, navigate],
  );

  const handleOAuthCallback = useCallback(
    async (url: string) => {
      const supabase = getSupabase();
      if (!supabase) return;

      setError(null);
      setLoading(true);
      try {
        const parsed = new URL(url);
        const oauthError =
          parsed.searchParams.get("error_description") ??
          parsed.searchParams.get("error");
        if (oauthError) {
          setError(decodeURIComponent(oauthError.replace(/\+/g, " ")));
          return;
        }
        const code = parsed.searchParams.get("code");
        if (code) {
          const { data, error } =
            await supabase.auth.exchangeCodeForSession(code);
          if (error || !data.user) {
            setError("OAuth callback failed");
            return;
          }
          const u = toAppUser(data.user);
          const oauthLooksNew =
            data.user.created_at === data.user.last_sign_in_at;
          const isNew = oauthLooksNew && !hasLocalAccountProfile(u.id);
          if (isNew) {
            await recordTermsAcceptance(u.id);
          }
          await afterAuth(u.email, u.name, isNew, u.id, u.avatar);
          return;
        }

        const hashParams = new URLSearchParams(url.split("#")[1] ?? "");
        const accessToken = hashParams.get("access_token");
        const refreshToken = hashParams.get("refresh_token");
        if (!accessToken) {
          setError("OAuth callback failed");
          return;
        }
        const { data, error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken ?? "",
        });
        if (error || !data.user) {
          setError("OAuth callback failed");
          return;
        }
        const u = toAppUser(data.user);
        const oauthLooksNew =
          data.user.created_at === data.user.last_sign_in_at;
        const isNew = oauthLooksNew && !hasLocalAccountProfile(u.id);
        if (isNew) {
          await recordTermsAcceptance(u.id);
        }
        await afterAuth(u.email, u.name, isNew, u.id, u.avatar);
      } catch (e) {
        setError(e instanceof Error ? e.message : "OAuth callback failed");
      } finally {
        setLoading(false);
      }
    },
    [afterAuth],
  );

  useEffect(() => {
    return window.landed?.onAuthCallback?.((url) => {
      void handleOAuthCallback(url);
    });
  }, [handleOAuthCallback]);

  const handleGoogle = async () => {
    setError(null);
    setLoading(true);
    try {
      if (!configured) {
        throw new Error(AUTH_NOT_CONFIGURED_MESSAGE);
      }
      const supabase = getSupabase();
      if (!supabase) {
        throw new Error(AUTH_NOT_CONFIGURED_MESSAGE);
      }
      const googleEnabled = await isGoogleAuthEnabled();
      if (!googleEnabled) {
        throw new Error(
          "Google sign-in is not enabled yet. Ask your admin to enable Google in Supabase Auth and add the OAuth client secret.",
        );
      }
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: getOAuthRedirectTo(),
          skipBrowserRedirect: true,
        },
      });
      if (error) throw error;
      if (data.url) {
        await window.landed?.openExternal?.(data.url);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Google sign-in failed");
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (!configured) {
        throw new Error(AUTH_NOT_CONFIGURED_MESSAGE);
      }
      const supabase = getSupabase();
      if (!supabase) {
        throw new Error(AUTH_NOT_CONFIGURED_MESSAGE);
      }
      if (!email.trim()) {
        throw new Error("Enter your email address.");
      }
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: termsAcceptanceMetadata(),
          },
        });
        if (error) throw error;
        if (data.user && !data.user.identities?.length) {
          setError("An account with this email already exists. Sign in instead.");
          return;
        }
        if (data.session) {
          const u = toAppUser(data.user!);
          await recordTermsAcceptance(u.id);
          await afterAuth(u.email, u.name, true, u.id, u.avatar);
        } else {
          setSent(true);
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        const u = toAppUser(data.user);
        await afterAuth(u.email, u.name, false, u.id, u.avatar);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const legalFooter = (
    <p className="min-w-0 break-words text-center text-[11px] leading-relaxed text-zinc-400">
      By signing in, you agree to our{" "}
      <button
        type="button"
        onClick={() => openLegalLink(legalLinks.terms)}
        className="text-zinc-500 underline decoration-zinc-300 hover:text-zinc-700"
      >
        Terms of Service
      </button>{" "}
      and{" "}
      <button
        type="button"
        onClick={() => openLegalLink(legalLinks.privacy)}
        className="text-zinc-500 underline decoration-zinc-300 hover:text-zinc-700"
      >
        Privacy Policy
      </button>
      .
    </p>
  );

  if (sent) {
    return (
      <OnboardingShell footer={legalFooter}>
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-100 text-2xl">
          ✉️
        </div>
        <h1 className="mt-5 text-[24px] font-semibold tracking-[-0.025em] text-zinc-900">
          Check your email
        </h1>
        <p className="mt-2 max-w-xs text-[14px] leading-relaxed text-zinc-500">
          We sent a confirmation link to{" "}
          <span className="font-medium text-zinc-800">{email}</span>.
        </p>
        <button
          type="button"
          onClick={() => {
            setSent(false);
            setStep("email");
          }}
          className="mt-8 text-[13px] font-medium text-zinc-400 hover:text-zinc-600"
        >
          ← Back
        </button>
      </OnboardingShell>
    );
  }

  if (step === "email") {
    return (
      <OnboardingShell footer={legalFooter}>
        <LandedLogo variant="mark" className="h-14 w-14" />
        <h1 className="mt-5 text-[24px] font-semibold leading-tight tracking-[-0.025em] text-zinc-900">
          {mode === "signup" ? "Create your account" : "Log in with email"}
        </h1>
        <p className="mt-2 text-[14px] text-zinc-500">
          {mode === "signup"
            ? "Ask anything about what’s on your screen"
            : "Enter your email and password to continue"}
        </p>

        <form
          onSubmit={(e) => void handleEmailAuth(e)}
          className="mt-7 flex w-full flex-col gap-3"
        >
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email address"
            className="h-[46px] w-full rounded-xl border border-zinc-200 bg-white px-4 text-[14px] text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100"
          />
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            minLength={8}
            className="h-[46px] w-full rounded-xl border border-zinc-200 bg-white px-4 text-[14px] text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100"
          />

          {error ? (
            <p className="rounded-xl bg-red-50 px-3 py-2 text-[12px] text-red-600">
              {error}
            </p>
          ) : null}

          <PillButton type="submit" disabled={loading} className="mt-1">
            {loading
              ? "Please wait…"
              : mode === "signup"
                ? "Create account"
                : "Sign in"}
          </PillButton>
        </form>

        <p className="mt-5 text-[13px] text-zinc-500">
          {mode === "signup" ? (
            <>
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => {
                  setMode("signin");
                  setError(null);
                }}
                className="font-medium text-zinc-900 underline decoration-zinc-300 hover:decoration-zinc-600"
              >
                Sign in
              </button>
            </>
          ) : (
            <>
              Don&apos;t have an account?{" "}
              <button
                type="button"
                onClick={() => {
                  setMode("signup");
                  setError(null);
                }}
                className="font-medium text-zinc-900 underline decoration-zinc-300 hover:decoration-zinc-600"
              >
                Sign up
              </button>
            </>
          )}
        </p>

        <button
          type="button"
          onClick={() => {
            setStep("welcome");
            setError(null);
          }}
          className="mt-4 text-[13px] font-medium text-zinc-400 hover:text-zinc-600"
        >
          ← Back
        </button>
      </OnboardingShell>
    );
  }

  return (
    <OnboardingShell
      footer={
        <div className="flex flex-col items-center gap-4">
          <button
            type="button"
            onClick={() => void window.landed?.openExternal?.(LANDED_MARKETING_ORIGIN)}
            className="inline-flex items-center gap-1.5 text-[13px] text-zinc-500 transition-colors hover:text-zinc-700"
          >
            New to Landed? Learn more
            <ExternalLinkIcon />
          </button>
          {legalFooter}
        </div>
      }
    >
      <LandedLogo variant="mark" className="h-14 w-14" />
      <h1 className="mt-5 text-[24px] font-semibold leading-tight tracking-[-0.025em] text-zinc-900">
        Welcome to Landed
      </h1>
      <p className="mt-2 text-[14px] text-zinc-500">
        Your AI assistant for what’s on screen
      </p>

      <div className="mt-8 flex w-full flex-col gap-3">
        <button
          type="button"
          onClick={() => void handleGoogle()}
          disabled={loading}
          className="flex h-[46px] w-full items-center justify-center gap-2.5 rounded-xl border border-zinc-200 bg-zinc-50 text-[14px] font-medium text-zinc-800 transition-colors hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <GoogleIcon />
          Continue with Google
        </button>

        <button
          type="button"
          onClick={() => {
            setStep("email");
            setError(null);
          }}
          disabled={loading}
          className="flex h-[46px] w-full items-center justify-center gap-2.5 rounded-xl bg-gradient-to-b from-[#4d9cf8] to-[#3b82f6] text-[14px] font-medium text-white shadow-[0_2px_8px_rgba(59,130,246,0.35)] transition-opacity hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <MailIcon />
          Log in with email &amp; password
        </button>
      </div>

      {error ? (
        <p className="mt-4 w-full rounded-xl bg-red-50 px-3 py-2 text-[12px] text-red-600">
          {error}
        </p>
      ) : null}
    </OnboardingShell>
  );
}

function GoogleIcon() {
  return (
    <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg
      className="h-4 w-4 shrink-0"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 7.5A1.5 1.5 0 0 1 4.5 6h15A1.5 1.5 0 0 1 21 7.5v9a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 16.5v-9Z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m4 8 8 5 8-5"
      />
    </svg>
  );
}

function ExternalLinkIcon() {
  return (
    <svg
      className="h-3.5 w-3.5 shrink-0"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M13.5 6H18a1.5 1.5 0 0 1 1.5 1.5V12M18 6l-7.5 7.5M10.5 6H6A1.5 1.5 0 0 0 4.5 7.5v10.5A1.5 1.5 0 0 0 6 19.5h10.5A1.5 1.5 0 0 0 18 18v-4.5"
      />
    </svg>
  );
}
