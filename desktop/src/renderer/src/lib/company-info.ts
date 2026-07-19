import { OPENAI_LIMITS } from "./openai-config";
import {
  formatUploadedKnowledgeBlock,
  MAX_KNOWLEDGE_PROMPT_CHARS,
  type KnowledgeDocument,
} from "./knowledge-documents";
import { BUNDLED_SALES_KNOWLEDGE } from "./sales-knowledge-base";
import { DEFAULT_OBJECTIONS, DEFAULT_PRODUCT } from "./prompts";

/** Compact candidate / interview context — stored locally per account. */
export interface CompanyInfo {
  /** Target company for the technical interview. */
  companyName: string;
  /** Role, stack, or problem types you want Landed to prioritise. */
  productDescription: string;
  /** Hard topics or gaps to prepare for. */
  commonObjections: string;
  keyFacts: string;
}

export const COMPANY_FIELD_LIMITS = {
  companyName: 100,
  productDescription: 500,
  commonObjections: 300,
  keyFacts: 600,
} as const;

export const DEFAULT_COMPANY_INFO: CompanyInfo = {
  companyName: "",
  productDescription: "",
  commonObjections: "",
  keyFacts: "",
};

export function clampCompanyInfo(info: Partial<CompanyInfo>): CompanyInfo {
  return {
    companyName: (info.companyName ?? "").slice(0, COMPANY_FIELD_LIMITS.companyName),
    productDescription: (info.productDescription ?? "").slice(
      0,
      COMPANY_FIELD_LIMITS.productDescription,
    ),
    commonObjections: (info.commonObjections ?? "").slice(
      0,
      COMPANY_FIELD_LIMITS.commonObjections,
    ),
    keyFacts: (info.keyFacts ?? "").slice(0, COMPANY_FIELD_LIMITS.keyFacts),
  };
}

export function getEffectiveProduct(info: CompanyInfo): string {
  const parts: string[] = [];
  if (info.companyName.trim()) {
    parts.push(`Interviewing at ${info.companyName.trim()}`);
  }
  if (info.productDescription.trim()) {
    parts.push(info.productDescription.trim());
  }
  if (info.keyFacts.trim()) {
    parts.push(`Key facts: ${info.keyFacts.trim().slice(0, 280)}`);
  }
  return parts.join(". ") || DEFAULT_PRODUCT;
}

export function getEffectiveObjections(info: CompanyInfo): string {
  return info.commonObjections.trim() || DEFAULT_OBJECTIONS;
}

/** Compact block injected into AI system prompts (~800 chars max). */
export function formatCompanyContext(info: CompanyInfo): string {
  const lines: string[] = [];

  if (info.companyName.trim()) {
    lines.push(`Target company: ${info.companyName.trim()}`);
  }
  if (info.productDescription.trim()) {
    lines.push(`Role / stack: ${info.productDescription.trim()}`);
  }
  if (info.commonObjections.trim()) {
    lines.push(`Hard topics to prep: ${info.commonObjections.trim()}`);
  }
  if (info.keyFacts.trim()) {
    lines.push(`Key facts: ${info.keyFacts.trim()}`);
  }

  return lines.join("\n");
}

export interface CoachingContextOptions {
  /** Cap uploaded-doc injection for fast live suggestions. */
  maxUploadedKnowledgeChars?: number;
  includeBundledSalesKnowledge?: boolean;
}

export function getProductFromKnowledge(
  documents: KnowledgeDocument[],
  fallback = DEFAULT_PRODUCT,
): string {
  if (!documents.length) return fallback;

  const doc = documents[0];
  const snippet = doc.text.trim().replace(/\s+/g, " ").slice(0, 140);
  return snippet || doc.name.trim() || fallback;
}

export function buildAiCoachingContext(
  customSystemPrompt: string,
  companyInfo: CompanyInfo,
  knowledgeDocuments: KnowledgeDocument[] = [],
  options: CoachingContextOptions = {},
): string {
  const includeBundled = options.includeBundledSalesKnowledge ?? false;
  const companyBlock = formatCompanyContext(companyInfo);
  const uploadedBlock = formatUploadedKnowledgeBlock(
    knowledgeDocuments,
    options.maxUploadedKnowledgeChars,
  );
  const prompt = customSystemPrompt.trim();

  const blocks = [
    prompt,
    uploadedBlock,
    companyBlock,
    includeBundled
      ? `TECHNICAL INTERVIEW CONTEXT:\n${BUNDLED_SALES_KNOWLEDGE}`
      : "",
  ].filter(Boolean);

  return blocks.join("\n\n");
}

/** Compile once when docs/settings change — stored locally, reused on every call. */
export function compileKnowledgeContext(
  customSystemPrompt: string,
  companyInfo: CompanyInfo,
  knowledgeDocuments: KnowledgeDocument[] = [],
): string {
  return buildAiCoachingContext(
    customSystemPrompt,
    companyInfo,
    knowledgeDocuments,
    {
      maxUploadedKnowledgeChars: MAX_KNOWLEDGE_PROMPT_CHARS,
      includeBundledSalesKnowledge: false,
    },
  );
}

function findUploadMarkerIndex(text: string): number {
  const markers = ["UPLOADED PREP", "UPLOADED PLAYBOOK"];
  for (const marker of markers) {
    const idx = text.indexOf(marker);
    if (idx !== -1) return idx;
  }
  return -1;
}

/** Trim stored context for fast live auto-suggestions (full context used for assist/recap). */
export function getLiveKnowledgeContext(storedContext: string): string {
  const trimmed = storedContext.trim();
  if (!trimmed) return "";
  const limit = OPENAI_LIMITS.liveCoachingKnowledgeChars;
  if (trimmed.length <= limit) return trimmed;

  const uploadIndex = findUploadMarkerIndex(trimmed);
  if (uploadIndex === -1) return trimmed.slice(0, limit);

  const uploadBlock = trimmed.slice(uploadIndex);
  const meetingContext = trimmed.slice(0, uploadIndex).trim();
  const uploadBudget = Math.min(uploadBlock.length, Math.floor(limit * 0.6));
  const contextBudget = Math.max(0, limit - uploadBudget - 2);
  const contextPart = meetingContext.slice(0, contextBudget);
  const uploadPart = uploadBlock.slice(0, uploadBudget);
  return [contextPart, uploadPart].filter(Boolean).join("\n\n");
}

/** Trim stored context for instant overlay suggestions — minimal tokens. */
export function getInstantKnowledgeContext(storedContext: string): string {
  const trimmed = storedContext.trim();
  if (!trimmed) return "";
  const limit = OPENAI_LIMITS.instantCoachingKnowledgeChars;
  if (trimmed.length <= limit) return trimmed;

  const uploadIndex = findUploadMarkerIndex(trimmed);
  if (uploadIndex === -1) return trimmed.slice(0, limit);

  // Prefer uploaded playbook content; keep a short slice of mode / company instructions.
  const modeBlock = trimmed.slice(0, uploadIndex).trim();
  const uploadBlock = trimmed.slice(uploadIndex);
  const modeBudget = Math.min(modeBlock.length, Math.floor(limit * 0.25));
  const uploadBudget = Math.max(0, limit - modeBudget - 2);
  return [modeBlock.slice(0, modeBudget), uploadBlock.slice(0, uploadBudget)]
    .filter(Boolean)
    .join("\n\n");
}

export function hasCompanyInfo(info: CompanyInfo): boolean {
  return Boolean(
    info.companyName.trim() ||
      info.productDescription.trim() ||
      info.commonObjections.trim() ||
      info.keyFacts.trim(),
  );
}
