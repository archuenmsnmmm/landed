-- Free-plan question usage (replaces overlay-minute gating for AI asks).

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS free_questions_used INTEGER NOT NULL DEFAULT 0;

-- Migrate exhausted legacy overlay trials into exhausted question budgets.
UPDATE public.profiles
SET free_questions_used = 15
WHERE COALESCE(free_overlay_seconds_used, 0) >= 600
  AND COALESCE(free_questions_used, 0) < 15;

CREATE OR REPLACE FUNCTION public.profiles_protect_sensitive_columns()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF auth.uid() IS NULL OR auth.uid() != OLD.id THEN
    RETURN NEW;
  END IF;

  NEW.plan := OLD.plan;
  NEW.stripe_customer_id := OLD.stripe_customer_id;
  NEW.stripe_subscription_id := OLD.stripe_subscription_id;
  NEW.free_overlay_seconds_used := OLD.free_overlay_seconds_used;
  NEW.free_questions_used := OLD.free_questions_used;
  NEW.email := OLD.email;

  IF NEW.app_state IS DISTINCT FROM OLD.app_state THEN
    NEW.app_state :=
      (COALESCE(NEW.app_state, '{}'::jsonb)
        - 'plan'
        - 'paywallComplete'
        - 'freeOverlaySecondsUsed'
        - 'freeQuestionsUsed')
      || jsonb_strip_nulls(
           jsonb_build_object(
             'plan', OLD.app_state->'plan',
             'paywallComplete', OLD.app_state->'paywallComplete',
             'freeOverlaySecondsUsed', OLD.app_state->'freeOverlaySecondsUsed',
             'freeQuestionsUsed', OLD.app_state->'freeQuestionsUsed'
           )
         );
  END IF;

  RETURN NEW;
END;
$$;
