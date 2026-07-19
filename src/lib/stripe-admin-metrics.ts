import type Stripe from "stripe";

export type DailyPoint = { date: string; value: number };
export type HourlyPoint = { hour: number; value: number };

export type StripeAdminMetrics = {
  today: {
    grossRevenue: number;
    yesterdayGrossRevenue: number;
    hourly: HourlyPoint[];
    updatedAt: string;
  };
  balance: {
    total: number;
    available: number;
    pending: number;
    currency: string;
  };
  payouts: {
    recentAmount: number | null;
    recentArrivalDate: string | null;
    pendingAmount: number;
    currency: string;
  };
  stats: {
    periodStart: string;
    periodEnd: string;
    previousPeriodStart: string;
    previousPeriodEnd: string;
    grossRevenue: number;
    previousGrossRevenue: number;
    netRevenue: number;
    previousNetRevenue: number;
    newUsers: number;
    previousNewUsers: number;
    mrr: number;
    arr: number;
    dailyGross: DailyPoint[];
    dailyNet: DailyPoint[];
    dailyNewUsers: DailyPoint[];
    dailyMrr: DailyPoint[];
    paymentsBreakdown: {
      paid: number;
      pastDue: number;
      failed: number;
      pending: number;
    };
  };
};

const NET_TYPES = new Set(["charge", "payment", "refund", "payment_refund"]);

function startOfDayUnix(date: Date): number {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  return Math.floor(d.getTime() / 1000);
}

