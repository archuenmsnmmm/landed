-- Successful payment ledger for admin metrics (webhook + checkout sync)

CREATE TABLE IF NOT EXISTS public.payment_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  idempotency_key text NOT NULL UNIQUE,
  user_id uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  plan text,
  amount_cents integer NOT NULL CHECK (amount_cents >= 0),
  currency text NOT NULL DEFAULT 'usd',
  paid_at timestamptz NOT NULL,
  source text NOT NULL,
  stripe_event_id text,
  stripe_session_id text,
  stripe_invoice_id text,
  stripe_charge_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS payment_events_paid_at_idx
  ON public.payment_events (paid_at DESC);

CREATE INDEX IF NOT EXISTS payment_events_user_id_idx
  ON public.payment_events (user_id)
  WHERE user_id IS NOT NULL;

ALTER TABLE public.payment_events ENABLE ROW LEVEL SECURITY;
