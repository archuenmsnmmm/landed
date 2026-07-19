import { getSupabase, isSupabaseConfigured } from "../lib/supabase";
import { compileKnowledgeContext, DEFAULT_COMPANY_INFO } from "../lib/company-info";
import { normalizeKnowledgeDocuments } from "../lib/knowledge-documents";
import { extractAccountProfile } from "../store/accountProfile";
import type { AccountProfile } from "../store/accountProfile";
import type { MeetingRecord } from "../store/types";
import { notifyAppStoreChanged, syncPlanLimitsToMain, useAppStore } from "../store/useAppStore";

type MeetingRow = {
  id: string;
  user_id: string;
  title: string;
  company: string;
  call_date: string;
  duration_sec: number;
  mode: string;
  summary: string;
  summary_sections: unknown;
  status: string | null;
  next_steps: unknown;
  transcript: unknown;
  deal_score: number;
  objections: unknown;
  suggestion_uses: number;
  suggestions: unknown;
  deal_outcome: string;
  deal_outcome_at: string | null;
  deal_outcome_notes: string | null;
  deal_link: unknown;
  manager_notes: string | null;
  updated_at: string;
};

type AppStatePayload = Omit<
  AccountProfile,
  | "meetings"
  | "plan"
  | "paywallComplete"
  | "freeOverlaySecondsUsed"
  | "freeQuestionsUsed"
>;

const ENTITLEMENT_KEYS = new Set([
  "plan",
  "paywallComplete",
  "freeOverlaySecondsUsed",
  "freeQuestionsUsed",
]);

function stripEntitlementFields<T extends Record<string, unknown>>(state: T): T {
  const next = { ...state };
  for (const key of ENTITLEMENT_KEYS) {
    delete next[key];
  }
  return next;
}

function meetingToRow(userId: string, meeting: MeetingRecord): MeetingRow {
  return {
    id: meeting.id,
    user_id: userId,
    title: meeting.title,
    company: meeting.company,
    call_date: meeting.date,
    duration_sec: meeting.duration,
    mode: meeting.mode,
    summary: meeting.summary,
    summary_sections: meeting.summarySections ?? null,
    status: meeting.status ?? "ready",
    next_steps: meeting.nextSteps,
    transcript: meeting.transcript,
    deal_score: meeting.dealScore,
    objections: meeting.objections,
    suggestion_uses: meeting.suggestionUses ?? 0,
    suggestions: meeting.suggestions ?? [],
    deal_outcome: meeting.dealOutcome ?? "open",
    deal_outcome_at: meeting.dealOutcomeAt ?? null,
    deal_outcome_notes: meeting.dealOutcomeNotes ?? null,
    deal_link: meeting.dealLink ?? null,
    manager_notes: meeting.managerNotes ?? null,
    updated_at: new Date().toISOString(),
  };
}

function rowToMeeting(row: MeetingRow): MeetingRecord {
  return {
    id: row.id,
    title: row.title,
    company: row.company,
    date: row.call_date,
    duration: row.duration_sec,
    mode: row.mode as MeetingRecord["mode"],
    summary: row.summary,
    summarySections: (row.summary_sections as MeetingRecord["summarySections"]) ?? undefined,
    status: (row.status as MeetingRecord["status"]) ?? "ready",
    nextSteps: (row.next_steps as string[]) ?? [],
    transcript: (row.transcript as MeetingRecord["transcript"]) ?? [],
    dealScore: row.deal_score,
    objections: (row.objections as string[]) ?? [],
    suggestionUses: row.suggestion_uses,
    suggestions: (row.suggestions as MeetingRecord["suggestions"]) ?? [],
    dealOutcome: (row.deal_outcome as MeetingRecord["dealOutcome"]) ?? "open",
    dealOutcomeAt: row.deal_outcome_at ?? undefined,
    dealOutcomeNotes: row.deal_outcome_notes ?? undefined,
    dealLink: (row.deal_link as MeetingRecord["dealLink"]) ?? undefined,
    managerNotes: row.manager_notes ?? undefined,
  };
}

function meetingSortKey(meeting: MeetingRecord): number {
  return new Date(meeting.date).getTime();
}

