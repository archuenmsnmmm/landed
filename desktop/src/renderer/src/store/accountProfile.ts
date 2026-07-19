import {
  compileKnowledgeContext,
  DEFAULT_COMPANY_INFO,
  type CompanyInfo,
} from "../lib/company-info";
import {
  normalizeKnowledgeDocuments,
  type KnowledgeDocument,
} from "../lib/knowledge-documents";
import {
  DEFAULT_SETTINGS,
  DEFAULT_UPCOMING,
  resolveFreeOverlaySecondsUsed,
  resolveFreeQuestionsUsed,
  CONVERSATION_MODES,
  normalizeConversationMode,
  type MeetingRecord,
  type Plan,
  type ConversationMode,
  type UpcomingCall,
  type UserSettings,
} from "./types";

/** Per-account persisted data — isolated between sign-ins. */
export interface AccountProfile {
  onboardingComplete: boolean;
  shortcutTutorialComplete: boolean;
  paywallComplete: boolean;
  onboardingStep: number;
  plan: Plan;
  activeMode: ConversationMode;
  customSystemPrompt: string;
  companyInfo: CompanyInfo;
  knowledgeFiles: KnowledgeDocument[];
  /** Pre-compiled from uploaded docs + company info — read once, reused in calls. */
  knowledgeContext: string;
  settings: UserSettings;
  meetings: MeetingRecord[];
  upcoming: UpcomingCall[];
  freeOverlaySecondsUsed: number;
  freeQuestionsUsed: number;
  /** @deprecated Remote payloads may still include legacy session counts. */
  freeSessionsUsed?: number;
}

export type AccountProfiles = Record<string, AccountProfile>;

export function createDefaultAccountProfile(): AccountProfile {
  return {
    onboardingComplete: false,
    shortcutTutorialComplete: true,
    paywallComplete: false,
    onboardingStep: 0,
    plan: "free",
    activeMode: "sales",
    customSystemPrompt: CONVERSATION_MODES[0].systemPrompt,
    companyInfo: { ...DEFAULT_COMPANY_INFO },
    knowledgeFiles: [],
    knowledgeContext: "",
    settings: { ...DEFAULT_SETTINGS },
    meetings: [],
    upcoming: [...DEFAULT_UPCOMING],
    freeOverlaySecondsUsed: 0,
    freeQuestionsUsed: 0,
  };
}

export function extractAccountProfile(state: {
  onboardingComplete: boolean;
  shortcutTutorialComplete: boolean;
  paywallComplete: boolean;
  onboardingStep: number;
  plan: Plan;
  activeMode: ConversationMode;
  customSystemPrompt: string;
  companyInfo: CompanyInfo;
  knowledgeFiles: KnowledgeDocument[];
  knowledgeContext: string;
  settings: UserSettings;
  meetings: MeetingRecord[];
  upcoming: UpcomingCall[];
  freeOverlaySecondsUsed: number;
  freeQuestionsUsed: number;
}): AccountProfile {
  const knowledgeFiles = normalizeKnowledgeDocuments(state.knowledgeFiles);
  return {
    onboardingComplete: state.onboardingComplete,
    shortcutTutorialComplete: state.shortcutTutorialComplete,
    paywallComplete: state.paywallComplete,
    onboardingStep: state.onboardingStep,
    plan: state.plan,
    activeMode: normalizeConversationMode(state.activeMode),
    customSystemPrompt: state.customSystemPrompt,
    companyInfo: { ...state.companyInfo },
    knowledgeFiles,
    knowledgeContext: compileKnowledgeContext(
      state.customSystemPrompt,
      state.companyInfo,
      knowledgeFiles,
    ),
    settings: { ...state.settings },
    // Never persist full transcripts in localStorage — sync lives in Supabase.
    meetings: state.meetings.map((m) => ({ ...m, transcript: [] })),
    upcoming: [...state.upcoming],
    freeOverlaySecondsUsed: state.freeOverlaySecondsUsed,
    freeQuestionsUsed: state.freeQuestionsUsed,
  };
}

export function applyAccountProfile(profile: AccountProfile) {
  const companyInfo = profile.companyInfo
    ? { ...DEFAULT_COMPANY_INFO, ...profile.companyInfo }
    : { ...DEFAULT_COMPANY_INFO };
  const knowledgeFiles = normalizeKnowledgeDocuments(profile.knowledgeFiles);

  return {
    onboardingComplete: profile.onboardingComplete,
    shortcutTutorialComplete: profile.shortcutTutorialComplete,
    paywallComplete: profile.paywallComplete,
    onboardingStep: profile.onboardingStep,
    plan: profile.plan,
    activeMode: normalizeConversationMode(profile.activeMode),
    customSystemPrompt: profile.customSystemPrompt,
    companyInfo,
    knowledgeFiles,
    knowledgeContext: compileKnowledgeContext(
      profile.customSystemPrompt,
      companyInfo,
      knowledgeFiles,
    ),
    settings: { ...DEFAULT_SETTINGS, ...profile.settings },
    meetings: [...profile.meetings],
    upcoming: [...profile.upcoming],
    freeOverlaySecondsUsed: profile.freeOverlaySecondsUsed,
    freeQuestionsUsed: resolveFreeQuestionsUsed(
      profile.freeQuestionsUsed,
      profile.freeOverlaySecondsUsed,
    ),
  };
}

export function extractLegacyAccountProfile(
  state: Record<string, unknown>,
): AccountProfile {
  const defaults = createDefaultAccountProfile();
  const companyInfo = state.companyInfo
    ? { ...DEFAULT_COMPANY_INFO, ...(state.companyInfo as CompanyInfo) }
    : defaults.companyInfo;
  const knowledgeFiles = normalizeKnowledgeDocuments(state.knowledgeFiles);

  return {
    onboardingComplete: Boolean(state.onboardingComplete),
    shortcutTutorialComplete: Boolean(state.shortcutTutorialComplete),
    paywallComplete: Boolean(state.paywallComplete),
    onboardingStep: Number(state.onboardingStep) || 0,
    plan: (state.plan as Plan) ?? defaults.plan,
    activeMode: normalizeConversationMode(
      (state.activeMode as ConversationMode) ?? defaults.activeMode,
    ),
    customSystemPrompt:
      (state.customSystemPrompt as string) ?? defaults.customSystemPrompt,
    companyInfo,
    knowledgeFiles,
    knowledgeContext: compileKnowledgeContext(
      (state.customSystemPrompt as string) ?? defaults.customSystemPrompt,
      companyInfo,
      knowledgeFiles,
    ),
    settings: {
      ...defaults.settings,
      ...(state.settings as UserSettings | undefined),
    },
    meetings: Array.isArray(state.meetings)
      ? [...(state.meetings as MeetingRecord[])]
      : defaults.meetings,
    upcoming: Array.isArray(state.upcoming)
      ? [...(state.upcoming as UpcomingCall[])]
      : defaults.upcoming,
    freeOverlaySecondsUsed: resolveFreeOverlaySecondsUsed(
      Number(state.freeOverlaySecondsUsed) || undefined,
      Number(state.freeSessionsUsed) || undefined,
    ),
    freeQuestionsUsed: resolveFreeQuestionsUsed(
      Number(state.freeQuestionsUsed) || undefined,
      resolveFreeOverlaySecondsUsed(
        Number(state.freeOverlaySecondsUsed) || undefined,
        Number(state.freeSessionsUsed) || undefined,
      ),
    ),
  };
}
