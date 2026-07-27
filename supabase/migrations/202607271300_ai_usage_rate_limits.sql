-- Per-user AI usage/cost tracking, Supabase-backed rate limits, and paid fair-use caps.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS ai_usage_month TEXT,
  ADD COLUMN IF NOT EXISTS ai_asks_this_month INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ai_prompt_tokens_this_month BIGINT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ai_completion_tokens_this_month BIGINT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ai_cost_usd_this_month NUMERIC(14, 6) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ai_cost_usd_lifetime NUMERIC(14, 6) NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS public.api_rate_limits (
  rate_key TEXT PRIMARY KEY,
  request_count INTEGER NOT NULL DEFAULT 1,
  window_start TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS api_rate_limits_window_start_idx
  ON public.api_rate_limits (window_start);

ALTER TABLE public.api_rate_limits ENABLE ROW LEVEL SECURITY;

-- Service role only (no client policies).

CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_rate_key TEXT,
  p_limit INTEGER,
  p_window_seconds INTEGER
)
RETURNS TABLE (
  allowed BOOLEAN,
  retry_after_seconds INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER;
  v_start TIMESTAMPTZ;
  v_window INTERVAL;
  v_retry INTEGER;
BEGIN
  IF p_rate_key IS NULL OR length(trim(p_rate_key)) = 0 OR p_limit <= 0 OR p_window_seconds <= 0 THEN
    RETURN QUERY SELECT true, 0;
    RETURN;
  END IF;

  v_window := make_interval(secs => p_window_seconds);

  SELECT request_count, window_start
  INTO v_count, v_start
  FROM public.api_rate_limits
  WHERE rate_key = p_rate_key
  FOR UPDATE;

  IF NOT FOUND OR now() >= v_start + v_window THEN
    INSERT INTO public.api_rate_limits (rate_key, request_count, window_start)
    VALUES (p_rate_key, 1, now())
    ON CONFLICT (rate_key) DO UPDATE
      SET request_count = 1,
          window_start = now();
    RETURN QUERY SELECT true, 0;
    RETURN;
  END IF;

  IF v_count >= p_limit THEN
    v_retry := GREATEST(
      1,
      CEIL(EXTRACT(EPOCH FROM (v_start + v_window - now())))::INTEGER
    );
    RETURN QUERY SELECT false, v_retry;
    RETURN;
  END IF;

  UPDATE public.api_rate_limits
  SET request_count = v_count + 1
  WHERE rate_key = p_rate_key;

  RETURN QUERY SELECT true, 0;
END;
$$;

CREATE OR REPLACE FUNCTION public.consume_ai_assist(p_user_id UUID)
RETURNS TABLE (
  ok BOOLEAN,
  free_questions_used INTEGER,
  paid BOOLEAN,
  plan TEXT,
  paid_asks_this_month INTEGER,
  throttled BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_plan TEXT;
  v_sub TEXT;
  v_questions INTEGER;
  v_overlay INTEGER;
  v_paid BOOLEAN;
  v_effective_plan TEXT;
  v_usage_month TEXT;
  v_asks_month INTEGER;
  v_month_key TEXT;
  v_free_limit CONSTANT INTEGER := 10;
  v_fair_use CONSTANT INTEGER := 1000;
  v_hard_cap CONSTANT INTEGER := 2500;
BEGIN
  v_month_key := to_char(now(), 'YYYY-MM');

  SELECT
    p.plan,
    p.stripe_subscription_id,
    COALESCE(p.free_questions_used, 0),
    COALESCE(p.free_overlay_seconds_used, 0),
    p.ai_usage_month,
    COALESCE(p.ai_asks_this_month, 0)
  INTO v_plan, v_sub, v_questions, v_overlay, v_usage_month, v_asks_month
  FROM public.profiles p
  WHERE p.id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 0, false, 'free'::TEXT, 0, false;
    RETURN;
  END IF;

  IF COALESCE(v_usage_month, '') <> v_month_key THEN
    UPDATE public.profiles
    SET
      ai_usage_month = v_month_key,
      ai_asks_this_month = 0,
      ai_prompt_tokens_this_month = 0,
      ai_completion_tokens_this_month = 0,
      ai_cost_usd_this_month = 0,
      updated_at = now()
    WHERE id = p_user_id;
    v_asks_month := 0;
  END IF;

  v_effective_plan := COALESCE(v_plan, 'free');
  IF v_effective_plan = 'lifetime' THEN
    v_paid := true;
  ELSIF v_effective_plan <> 'free' AND v_sub IS NOT NULL AND length(v_sub) > 0 THEN
    v_paid := true;
  ELSE
    v_paid := false;
    IF v_effective_plan <> 'free' AND (v_sub IS NULL OR length(v_sub) = 0) THEN
      v_effective_plan := 'free';
    END IF;
  END IF;

  IF v_questions = 0 AND v_overlay >= 600 THEN
    v_questions := v_free_limit;
  END IF;

  IF v_paid THEN
    IF v_asks_month >= v_hard_cap THEN
      RETURN QUERY
        SELECT false, v_questions, true, v_effective_plan, v_asks_month, v_asks_month > v_fair_use;
      RETURN;
    END IF;

    v_asks_month := v_asks_month + 1;

    UPDATE public.profiles
    SET
      ai_asks_this_month = v_asks_month,
      ai_usage_month = v_month_key,
      updated_at = now()
    WHERE id = p_user_id;

    RETURN QUERY
      SELECT
        true,
        v_questions,
        true,
        v_effective_plan,
        v_asks_month,
        v_asks_month > v_fair_use;
    RETURN;
  END IF;

  IF v_questions >= v_free_limit THEN
    RETURN QUERY SELECT false, v_questions, false, v_effective_plan, 0, false;
    RETURN;
  END IF;

  v_asks_month := v_asks_month + 1;

  UPDATE public.profiles
  SET
    free_questions_used = v_questions + 1,
    ai_asks_this_month = v_asks_month,
    ai_usage_month = v_month_key,
    updated_at = now()
  WHERE id = p_user_id;

  RETURN QUERY
    SELECT true, v_questions + 1, false, v_effective_plan, v_asks_month, false;
END;
$$;

CREATE OR REPLACE FUNCTION public.record_ai_usage(
  p_user_id UUID,
  p_prompt_tokens INTEGER,
  p_completion_tokens INTEGER,
  p_cost_usd NUMERIC
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_month_key TEXT;
BEGIN
  v_month_key := to_char(now(), 'YYYY-MM');
  p_prompt_tokens := GREATEST(0, COALESCE(p_prompt_tokens, 0));
  p_completion_tokens := GREATEST(0, COALESCE(p_completion_tokens, 0));
  p_cost_usd := GREATEST(0, COALESCE(p_cost_usd, 0));

  UPDATE public.profiles
  SET
    ai_usage_month = v_month_key,
    ai_prompt_tokens_this_month = CASE
      WHEN COALESCE(ai_usage_month, '') = v_month_key
        THEN COALESCE(ai_prompt_tokens_this_month, 0) + p_prompt_tokens
      ELSE p_prompt_tokens
    END,
    ai_completion_tokens_this_month = CASE
      WHEN COALESCE(ai_usage_month, '') = v_month_key
        THEN COALESCE(ai_completion_tokens_this_month, 0) + p_completion_tokens
      ELSE p_completion_tokens
    END,
    ai_cost_usd_this_month = CASE
      WHEN COALESCE(ai_usage_month, '') = v_month_key
        THEN COALESCE(ai_cost_usd_this_month, 0) + p_cost_usd
      ELSE p_cost_usd
    END,
    ai_cost_usd_lifetime = COALESCE(ai_cost_usd_lifetime, 0) + p_cost_usd,
    updated_at = now()
  WHERE id = p_user_id;
END;
$$;

-- Backward-compatible wrapper for existing callers.
CREATE OR REPLACE FUNCTION public.consume_free_question(p_user_id UUID)
RETURNS TABLE (
  ok BOOLEAN,
  free_questions_used INTEGER,
  paid BOOLEAN,
  plan TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    r.ok,
    r.free_questions_used,
    r.paid,
    r.plan
  FROM public.consume_ai_assist(p_user_id) AS r;
END;
$$;

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
  NEW.ai_usage_month := OLD.ai_usage_month;
  NEW.ai_asks_this_month := OLD.ai_asks_this_month;
  NEW.ai_prompt_tokens_this_month := OLD.ai_prompt_tokens_this_month;
  NEW.ai_completion_tokens_this_month := OLD.ai_completion_tokens_this_month;
  NEW.ai_cost_usd_this_month := OLD.ai_cost_usd_this_month;
  NEW.ai_cost_usd_lifetime := OLD.ai_cost_usd_lifetime;
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

REVOKE ALL ON FUNCTION public.check_rate_limit(TEXT, INTEGER, INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.check_rate_limit(TEXT, INTEGER, INTEGER) TO service_role;

REVOKE ALL ON FUNCTION public.consume_ai_assist(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.consume_ai_assist(UUID) TO service_role;

REVOKE ALL ON FUNCTION public.record_ai_usage(UUID, INTEGER, INTEGER, NUMERIC) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.record_ai_usage(UUID, INTEGER, INTEGER, NUMERIC) TO service_role;

REVOKE ALL ON FUNCTION public.consume_free_question(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.consume_free_question(UUID) TO service_role;