export function mergeMeetings(
  local: MeetingRecord[],
  remote: MeetingRecord[],
): MeetingRecord[] {
  const byId = new Map<string, MeetingRecord>();

  for (const meeting of [...remote, ...local]) {
    const existing = byId.get(meeting.id);
    if (!existing) {
      byId.set(meeting.id, meeting);
      continue;
    }

    if (meeting.status === "ready" && existing.status === "processing") {
      byId.set(meeting.id, meeting);
      continue;
    }
    if (existing.status === "ready" && meeting.status === "processing") {
      continue;
    }

    if (meetingSortKey(meeting) >= meetingSortKey(existing)) {
      byId.set(meeting.id, meeting);
    }
  }

  return [...byId.values()].sort(
    (a, b) => meetingSortKey(b) - meetingSortKey(a),
  );
}

function mergeAppState(
  local: AccountProfile,
  remote: Partial<AppStatePayload> | null,
  remoteUpdatedAt: string | null,
  localUpdatedAt: string | null,
): AccountProfile {
  if (!remote || Object.keys(remote).length === 0) return local;

  const remoteTime = remoteUpdatedAt ? Date.parse(remoteUpdatedAt) : 0;
  const localTime = localUpdatedAt ? Date.parse(localUpdatedAt) : 0;
  const preferRemote = remoteTime > localTime;

  const pick = <T>(localValue: T, remoteValue: T | undefined): T =>
    preferRemote && remoteValue !== undefined ? remoteValue : localValue;

  return {
    ...local,
    onboardingComplete:
      local.onboardingComplete || Boolean(remote.onboardingComplete),
    shortcutTutorialComplete:
      local.shortcutTutorialComplete ||
      Boolean(remote.shortcutTutorialComplete),
    paywallComplete: local.paywallComplete,
    onboardingStep: pick(local.onboardingStep, remote.onboardingStep),
    plan: local.plan,
    activeMode: pick(local.activeMode, remote.activeMode),
    customSystemPrompt: pick(
      local.customSystemPrompt,
      remote.customSystemPrompt,
    ),
    companyInfo: preferRemote && remote.companyInfo
      ? { ...local.companyInfo, ...remote.companyInfo }
      : local.companyInfo,
    knowledgeFiles: normalizeKnowledgeDocuments(
      pick(local.knowledgeFiles, remote.knowledgeFiles),
    ),
    knowledgeContext: compileKnowledgeContext(
      pick(local.customSystemPrompt, remote.customSystemPrompt),
      preferRemote && remote.companyInfo
        ? { ...DEFAULT_COMPANY_INFO, ...local.companyInfo, ...remote.companyInfo }
        : local.companyInfo,
      normalizeKnowledgeDocuments(
        pick(local.knowledgeFiles, remote.knowledgeFiles),
      ),
    ),
    settings: preferRemote && remote.settings
      ? { ...local.settings, ...remote.settings }
      : local.settings,
    upcoming: pick(local.upcoming, remote.upcoming),
    freeOverlaySecondsUsed: local.freeOverlaySecondsUsed,
    // Entitlement fields stay local / server-profile synced — not in app_state.
    freeQuestionsUsed: local.freeQuestionsUsed,
    meetings: local.meetings,
  };
}

function appStateFromProfile(profile: AccountProfile): AppStatePayload {
  const { meetings: _meetings, ...appState } = profile;
  return stripEntitlementFields(appState) as AppStatePayload;
}

let pushTimer: ReturnType<typeof setTimeout> | null = null;
let syncInFlight: Promise<void> | null = null;

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isCloudUserId(userId: string): boolean {
  return UUID_RE.test(userId);
}

export function scheduleAccountPush(userId?: string | null): void {
  if (!userId || !isCloudUserId(userId) || !isSupabaseConfigured()) return;
  if (pushTimer) clearTimeout(pushTimer);
  pushTimer = setTimeout(() => {
    pushTimer = null;
    void pushAccountData(userId);
  }, 800);
}

export async function pushAccountData(
  userId: string,
  profileOverride?: AccountProfile,
): Promise<void> {
  const supabase = getSupabase();
  if (!supabase || !isCloudUserId(userId)) return;

  const state = useAppStore.getState();
  if (!profileOverride && state.user?.id !== userId) return;

  const profile = profileOverride ?? extractAccountProfile(state);
  const appState = appStateFromProfile(profile);
  const updatedAt = new Date().toISOString();

  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      app_state: appState,
      app_state_updated_at: updatedAt,
    })
    .eq("id", userId);

  if (profileError) {
    console.warn("[account-sync] app_state push failed:", profileError.message);
  }

  if (profile.meetings.length === 0) return;

  const rows = profile.meetings.map((meeting) => meetingToRow(userId, meeting));
  const { error: meetingsError } = await supabase.from("meetings").upsert(rows, {
    onConflict: "id",
  });

  if (meetingsError) {
    console.warn("[account-sync] meetings push failed:", meetingsError.message);
  }
}

