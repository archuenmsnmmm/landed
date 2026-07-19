-- Atomic free-question consume for hard usage limits.

CREATE OR REPLACE FUNCTION public.consume_free_question(p_user_id uuid)
RETURNS TABLE (
  ok boolean,
  free_questions_used integer,
  paid boolean,
  plan text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_plan text;
  v_sub text;
  v_questions integer;
  v_overlay integer;
  v_paid boolean;
  v_effective_plan text;
BEGIN
  SELECT
    p.plan,
    p.stripe_subscription_id,
    COALESCE(p.free_questions_used, 0),
    COALESCE(p.free_overlay_seconds_used, 0)
  INTO v_plan, v_sub, v_questions, v_overlay
  FROM public.profiles p
  WHERE p.id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 0, false, 'free'::text;
    RETURN;
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
    v_questions := 15;
  END IF;

  IF v_paid THEN
    RETURN QUERY SELECT true, v_questions, true, v_effective_plan;
    RETURN;
  END IF;

  IF v_questions >= 15 THEN
    RETURN QUERY SELECT false, v_questions, false, v_effective_plan;
    RETURN;
  END IF;

  UPDATE public.profiles
  SET
    free_questions_used = v_questions + 1,
    updated_at = now()
  WHERE id = p_user_id;

  RETURN QUERY SELECT true, v_questions + 1, false, v_effective_plan;
END;
$$;

REVOKE ALL ON FUNCTION public.consume_free_question(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.consume_free_question(uuid) TO service_role;
