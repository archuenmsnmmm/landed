-- Desktop app state: onboarding progress, settings, company info (meetings sync separately).

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS app_state jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS app_state_updated_at timestamptz;
