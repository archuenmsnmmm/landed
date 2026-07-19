import type Stripe from "stripe";
import type { StripeAdminMetrics } from "@/lib/stripe-admin-metrics";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export type PaymentEventRow = {
  id: string;
  idempotency_key: string;
  user_id: string | null;
  plan: string | null;
  amount_cents: number;
  currency: string;
  paid_at: string;
  source: string;
  stripe_event_id: string | null;
  stripe_session_id: string | null;
  stripe_invoice_id: string | null;
  stripe_charge_id: string | null;
};

type RecordPaymentInput = {
  idempotencyKey: string;
  userId?: string | null;
  plan?: string | null;
  amountCents: number;
  currency?: string;
  paidAt: Date;
  source: string;
  stripeEventId?: string | null;
  stripeSessionId?: string | null;
  stripeInvoiceId?: string | null;
  stripeChargeId?: string | null;
};

function centsToDollars(cents: number): number {
  return Math.round(cents) / 100;
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

function formatLocalDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function periodBounds(periodDays: number) {
  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(now);
  todayEnd.setHours(23, 59, 59, 999);

  const yesterdayStart = addDays(todayStart, -1);
  const yesterdayEnd = new Date(yesterdayStart);
  yesterdayEnd.setHours(23, 59, 59, 999);

  const periodEndDate = new Date(now);
  periodEndDate.setHours(23, 59, 59, 999);
  const periodStartDate = addDays(periodEndDate, -(periodDays - 1));
  periodStartDate.setHours(0, 0, 0, 0);

  const previousEndDate = addDays(periodStartDate, -1);
  previousEndDate.setHours(23, 59, 59, 999);
  const previousStartDate = addDays(previousEndDate, -(periodDays - 1));
  previousStartDate.setHours(0, 0, 0, 0);

  return {
    now,
    todayStart,
    todayEnd,
    yesterdayStart,
    yesterdayEnd,
    periodStartDate,
    periodEndDate,
    previousStartDate,
    previousEndDate,
  };
}

async function paginateStripe<T extends { id: string }>(
  fetchPage: (startingAfter?: string) => Promise<Stripe.ApiList<T>>,
): Promise<T[]> {
  const rows: T[] = [];
  let startingAfter: string | undefined;
  let hasMore = true;

  while (hasMore) {
    const page = await fetchPage(startingAfter);
    rows.push(...page.data);
    hasMore = page.has_more;
    startingAfter = page.data.at(-1)?.id;
    if (!startingAfter) break;
  }

  return rows;
}

let lastStripeBackfillAt = 0;
const BACKFILL_COOLDOWN_MS = 5 * 60 * 1000;

function shouldRunStripeBackfill(force: boolean): boolean {
  if (force) return true;
  return Date.now() - lastStripeBackfillAt >= BACKFILL_COOLDOWN_MS;
}

/** Import historical Stripe purchases into payment_events (idempotent). */
export async function backfillPaymentEventsFromStripe(
  stripe: Stripe,
  sinceDays = 365,
  force = false,
): Promise<number> {
  if (!shouldRunStripeBackfill(force)) {
    return 0;
  }
  lastStripeBackfillAt = Date.now();

  const createdGte = Math.floor((Date.now() - sinceDays * 86_400_000) / 1000);
  let recorded = 0;

  const charges = await paginateStripe((startingAfter) =>
    stripe.charges.list({
      created: { gte: createdGte },
      limit: 100,
      starting_after: startingAfter,
    }),
  );

  for (const charge of charges) {
    if (!charge.paid || charge.status !== "succeeded") continue;
    const amountCents = Math.max(charge.amount - (charge.amount_refunded ?? 0), 0);
    if (amountCents <= 0) continue;

    await recordPaymentEvent({
      idempotencyKey: `charge:${charge.id}`,
      userId: charge.metadata?.userId ?? null,
      plan: charge.metadata?.plan ?? null,
      amountCents,
      currency: charge.currency ?? "usd",
      paidAt: new Date(charge.created * 1000),
      source: "stripe-backfill:charge",
      stripeChargeId: charge.id,
    });
    recorded += 1;
  }

  const invoices = await paginateStripe((startingAfter) =>
    stripe.invoices.list({
      created: { gte: createdGte },
      status: "paid",
      limit: 100,
      starting_after: startingAfter,
    }),
  );

  for (const invoice of invoices) {
    await recordInvoicePayment(invoice, "stripe-backfill:invoice");
    recorded += 1;
  }

  const sessions = await paginateStripe((startingAfter) =>
    stripe.checkout.sessions.list({
      created: { gte: createdGte },
      status: "complete",
      limit: 100,
      starting_after: startingAfter,
    }),
  );

  for (const session of sessions) {
    if (session.payment_status === "paid" || session.status === "complete") {
      await recordCheckoutSessionPayment(session, "stripe-backfill:checkout", undefined, stripe);
      recorded += 1;
    }
  }

  return recorded;
}

export async function recordPaymentEvent(input: RecordPaymentInput): Promise<void> {
  if (input.amountCents <= 0) return;

  const supabase = getSupabaseAdmin();
  if (!supabase) return;

  const { error } = await supabase.from("payment_events").upsert(
    {
      idempotency_key: input.idempotencyKey,
      user_id: input.userId ?? null,
      plan: input.plan ?? null,
      amount_cents: input.amountCents,
      currency: (input.currency ?? "usd").toLowerCase(),
      paid_at: input.paidAt.toISOString(),
      source: input.source,
      stripe_event_id: input.stripeEventId ?? null,
      stripe_session_id: input.stripeSessionId ?? null,
      stripe_invoice_id: input.stripeInvoiceId ?? null,
      stripe_charge_id: input.stripeChargeId ?? null,
    },
    { onConflict: "idempotency_key", ignoreDuplicates: true },
  );

  if (error) {
    console.error("[payment-events] record failed:", error.message);
  }
}

async function resolveCheckoutSessionAmount(
  stripe: Stripe,
  session: Stripe.Checkout.Session,
): Promise<{ amountCents: number; paidAt: Date }> {
  let amountCents = session.amount_total ?? 0;
  let paidAt = new Date((session.created ?? Math.floor(Date.now() / 1000)) * 1000);

  if (amountCents > 0) {
    return { amountCents, paidAt };
  }

  try {
    const lineItems = await stripe.checkout.sessions.listLineItems(session.id, { limit: 10 });
    amountCents = lineItems.data.reduce((sum, item) => sum + (item.amount_total ?? 0), 0);
  } catch (err) {
    console.error("[payment-events] checkout line items failed:", err);
  }

  if (amountCents <= 0 && session.mode === "subscription") {
    const subscriptionId =
      typeof session.subscription === "string"
        ? session.subscription
        : session.subscription?.id;
    if (subscriptionId) {
      try {
        const sub = await stripe.subscriptions.retrieve(subscriptionId, {
          expand: ["latest_invoice"],
        });
        const invoice = sub.latest_invoice;
        if (invoice && typeof invoice !== "string" && invoice.status === "paid") {
          amountCents = invoice.amount_paid ?? 0;
          if (invoice.status_transitions?.paid_at) {
            paidAt = new Date(invoice.status_transitions.paid_at * 1000);
          }
        }
      } catch (err) {
        console.error("[payment-events] subscription invoice lookup failed:", err);
      }
    }
  }

  return { amountCents, paidAt };
}

export async function recordCheckoutSessionPayment(
  session: Stripe.Checkout.Session,
  source: string,
  stripeEventId?: string,
  stripe?: Stripe | null,
): Promise<void> {
  if (session.mode !== "subscription" && session.mode !== "payment") return;
  if (session.payment_status !== "paid" && session.status !== "complete") return;

  const client = stripe ?? null;
  const { amountCents, paidAt } = client
    ? await resolveCheckoutSessionAmount(client, session)
    : {
        amountCents: session.amount_total ?? 0,
        paidAt: new Date((session.created ?? Math.floor(Date.now() / 1000)) * 1000),
      };
  if (amountCents <= 0) return;

  const userId = session.client_reference_id ?? session.metadata?.userId ?? null;
  const plan = session.metadata?.plan ?? "pro";

  await recordPaymentEvent({
    idempotencyKey: `session:${session.id}`,
    userId,
    plan,
    amountCents,
    currency: session.currency ?? "usd",
    paidAt,
    source,
    stripeEventId: stripeEventId ?? null,
    stripeSessionId: session.id,
  });
}

/** Record paid subscription invoices so admin metrics reflect checkout purchases. */
export async function recordSubscriptionInvoicePayments(
  stripe: Stripe,
  subscriptionId: string,
  userId?: string | null,
  plan?: string | null,
): Promise<void> {
  const invoices = await paginateStripe((startingAfter) =>
    stripe.invoices.list({
      subscription: subscriptionId,
      status: "paid",
      limit: 100,
      starting_after: startingAfter,
    }),
  );

  for (const invoice of invoices) {
    await recordInvoicePayment(invoice, "billing-sync", undefined, userId, plan);
  }
}

export async function recordInvoicePayment(
  invoice: Stripe.Invoice,
  source: string,
  stripeEventId?: string,
  userId?: string | null,
  plan?: string | null,
): Promise<void> {
  if (invoice.status !== "paid") return;

  const amountCents = invoice.amount_paid ?? 0;
  if (amountCents <= 0) return;

  const paidAt = invoice.status_transitions?.paid_at
    ? new Date(invoice.status_transitions.paid_at * 1000)
    : new Date(invoice.created * 1000);

  const invoiceWithCharge = invoice as Stripe.Invoice & {
    charge?: string | { id: string } | null;
  };
  const chargeId =
    typeof invoiceWithCharge.charge === "string"
      ? invoiceWithCharge.charge
      : invoiceWithCharge.charge?.id ?? null;

  await recordPaymentEvent({
    idempotencyKey: `invoice:${invoice.id}`,
    userId: userId ?? invoice.metadata?.userId ?? null,
    plan: plan ?? invoice.metadata?.plan ?? "pro",
    amountCents,
    currency: invoice.currency ?? "usd",
    paidAt,
    source,
    stripeEventId: stripeEventId ?? null,
    stripeInvoiceId: invoice.id,
    stripeChargeId: chargeId ?? null,
  });
}

export async function listPaymentEventsBetween(
  start: Date,
  end: Date,
): Promise<PaymentEventRow[]> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("payment_events")
    .select("*")
    .gte("paid_at", start.toISOString())
    .lte("paid_at", end.toISOString())
    .order("paid_at", { ascending: true });

  if (error) {
    console.error("[payment-events] list failed:", error.message);
    return [];
  }

  return (data ?? []) as PaymentEventRow[];
}