function endOfDayUnix(date: Date): number {
  const d = new Date(date);
  d.setUTCHours(23, 59, 59, 999);
  return Math.floor(d.getTime() / 1000);
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

function formatDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function centsToDollars(cents: number): number {
  return Math.round(cents) / 100;
}

function dateKeyFromUnix(unix: number): string {
  return new Date(unix * 1000).toISOString().slice(0, 10);
}

async function paginate<T extends { id: string }>(
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

async function listBalanceTransactions(
  stripe: Stripe,
  start: number,
  end: number,
): Promise<Stripe.BalanceTransaction[]> {
  return paginate((startingAfter) =>
    stripe.balanceTransactions.list({
      created: { gte: start, lte: end },
      limit: 100,
      starting_after: startingAfter,
    }),
  );
}

async function listCharges(
  stripe: Stripe,
  start: number,
  end: number,
): Promise<Stripe.Charge[]> {
  return paginate((startingAfter) =>
    stripe.charges.list({
      created: { gte: start, lte: end },
      limit: 100,
      starting_after: startingAfter,
    }),
  );
}

function chargeGrossCents(charge: Stripe.Charge): number {
  if (!charge.paid || charge.status !== "succeeded") return 0;
  return Math.max(charge.amount - (charge.amount_refunded ?? 0), 0);
}

function sumGrossFromCharges(charges: Stripe.Charge[]): number {
  return charges.reduce((sum, charge) => sum + chargeGrossCents(charge), 0);
}

function groupDailyGrossFromCharges(
  charges: Stripe.Charge[],
  startDate: Date,
  endDate: Date,
): DailyPoint[] {
  const buckets = new Map<string, number>();
  for (let d = new Date(startDate); d <= endDate; d = addDays(d, 1)) {
    buckets.set(formatDateKey(d), 0);
  }

  for (const charge of charges) {
    const gross = chargeGrossCents(charge);
    if (gross <= 0) continue;
    const key = dateKeyFromUnix(charge.created);
    if (buckets.has(key)) {
      buckets.set(key, (buckets.get(key) ?? 0) + gross);
    }
  }

  return Array.from(buckets.entries()).map(([date, value]) => ({
    date,
    value: centsToDollars(value),
  }));
}

function groupHourlyGrossFromCharges(
  charges: Stripe.Charge[],
): HourlyPoint[] {
  const buckets = Array.from({ length: 24 }, (_, hour) => ({ hour, value: 0 }));

  for (const charge of charges) {
    const gross = chargeGrossCents(charge);
    if (gross <= 0) continue;
    const hour = new Date(charge.created * 1000).getHours();
    buckets[hour].value += centsToDollars(gross);
  }

  return buckets;
}

function sumNetFromTransactions(transactions: Stripe.BalanceTransaction[]): number {
  return transactions
    .filter((tx) => NET_TYPES.has(tx.type))
    .reduce((sum, tx) => sum + tx.net, 0);
}

function groupDailyNet(
  transactions: Stripe.BalanceTransaction[],
  startDate: Date,
  endDate: Date,
): DailyPoint[] {
  const buckets = new Map<string, number>();
  for (let d = new Date(startDate); d <= endDate; d = addDays(d, 1)) {
    buckets.set(formatDateKey(d), 0);
  }

  for (const tx of transactions) {
    if (!NET_TYPES.has(tx.type)) continue;
    const key = dateKeyFromUnix(tx.created);
    if (buckets.has(key)) {
      buckets.set(key, (buckets.get(key) ?? 0) + tx.net);
    }
  }

  return Array.from(buckets.entries()).map(([date, value]) => ({
    date,
    value: centsToDollars(value),
  }));
}

async function countCustomersCreated(
  stripe: Stripe,
  start: number,
  end: number,
): Promise<number> {
  const customers = await paginate((startingAfter) =>
    stripe.customers.list({
      created: { gte: start, lte: end },
      limit: 100,
      starting_after: startingAfter,
    }),
  );
  return customers.length;
}

async function listCustomersCreated(
  stripe: Stripe,
  start: number,
  end: number,
): Promise<Stripe.Customer[]> {
  return paginate((startingAfter) =>
    stripe.customers.list({
      created: { gte: start, lte: end },
      limit: 100,
      starting_after: startingAfter,
    }),
  );
}

function groupDailyNewUsers(
  customers: Stripe.Customer[],
  startDate: Date,
  endDate: Date,
): DailyPoint[] {
  const buckets = new Map<string, number>();
  for (let d = new Date(startDate); d <= endDate; d = addDays(d, 1)) {
    buckets.set(formatDateKey(d), 0);
  }

  for (const customer of customers) {
    const key = dateKeyFromUnix(customer.created);
    if (buckets.has(key)) {
      buckets.set(key, (buckets.get(key) ?? 0) + 1);
    }
  }

  return Array.from(buckets.entries()).map(([date, value]) => ({
    date,
    value,
  }));
}

function monthlyAmountFromPrice(price: Stripe.Price, quantity: number): number {
  const amount = (price.unit_amount ?? 0) * quantity;
  const interval = price.recurring?.interval;
  const intervalCount = price.recurring?.interval_count ?? 1;

  if (!interval) return 0;
  if (interval === "month") return amount / intervalCount;
  if (interval === "year") return amount / (12 * intervalCount);
  if (interval === "week") return (amount * 52) / (12 * intervalCount);
  if (interval === "day") return (amount * 365) / (12 * intervalCount);
  return 0;
}

function subscriptionMonthlyCents(sub: Stripe.Subscription): number {
  let total = 0;
  for (const item of sub.items.data) {
    const price = item.price;
    if (!price || typeof price === "string") continue;
    total += monthlyAmountFromPrice(price, item.quantity ?? 1);
  }
  return total;
}

function wasSubscriptionActiveOnDay(
  sub: Stripe.Subscription,
  day: Date,
): boolean {
  const dayStart = startOfDayUnix(day);
  const dayEnd = endOfDayUnix(day);

  if (sub.created > dayEnd) return false;

  const endedAt = sub.ended_at ?? null;
  if (endedAt && endedAt < dayStart) return false;

  const canceledAt = sub.canceled_at ?? null;
  if (canceledAt && canceledAt < dayStart) return false;

  if (sub.status === "active" || sub.status === "trialing" || sub.status === "past_due") {
    return true;
  }

  if (sub.status === "canceled" && canceledAt) {
    return canceledAt >= dayStart && sub.created <= dayEnd;
  }

  return false;
}

async function listSubscriptionsForMrr(stripe: Stripe): Promise<Stripe.Subscription[]> {
  const statuses = ["active", "trialing", "past_due", "canceled", "unpaid"] as const;
  const all: Stripe.Subscription[] = [];

  for (const status of statuses) {
    const page = await paginate((startingAfter) =>
      stripe.subscriptions.list({
        status,
        limit: 100,
        starting_after: startingAfter,
        expand: ["data.items.data.price"],
      }),
    );
    all.push(...page);
  }

  const seen = new Set<string>();
  return all.filter((sub) => {
    if (seen.has(sub.id)) return false;
    seen.add(sub.id);
    return true;
  });
}

async function computeMrr(stripe: Stripe): Promise<number> {
  const subs = await paginate((startingAfter) =>
    stripe.subscriptions.list({
      status: "active",
      limit: 100,
      starting_after: startingAfter,
      expand: ["data.items.data.price"],
    }),
  );

  const trialing = await paginate((startingAfter) =>
    stripe.subscriptions.list({
      status: "trialing",
      limit: 100,
      starting_after: startingAfter,
      expand: ["data.items.data.price"],
    }),
  );

  let mrr = 0;
  for (const sub of [...subs, ...trialing]) {
    mrr += subscriptionMonthlyCents(sub);
  }

  return centsToDollars(mrr);
}

async function buildDailyMrrSeries(
  stripe: Stripe,
  startDate: Date,
  endDate: Date,
): Promise<DailyPoint[]> {
  const subs = await listSubscriptionsForMrr(stripe);
  const points: DailyPoint[] = [];

  for (let d = new Date(startDate); d <= endDate; d = addDays(d, 1)) {
    let dayMrr = 0;
    for (const sub of subs) {
      if (wasSubscriptionActiveOnDay(sub, d)) {
        dayMrr += subscriptionMonthlyCents(sub);
      }
    }
    points.push({ date: formatDateKey(d), value: centsToDollars(dayMrr) });
  }

  return points;
}

async function invoicePaymentsBreakdown(
  stripe: Stripe,
  start: number,
  end: number,
) {
  const invoices = await paginate((startingAfter) =>
    stripe.invoices.list({
      created: { gte: start, lte: end },
      limit: 100,
      starting_after: startingAfter,
    }),
  );

  const now = Math.floor(Date.now() / 1000);
  const breakdown = {
    paid: 0,
    pastDue: 0,
    failed: 0,
    pending: 0,
  };

  for (const invoice of invoices) {
    if (invoice.status === "paid") {
      breakdown.paid += 1;
      continue;
    }
    if (invoice.status === "uncollectible") {
      breakdown.failed += 1;
      continue;
    }
    if (invoice.status === "open") {
      const dueDate = invoice.due_date ?? invoice.created;
      if (dueDate < now) breakdown.pastDue += 1;
      else breakdown.pending += 1;
      continue;
    }
    if (invoice.status === "draft") {
      breakdown.pending += 1;
    }
  }

  return breakdown;
}

export async function fetchStripeAdminMetrics(
  stripe: Stripe,
  periodDays = 7,
): Promise<StripeAdminMetrics> {
  const now = new Date();
  const todayStart = startOfDayUnix(now);
  const todayEnd = endOfDayUnix(now);
  const yesterday = addDays(now, -1);
  const yesterdayStart = startOfDayUnix(yesterday);
  const yesterdayEnd = endOfDayUnix(yesterday);

  const periodEndDate = new Date(now);
  periodEndDate.setUTCHours(23, 59, 59, 999);
  const periodStartDate = addDays(periodEndDate, -(periodDays - 1));
  periodStartDate.setUTCHours(0, 0, 0, 0);

  const previousEndDate = addDays(periodStartDate, -1);
  previousEndDate.setUTCHours(23, 59, 59, 999);
  const previousStartDate = addDays(previousEndDate, -(periodDays - 1));
  previousStartDate.setUTCHours(0, 0, 0, 0);

  const periodStart = Math.floor(periodStartDate.getTime() / 1000);
  const periodEnd = Math.floor(periodEndDate.getTime() / 1000);
  const previousStart = Math.floor(previousStartDate.getTime() / 1000);
  const previousEnd = Math.floor(previousEndDate.getTime() / 1000);

  const [
    periodTx,
    previousTx,
    todayCharges,
    yesterdayCharges,
    periodCharges,
    previousCharges,
    periodCustomers,
    previousNewUsers,
    balance,
    payouts,
    mrr,
    dailyMrr,
    paymentsBreakdown,
  ] = await Promise.all([
    listBalanceTransactions(stripe, periodStart, periodEnd),
    listBalanceTransactions(stripe, previousStart, previousEnd),
    listCharges(stripe, todayStart, todayEnd),
    listCharges(stripe, yesterdayStart, yesterdayEnd),
    listCharges(stripe, periodStart, periodEnd),
    listCharges(stripe, previousStart, previousEnd),
    listCustomersCreated(stripe, periodStart, periodEnd),
    countCustomersCreated(stripe, previousStart, previousEnd),
    stripe.balance.retrieve(),
    stripe.payouts.list({ limit: 5, status: "pending" }),
    computeMrr(stripe),
    buildDailyMrrSeries(stripe, periodStartDate, periodEndDate),
    invoicePaymentsBreakdown(stripe, periodStart, periodEnd),
  ]);

  const recentPaidPayouts = await stripe.payouts.list({ limit: 1, status: "paid" });

  const available = balance.available.reduce((sum, b) => sum + b.amount, 0);
  const pending = balance.pending.reduce((sum, b) => sum + b.amount, 0);
  const currency = balance.available[0]?.currency ?? balance.pending[0]?.currency ?? "usd";
  const recentPayout = recentPaidPayouts.data[0] ?? null;
  const pendingPayoutTotal = payouts.data.reduce((sum, p) => sum + p.amount, 0);

  const grossToday = centsToDollars(sumGrossFromCharges(todayCharges));
  const grossYesterday = centsToDollars(sumGrossFromCharges(yesterdayCharges));
  const grossRevenue = centsToDollars(sumGrossFromCharges(periodCharges));
  const previousGrossRevenue = centsToDollars(sumGrossFromCharges(previousCharges));
  const netRevenue = centsToDollars(sumNetFromTransactions(periodTx));
  const previousNetRevenue = centsToDollars(sumNetFromTransactions(previousTx));

  return {
    today: {
      grossRevenue: grossToday,
      yesterdayGrossRevenue: grossYesterday,
      hourly: groupHourlyGrossFromCharges(todayCharges),
      updatedAt: now.toISOString(),
    },
    balance: {
      total: centsToDollars(available + pending),
      available: centsToDollars(available),
      pending: centsToDollars(pending),
      currency,
    },
    payouts: {
      recentAmount: recentPayout ? centsToDollars(recentPayout.amount) : null,
      recentArrivalDate: recentPayout?.arrival_date
        ? new Date(recentPayout.arrival_date * 1000).toISOString()
        : null,
      pendingAmount: centsToDollars(pendingPayoutTotal),
      currency,
    },
    stats: {
      periodStart: periodStartDate.toISOString(),
      periodEnd: periodEndDate.toISOString(),
      previousPeriodStart: previousStartDate.toISOString(),
      previousPeriodEnd: previousEndDate.toISOString(),
      grossRevenue,
      previousGrossRevenue,
      netRevenue,
      previousNetRevenue,
      newUsers: periodCustomers.length,
      previousNewUsers,
      mrr,
      arr: mrr * 12,
      dailyGross: groupDailyGrossFromCharges(periodCharges, periodStartDate, periodEndDate),
      dailyNet: groupDailyNet(periodTx, periodStartDate, periodEndDate),
      dailyNewUsers: groupDailyNewUsers(periodCustomers, periodStartDate, periodEndDate),
      dailyMrr,
      paymentsBreakdown,
    },
  };
}