export async function pushMeeting(userId: string, meeting: MeetingRecord): Promise<void> {
  const supabase = getSupabase();
  if (!supabase || !isCloudUserId(userId)) return;

  const { error } = await supabase
    .from("meetings")
    .upsert(meetingToRow(userId, meeting), { onConflict: "id" });

  if (error) {
    console.warn("[account-sync] meeting upsert failed:", error.message);
  }
}

export async function deleteRemoteMeeting(
  userId: string,
  meetingId: string,
): Promise<void> {
  const supabase = getSupabase();
  if (!supabase || !isCloudUserId(userId)) return;

  const { error } = await supabase
    .from("meetings")
    .delete()
    .eq("id", meetingId)
    .eq("user_id", userId);

  if (error) {
    console.warn("[account-sync] meeting delete failed:", error.message);
  }
}

export async function syncAccountData(userId: string): Promise<void> {
  if (!isSupabaseConfigured() || !isCloudUserId(userId)) return;

  if (syncInFlight) {
    await syncInFlight;
    return;
  }

  syncInFlight = (async () => {
    const supabase = getSupabase();
    if (!supabase) return;

    const store = useAppStore.getState();
    if (store.user?.id !== userId) return;

    const localProfile = extractAccountProfile(store);

    const [{ data: profileRow, error: profileError }, { data: meetingRows, error: meetingsError }] =
      await Promise.all([
        supabase
          .from("profiles")
          .select("app_state, app_state_updated_at")
          .eq("id", userId)
          .maybeSingle(),
        supabase
          .from("meetings")
          .select("*")
          .eq("user_id", userId)
          .order("call_date", { ascending: false }),
      ]);

    if (profileError) {
      console.warn("[account-sync] app_state fetch failed:", profileError.message);
    }
    if (meetingsError) {
      console.warn("[account-sync] meetings fetch failed:", meetingsError.message);
    }

    const remoteMeetings = (meetingRows ?? []).map((row) =>
      rowToMeeting(row as MeetingRow),
    );
    const mergedMeetings = mergeMeetings(localProfile.meetings, remoteMeetings);
    const mergedProfile = mergeAppState(
      { ...localProfile, meetings: mergedMeetings },
      (profileRow?.app_state as Partial<AppStatePayload> | null) ?? null,
      (profileRow?.app_state_updated_at as string | null) ?? null,
      null,
    );

    const profiles = {
      ...store.accountProfiles,
      [userId]: { ...mergedProfile, meetings: mergedMeetings },
    };

    useAppStore.setState({
      accountProfiles: profiles,
      onboardingComplete: mergedProfile.onboardingComplete,
      shortcutTutorialComplete: mergedProfile.shortcutTutorialComplete,
      paywallComplete: mergedProfile.paywallComplete,
      onboardingStep: mergedProfile.onboardingStep,
      plan: mergedProfile.plan,
      activeMode: mergedProfile.activeMode,
      customSystemPrompt: mergedProfile.customSystemPrompt,
      companyInfo: mergedProfile.companyInfo,
      knowledgeFiles: mergedProfile.knowledgeFiles,
      settings: mergedProfile.settings,
      meetings: mergedMeetings,
      upcoming: mergedProfile.upcoming,
      freeOverlaySecondsUsed: mergedProfile.freeOverlaySecondsUsed,
      freeQuestionsUsed: mergedProfile.freeQuestionsUsed,
    });

    notifyAppStoreChanged();
    syncPlanLimitsToMain();

    await pushAccountData(userId, { ...mergedProfile, meetings: mergedMeetings });
  })();

  try {
    await syncInFlight;
  } finally {
    syncInFlight = null;
  }
}

export function hasLocalAccountProfile(userId: string): boolean {
  const profile = useAppStore.getState().accountProfiles[userId];
  if (!profile) return false;
  return (
    profile.onboardingComplete ||
    profile.shortcutTutorialComplete ||
    profile.paywallComplete ||
    profile.meetings.length > 0
  );
}