function sumEventsInRange(events: PaymentEventRow[], start: Date, end: Date): number {
  const startMs = start.getTime();
  const endMs = end.getTime();
  return events
    .filter((event) => {
      const t = new Date(event.paid_at).getTime();
      return t >= startMs && t <= endMs;
    })
    .reduce((sum, event) => sum + event.amount_cents, 0);
}

function groupDailyFromEvents(
  events: PaymentEventRow[],
  startDate: Date,
  endDate: Date,
): { date: string; value: number }[] {
  const buckets = new Map<string, number>();
  for (let d = new Date(startDate); d <= endDate; d = addDays(d, 1)) {
    buckets.set(formatLocalDateKey(d), 0);
  }

  for (const event of events) {
    const key = formatLocalDateKey(new Date(event.paid_at));
    if (buckets.has(key)) {
      buckets.set(key, (buckets.get(key) ?? 0) + event.amount_cents);
    }
  }

  return Array.from(buckets.entries()).map(([date, cents]) => ({
    date,
    value: centsToDollars(cents),
  }));
}

function groupHourlyFromEvents(
  events: PaymentEventRow[],
  dayStart: Date,
  dayEnd: Date,
): { hour: number; value: number }[] {
  const buckets = Array.from({ length: 24 }, (_, hour) => ({ hour, value: 0 }));
  const startMs = dayStart.getTime();
  const endMs = dayEnd.getTime();

  for (const event of events) {
    const paidAt = new Date(event.paid_at);
    const t = paidAt.getTime();
    if (t < startMs || t > endMs) continue;
    buckets[paidAt.getHours()].value += centsToDollars(event.amount_cents);
  }

  return buckets;
}

