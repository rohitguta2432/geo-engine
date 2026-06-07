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

/** Aggregated scoring for an audit, computed from its results. */
export interface AuditScore {
  visibilityScore: number;
  brandCitationRate: number;
  promptsTotal: number;
  promptsWithBrand: number;
  leaderboard: { name: string; mentions: number; citations: number; share: number }[];
  gaps: GapPrompt[];
}

/** One point in a project's visibility-over-time series. */
export interface LiftPoint {
  auditId: string;
  at: number;
  visibilityScore: number;
}
