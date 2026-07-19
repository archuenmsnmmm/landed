-- Harden profiles: block client self-updates to billing, referral, and usage fields.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS free_overlay_seconds_used INTEGER NOT NULL DEFAULT 0;

CREATE OR REPLACE FUNCTION public.profiles_protect_sensitive_columns()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Service role / triggers bypass (no authenticated user or different user).
  IF auth.uid() IS NULL OR auth.uid() != OLD.id THEN
    RETURN NEW;
  END IF;

  NEW.plan := OLD.plan;
  NEW.stripe_customer_id := OLD.stripe_customer_id;
  NEW.stripe_subscription_id := OLD.stripe_subscription_id;
  NEW.referral_code := OLD.referral_code;
  NEW.referred_by := OLD.referred_by;
  NEW.referral_reward_granted_at := OLD.referral_reward_granted_at;
  NEW.referral_pro_expires_at := OLD.referral_pro_expires_at;
  NEW.free_overlay_seconds_used := OLD.free_overlay_seconds_used;
  NEW.email := OLD.email;

  IF NEW.app_state IS DISTINCT FROM OLD.app_state THEN
    NEW.app_state :=
      (COALESCE(NEW.app_state, '{}'::jsonb) - 'plan' - 'paywallComplete' - 'freeOverlaySecondsUsed')
      || jsonb_strip_nulls(
           jsonb_build_object(
             'plan', OLD.app_state->'plan',
             'paywallComplete', OLD.app_state->'paywallComplete',
             'freeOverlaySecondsUsed', OLD.app_state->'freeOverlaySecondsUsed'
           )
         );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_protect_sensitive_columns ON public.profiles;
CREATE TRIGGER profiles_protect_sensitive_columns
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.profiles_protect_sensitive_columns();