function groupDailyEventCounts(
  events: PaymentEventRow[],
  startDate: Date,
  endDate: Date,
): { date: string; value: number }[] {
  const buckets = new Map<string, number>();
  for (let d = new Date(startDate); d <= endDate; d = addDays(d, 1)) {
    buckets.set(formatLocalDateKey(d), 0);
  }

  for (const event of events) {
    const key = formatLocalDateKey(new Date(event.paid_at));
    if (buckets.has(key)) {
      buckets.set(key, (buckets.get(key) ?? 0) + 1);
    }
  }

  return Array.from(buckets.entries()).map(([date, value]) => ({ date, value }));
}

function uniquePaidUsers(events: PaymentEventRow[]): number {
  return new Set(events.map((event) => event.user_id).filter(Boolean)).size;
}

export function buildMetricsFromRecordedEvents(
  events: PaymentEventRow[],
  periodDays: number,
): StripeAdminMetrics {
  const bounds = periodBounds(periodDays);
  const currency = events[0]?.currency ?? "usd";

  const periodEvents = events.filter((event) => {
    const t = new Date(event.paid_at).getTime();
    return t >= bounds.periodStartDate.getTime() && t <= bounds.periodEndDate.getTime();
  });

  const previousEvents = events.filter((event) => {
    const t = new Date(event.paid_at).getTime();
    return t >= bounds.previousStartDate.getTime() && t <= bounds.previousEndDate.getTime();
  });

  const grossToday = centsToDollars(
    sumEventsInRange(events, bounds.todayStart, bounds.todayEnd),
  );
  const grossYesterday = centsToDollars(
    sumEventsInRange(events, bounds.yesterdayStart, bounds.yesterdayEnd),
  );

  return {
    today: {
      grossRevenue: grossToday,
      yesterdayGrossRevenue: grossYesterday,
      hourly: groupHourlyFromEvents(events, bounds.todayStart, bounds.todayEnd),
      updatedAt: bounds.now.toISOString(),
    },
    balance: {
      total: 0,
      available: 0,
      pending: 0,
      currency,
    },
    payouts: {
      recentAmount: null,
      recentArrivalDate: null,
      pendingAmount: 0,
      currency,
    },
    stats: {
      periodStart: bounds.periodStartDate.toISOString(),
      periodEnd: bounds.periodEndDate.toISOString(),
      previousPeriodStart: bounds.previousStartDate.toISOString(),
      previousPeriodEnd: bounds.previousEndDate.toISOString(),
      grossRevenue: centsToDollars(sumEventsInRange(events, bounds.periodStartDate, bounds.periodEndDate)),
      previousGrossRevenue: centsToDollars(
        sumEventsInRange(events, bounds.previousStartDate, bounds.previousEndDate),
      ),
      netRevenue: centsToDollars(sumEventsInRange(events, bounds.periodStartDate, bounds.periodEndDate)),
      previousNetRevenue: centsToDollars(
        sumEventsInRange(events, bounds.previousStartDate, bounds.previousEndDate),
      ),
      newUsers: uniquePaidUsers(periodEvents),
      previousNewUsers: uniquePaidUsers(previousEvents),
      mrr: 0,
      arr: 0,
      dailyGross: groupDailyFromEvents(events, bounds.periodStartDate, bounds.periodEndDate),
      dailyNet: groupDailyFromEvents(events, bounds.periodStartDate, bounds.periodEndDate),
      dailyNewUsers: groupDailyEventCounts(periodEvents, bounds.periodStartDate, bounds.periodEndDate),
      dailyMrr: groupDailyFromEvents(events, bounds.periodStartDate, bounds.periodEndDate).map(
        (point) => ({ ...point, value: 0 }),
      ),
      paymentsBreakdown: {
        paid: periodEvents.length,
        pastDue: 0,
        failed: 0,
        pending: 0,
      },
    },
  };
}

