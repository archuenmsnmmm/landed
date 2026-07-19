-- Referral program: invite 3 friends who create accounts → one-time 15 days of Pro for the referrer

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS referral_code TEXT,
  ADD COLUMN IF NOT EXISTS referred_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS referral_reward_granted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS referral_pro_expires_at TIMESTAMPTZ;

CREATE UNIQUE INDEX IF NOT EXISTS profiles_referral_code_idx
  ON public.profiles (referral_code)
  WHERE referral_code IS NOT NULL;

CREATE INDEX IF NOT EXISTS profiles_referred_by_idx
  ON public.profiles (referred_by)
  WHERE referred_by IS NOT NULL;

CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_code TEXT;
  v_exists BOOLEAN;
BEGIN
  LOOP
    v_code := lower(substr(encode(extensions.gen_random_bytes(6), 'hex'), 1, 8));
    SELECT EXISTS(
      SELECT 1 FROM public.profiles WHERE referral_code = v_code
    ) INTO v_exists;
    EXIT WHEN NOT v_exists;
  END LOOP;
  RETURN v_code;
END;
$$;

-- Backfill referral codes for existing profiles
UPDATE public.profiles
SET referral_code = public.generate_referral_code()
WHERE referral_code IS NULL;

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
    privacy_accepted_at,
    referral_code
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
    v_privacy_at,
    public.generate_referral_code()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = EXCLUDED.name,
    avatar_url = COALESCE(public.profiles.avatar_url, EXCLUDED.avatar_url),
    terms_accepted_at = COALESCE(public.profiles.terms_accepted_at, EXCLUDED.terms_accepted_at),
    terms_version = COALESCE(public.profiles.terms_version, EXCLUDED.terms_version),
    privacy_accepted_at = COALESCE(public.profiles.privacy_accepted_at, EXCLUDED.privacy_accepted_at),
    referral_code = COALESCE(public.profiles.referral_code, EXCLUDED.referral_code),
    updated_at = now();

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

GRANT EXECUTE ON FUNCTION public.handle_new_user() TO supabase_auth_admin;
GRANT EXECUTE ON FUNCTION public.generate_referral_code() TO supabase_auth_admin;
