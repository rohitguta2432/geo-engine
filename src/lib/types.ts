export type AuditStatus = "pending" | "running" | "completed" | "error";

export type AssetType = "comparison" | "qa" | "listicle";

export interface Project {
  id: string;
  owner: string;
  brand: string;
  domain: string;
  category: string;
  competitors: string[];
  createdAt: number;
}

export interface Audit {
  id: string;
  projectId: string;
  status: AuditStatus;
  engines: string[];
  promptCount: number;
  /** 0-100 share-of-voice score; null until completed. */
  visibilityScore: number | null;
  progressDone: number;
  progressTotal: number;
  error: string | null;
  createdAt: number;
  completedAt: number | null;
}

export interface AuditResult {
  id: string;
  auditId: string;
  prompt: string;
  engine: string;
  answer: string;
  brandMentioned: boolean;
  brandCited: boolean;
  competitorsFound: string[];
  citations: string[];
  webSearchUsed: boolean;
  createdAt: number;
}

export interface Asset {
  id: string;
  projectId: string;
  auditId: string | null;
  prompt: string;
  type: AssetType;
  title: string;
  bodyMd: string;
  bodyHtml: string;
  schemaJsonld: string;
  createdAt: number;
}

/** A buyer-intent query where the brand is invisible but rivals are cited. */
export interface GapPrompt {
  prompt: string;
  competitorsFound: string[];
  engines: string[];
}

/**
 * A domain that AI answer-engines cite for this category, and who owns it.
 * The `third-party` sources are the GEO target list: the places to earn a
 * mention so the engines start citing you instead of only your rivals.
 */
export interface CitationSource {
  domain: string;
  /** Total times this domain was cited across all (prompt, engine) probes. */
  count: number;
  /** Distinct prompts whose answers cited this domain. */
  prompts: number;
  /** Engines that cited this domain at least once. */
  engines: string[];
  owner: "brand" | "competitor" | "third-party";
  /** Brand or competitor name when `owner` is not third-party. */
  ownerName?: string;
}

/** Aggregated scoring for an audit, computed from its results. */
export interface AuditScore {
  visibilityScore: number;
  brandCitationRate: number;
  promptsTotal: number;
  promptsWithBrand: number;
  leaderboard: { name: string; mentions: number; citations: number; share: number }[];
  gaps: GapPrompt[];
  /** Where the engines source their answers, most-cited domain first. */
  sources: CitationSource[];
}

/** One point in a project's visibility-over-time series. */
export interface LiftPoint {
  auditId: string;
  at: number;
  visibilityScore: number;
}