function mergeGrossMetrics(
  stripeMetrics: StripeAdminMetrics,
  recordedMetrics: StripeAdminMetrics,
): StripeAdminMetrics {
  const pickGross = (recorded: number, stripe: number) =>
    recorded > 0 ? recorded : stripe;

  const hourlyMap = new Map<number, number>();
  for (const point of recordedMetrics.today.hourly) {
    hourlyMap.set(point.hour, point.value);
  }
  const mergedHourly = stripeMetrics.today.hourly.map((point) => ({
    ...point,
    value: Math.max(point.value, hourlyMap.get(point.hour) ?? 0),
  }));
  for (const point of recordedMetrics.today.hourly) {
    if (!stripeMetrics.today.hourly.some((h) => h.hour === point.hour)) {
      mergedHourly.push(point);
    }
  }
  mergedHourly.sort((a, b) => a.hour - b.hour);

  const dailyGrossMap = new Map<string, number>();
  for (const point of recordedMetrics.stats.dailyGross) {
    dailyGrossMap.set(point.date, point.value);
  }
  for (const point of stripeMetrics.stats.dailyGross) {
    dailyGrossMap.set(
      point.date,
      Math.max(point.value, dailyGrossMap.get(point.date) ?? 0),
    );
  }

  return {
    ...stripeMetrics,
    today: {
      ...stripeMetrics.today,
      grossRevenue: pickGross(
        recordedMetrics.today.grossRevenue,
        stripeMetrics.today.grossRevenue,
      ),
      yesterdayGrossRevenue: pickGross(
        recordedMetrics.today.yesterdayGrossRevenue,
        stripeMetrics.today.yesterdayGrossRevenue,
      ),
      hourly: mergedHourly.length > 0 ? mergedHourly : recordedMetrics.today.hourly,
      updatedAt: new Date().toISOString(),
    },
    stats: {
      ...stripeMetrics.stats,
      grossRevenue: pickGross(
        recordedMetrics.stats.grossRevenue,
        stripeMetrics.stats.grossRevenue,
      ),
      previousGrossRevenue: pickGross(
        recordedMetrics.stats.previousGrossRevenue,
        stripeMetrics.stats.previousGrossRevenue,
      ),
      netRevenue: pickGross(
        recordedMetrics.stats.netRevenue,
        stripeMetrics.stats.netRevenue,
      ),
      previousNetRevenue: pickGross(
        recordedMetrics.stats.previousNetRevenue,
        stripeMetrics.stats.previousNetRevenue,
      ),
      dailyGross: Array.from(dailyGrossMap.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, value]) => ({ date, value })),
      dailyNet: recordedMetrics.stats.dailyNet.some((point) => point.value > 0)
        ? recordedMetrics.stats.dailyNet
        : stripeMetrics.stats.dailyNet,
      newUsers: Math.max(
        stripeMetrics.stats.newUsers,
        recordedMetrics.stats.newUsers,
      ),
      previousNewUsers: Math.max(
        stripeMetrics.stats.previousNewUsers,
        recordedMetrics.stats.previousNewUsers,
      ),
      dailyNewUsers: recordedMetrics.stats.dailyNewUsers.some((p) => p.value > 0)
        ? recordedMetrics.stats.dailyNewUsers
        : stripeMetrics.stats.dailyNewUsers,
      paymentsBreakdown: {
        ...stripeMetrics.stats.paymentsBreakdown,
        paid: Math.max(
          stripeMetrics.stats.paymentsBreakdown.paid,
          recordedMetrics.stats.paymentsBreakdown.paid,
        ),
      },
    },
  };
}

