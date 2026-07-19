import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiJson } from "../../lib/api-client";
import { signOutLanded } from "../../lib/sign-out-landed";
import { getSupabase } from "../../lib/supabase";
import { openStripeBillingPortal } from "../../services/billing";
import { normalizeDisplayPlan } from "../../lib/pricing";
import { isPaidPlan } from "../../store/types";
import { useAppStore } from "../../store/useAppStore";

const PANEL_BG = "#ffffff";
const PANEL_BORDER = "rgba(0,0,0,0.08)";

const fieldClass =
  "w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-[13px] text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-zinc-400";

function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-4">
      <h2 className="text-[17px] font-semibold tracking-[-0.01em] text-zinc-900">{title}</h2>
      {subtitle ? (
        <p className="mt-1 text-[13px] leading-relaxed text-zinc-500">{subtitle}</p>
      ) : null}
    </div>
  );
}

function PanelCard({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="rounded-2xl px-4 py-4"
      style={{ background: PANEL_BG, border: `1px solid ${PANEL_BORDER}` }}
    >
      {children}
    </div>
  );
}

function ActionButton({
  label,
  onClick,
  disabled,
  variant = "default",
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  variant?: "default" | "danger" | "primary";
}) {
  const styles =
    variant === "danger"
      ? "border-red-300 text-red-600 hover:bg-red-50"
      : variant === "primary"
        ? "border-blue-500 bg-blue-500 text-white hover:bg-blue-600"
        : "border-zinc-200 text-zinc-800 hover:bg-zinc-50";

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex items-center justify-center rounded-lg px-3.5 py-1.5 text-[12px] font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${styles}`}
      style={{ borderWidth: 1, borderStyle: "solid" }}
    >
      {label}
    </button>
  );
}

export function AccountPanel({
  onOpenBilling,
}: {
  /** Switch to the Billing settings tab (plans / upgrade). */
  onOpenBilling: () => void;
}) {
  const navigate = useNavigate();
  const user = useAppStore((s) => s.user);
  const plan = useAppStore((s) => s.plan);
  const displayPlan = normalizeDisplayPlan(plan);
  const paid = isPaidPlan(plan);

  const [hasPasswordLogin, setHasPasswordLogin] = useState(true);
  const [authProviders, setAuthProviders] = useState<string[]>([]);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordBusy, setPasswordBusy] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);

  const [portalLoading, setPortalLoading] = useState(false);
  const [portalError, setPortalError] = useState<string | null>(null);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) return;
    void supabase.auth.getUser().then(({ data }) => {
      const identities = data.user?.identities ?? [];
      const providers = identities.map((i) => i.provider).filter(Boolean);
      setAuthProviders(providers);
      setHasPasswordLogin(
        providers.includes("email") ||
          data.user?.app_metadata?.provider === "email",
      );
    });
  }, []);

  const email = user?.email?.trim() || "";
  const signedInLabel = email || "your account";

  const handleChangePassword = async () => {
    setPasswordError(null);
    setPasswordSuccess(null);

    if (newPassword.length < 8) {
      setPasswordError("New password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match.");
      return;
    }

    const supabase = getSupabase();
    if (!supabase || !email) {
      setPasswordError("Sign in again to change your password.");
      return;
    }

    setPasswordBusy(true);
    try {
      if (hasPasswordLogin) {
        if (!currentPassword) {
          setPasswordError("Enter your current password.");
          return;
        }
        const { error: reauthError } = await supabase.auth.signInWithPassword({
          email,
          password: currentPassword,
        });
        if (reauthError) {
          setPasswordError("Current password is incorrect.");
          return;
        }
      }

      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        setPasswordError(error.message || "Could not update password.");
        return;
      }

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setHasPasswordLogin(true);
      setPasswordSuccess(
        hasPasswordLogin
          ? "Password updated."
          : "Password set. You can sign in with email and password.",
      );
    } catch (err) {
      setPasswordError(
        err instanceof Error && err.message.trim()
          ? err.message
          : "Could not update password.",
      );
    } finally {
      setPasswordBusy(false);
    }
  };

  const handleManageBilling = async () => {
    if (!user?.id) {
      setPortalError("Sign in to manage billing.");
      return;
    }
    if (!paid) {
      onOpenBilling();
      return;
    }

    setPortalError(null);
    setPortalLoading(true);
    try {
      const result = await openStripeBillingPortal(user.id);
      if (!result.ok) {
        // Lifetime / missing Stripe portal — send them to the Billing tab.
        if (displayPlan === "lifetime") {
          onOpenBilling();
          return;
        }
        setPortalError(result.error);
      }
    } catch (err) {
      setPortalError(
        err instanceof Error && err.message.trim()
          ? err.message
          : "Could not open billing portal. Try again.",
      );
    } finally {
      setPortalLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!email || deleteConfirm.trim().toLowerCase() !== email.toLowerCase()) {
      setDeleteError("Type your email exactly to confirm.");
      return;
    }

    setDeleteError(null);
    setDeleteBusy(true);
    try {
      const result = await apiJson<{ ok?: boolean }>("/api/account/delete", {
        method: "POST",
      });
      if (!result.ok) {
        setDeleteError(result.error || "Could not delete account.");
        return;
      }

      await signOutLanded({
        navigate: (path) => navigate(path, { replace: true }),
      });
    } catch (err) {
      setDeleteError(
        err instanceof Error && err.message.trim()
          ? err.message
          : "Could not delete account.",
      );
    } finally {
      setDeleteBusy(false);
    }
  };

  const providerNote =
    authProviders.includes("google") && !hasPasswordLogin
      ? "You signed in with Google. Set a password below if you also want email sign-in."
      : authProviders.includes("google")
        ? "Signed in with Google and email/password."
        : "Signed in with email and password.";

  return (
    <div className="space-y-8">
      <section>
        <SectionHeader
          title="Account"
          subtitle={`Logged in as ${signedInLabel}`}
        />
        <PanelCard>
          <div className="space-y-3">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.06em] text-zinc-400">
                Email
              </p>
              <p className="mt-1 break-all text-[14px] font-medium text-zinc-900">
                {email || "—"}
              </p>
              <p className="mt-1.5 text-[12px] leading-relaxed text-zinc-500">
                {providerNote}
              </p>
            </div>
          </div>
        </PanelCard>
      </section>

      <section>
        <SectionHeader
          title={hasPasswordLogin ? "Password" : "Set password"}
          subtitle={
            hasPasswordLogin
              ? "Change the password you use to sign in"
              : "Add a password so you can sign in with email"
          }
        />
        <PanelCard>
          <div className="space-y-3">
            {hasPasswordLogin ? (
              <label className="block">
                <span className="mb-1.5 block text-[12px] text-zinc-500">
                  Current password
                </span>
                <input
                  type="password"
                  autoComplete="current-password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className={fieldClass}
                  placeholder="Current password"
                />
              </label>
            ) : null}
            <label className="block">
              <span className="mb-1.5 block text-[12px] text-zinc-500">
                New password
              </span>
              <input
                type="password"
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className={fieldClass}
                placeholder="At least 8 characters"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-[12px] text-zinc-500">
                Confirm new password
              </span>
              <input
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={fieldClass}
                placeholder="Repeat new password"
              />
            </label>
            {passwordError ? (
              <p className="text-[12px] text-red-600">{passwordError}</p>
            ) : null}
            {passwordSuccess ? (
              <p className="text-[12px] text-emerald-600">{passwordSuccess}</p>
            ) : null}
            <div className="pt-1">
              <ActionButton
                label={
                  passwordBusy
                    ? "Saving…"
                    : hasPasswordLogin
                      ? "Update password"
                      : "Set password"
                }
                variant="primary"
                disabled={passwordBusy}
                onClick={() => void handleChangePassword()}
              />
            </div>
          </div>
        </PanelCard>
      </section>

      <section>
        <SectionHeader
          title="Billing"
          subtitle="Invoices, payment method, and plan changes"
        />
        <PanelCard>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[13px] font-medium text-zinc-900">
                Current plan ·{" "}
                {displayPlan === "lifetime"
                  ? "Lifetime"
                  : displayPlan === "pro"
                    ? "Pro"
                    : "Free"}
              </p>
              <p className="mt-0.5 text-[12px] leading-relaxed text-zinc-500">
                {paid
                  ? displayPlan === "lifetime"
                    ? "Lifetime is a one-time purchase. View plans anytime."
                    : "Open Stripe to update payment method or cancel Pro."
                  : "Upgrade or compare plans in Billing."}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <ActionButton
                label={
                  portalLoading
                    ? "Opening…"
                    : paid && displayPlan === "pro"
                      ? "Manage billing"
                      : "View plans"
                }
                variant="primary"
                disabled={portalLoading}
                onClick={() => void handleManageBilling()}
              />
              {paid && displayPlan === "pro" ? (
                <ActionButton label="View plans" onClick={onOpenBilling} />
              ) : null}
            </div>
          </div>
          {portalError ? (
            <p className="mt-3 text-[12px] text-red-600">{portalError}</p>
          ) : null}
        </PanelCard>
      </section>

      <section>
        <SectionHeader
          title="Delete account"
          subtitle="Permanently remove your Landed account and data"
        />
        <PanelCard>
          {!deleteOpen ? (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="max-w-md text-[12px] leading-relaxed text-zinc-500">
                This cancels any active Pro subscription and deletes your account.
                This cannot be undone.
              </p>
              <ActionButton
                label="Delete account"
                variant="danger"
                onClick={() => {
                  setDeleteOpen(true);
                  setDeleteConfirm("");
                  setDeleteError(null);
                }}
              />
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-[12px] leading-relaxed text-zinc-500">
                Type <span className="font-medium text-zinc-800">{email}</span> to
                confirm permanent deletion.
              </p>
              <input
                type="email"
                autoComplete="off"
                value={deleteConfirm}
                onChange={(e) => setDeleteConfirm(e.target.value)}
                className={fieldClass}
                placeholder={email || "your@email.com"}
              />
              {deleteError ? (
                <p className="text-[12px] text-red-600">{deleteError}</p>
              ) : null}
              <div className="flex flex-wrap items-center gap-2">
                <ActionButton
                  label={deleteBusy ? "Deleting…" : "Permanently delete"}
                  variant="danger"
                  disabled={deleteBusy}
                  onClick={() => void handleDeleteAccount()}
                />
                <ActionButton
                  label="Cancel"
                  disabled={deleteBusy}
                  onClick={() => {
                    setDeleteOpen(false);
                    setDeleteConfirm("");
                    setDeleteError(null);
                  }}
                />
              </div>
            </div>
          )}
        </PanelCard>
      </section>
    </div>
  );
}
