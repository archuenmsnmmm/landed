-- Remove referral program: columns, indexes, functions, and signup/harden hooks.

-- Downgrade leftover Pro without a Stripe subscription before dropping columns.
UPDATE public.profiles
SET
  plan = 'free',
  updated_at = now()
WHERE plan = 'pro'
  AND stripe_subscription_id IS NULL;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_name TEXT;
  v_terms_at TIMESTAMPTZ;
  v_terms_version TEXT;
  v_privacy_at TIMESTAMPTZ;
BEGIN
  v_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    split_part(COALESCE(NEW.email, ''), '@', 1),
    'User'
  );

  v_terms_at := NULLIF(NEW.raw_user_meta_data->>'terms_accepted_at', '')::timestamptz;
  v_terms_version := NULLIF(NEW.raw_user_meta_data->>'terms_version', '');
  v_privacy_at := COALESCE(
    NULLIF(NEW.raw_user_meta_data->>'privacy_accepted_at', '')::timestamptz,
    v_terms_at
  );

  INSERT INTO public.profiles (
    id,
    email,
    name,
    avatar_url,
    terms_accepted_at,
    terms_version,
    privacy_accepted_at
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    v_name,
    COALESCE(
      NEW.raw_user_meta_data->>'avatar_url',
      NEW.raw_user_meta_data->>'picture',
      upper(left(v_name, 1))
    ),
    v_terms_at,
    v_terms_version,
    v_privacy_at
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = EXCLUDED.name,
    avatar_url = COALESCE(public.profiles.avatar_url, EXCLUDED.avatar_url),
    terms_accepted_at = COALESCE(public.profiles.terms_accepted_at, EXCLUDED.terms_accepted_at),
    terms_version = COALESCE(public.profiles.terms_version, EXCLUDED.terms_version),
    privacy_accepted_at = COALESCE(public.profiles.privacy_accepted_at, EXCLUDED.privacy_accepted_at),
    updated_at = now();

  RETURN NEW;
END;
$$;

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

DROP INDEX IF EXISTS public.profiles_referral_code_idx;
DROP INDEX IF EXISTS public.profiles_referred_by_idx;

ALTER TABLE public.profiles
  DROP COLUMN IF EXISTS referral_code,
  DROP COLUMN IF EXISTS referred_by,
  DROP COLUMN IF EXISTS referral_reward_granted_at,
  DROP COLUMN IF EXISTS referral_pro_expires_at;

DROP FUNCTION IF EXISTS public.generate_referral_code();