export async function resolveAdminMetrics(
  stripe: Stripe | null,
  periodDays: number,
  fetchStripe: (client: Stripe, days: number) => Promise<StripeAdminMetrics>,
): Promise<{ metrics: StripeAdminMetrics; source: "stripe" | "recorded" | "mixed" }> {
  const backfillDays = Math.max(periodDays * 2, 365);
  const bounds = periodBounds(periodDays);
  const events = await listPaymentEventsBetween(bounds.previousStartDate, bounds.periodEndDate);

  if (stripe) {
    try {
      await backfillPaymentEventsFromStripe(stripe, backfillDays, events.length === 0);
    } catch (err) {
      console.error("[admin] stripe backfill failed:", err);
    }
  }

  const refreshedEvents = await listPaymentEventsBetween(
    bounds.previousStartDate,
    bounds.periodEndDate,
  );
  const recordedMetrics = buildMetricsFromRecordedEvents(refreshedEvents, periodDays);

  if (stripe) {
    try {
      const stripeMetrics = await fetchStripe(stripe, periodDays);
      if (refreshedEvents.length === 0) {
        return { metrics: stripeMetrics, source: "stripe" };
      }
      const merged = mergeGrossMetrics(stripeMetrics, recordedMetrics);
      const usedRecorded =
        merged.stats.grossRevenue > stripeMetrics.stats.grossRevenue ||
        merged.stats.previousGrossRevenue > stripeMetrics.stats.previousGrossRevenue ||
        merged.today.grossRevenue > stripeMetrics.today.grossRevenue;
      return { metrics: merged, source: usedRecorded ? "mixed" : "stripe" };
    } catch (err) {
      console.error("[admin] stripe metrics failed:", err);
    }
  }

  if (refreshedEvents.length > 0) {
    return { metrics: recordedMetrics, source: "recorded" };
  }

  return { metrics: recordedMetrics, source: "recorded" };
}
