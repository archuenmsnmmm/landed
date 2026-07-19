-- Record explicit Terms & Privacy acceptance at signup

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS terms_version TEXT,
  ADD COLUMN IF NOT EXISTS privacy_accepted_at TIMESTAMPTZ;

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
