import { nanoid } from "nanoid";
import { db } from "@/lib/db";
import type {
  Audit,
  AuditResult,
  AuditStatus,
  Asset,
  AssetType,
  LiftPoint,
  Project,
} from "@/lib/types";

/* ----------------------------- row mappers ------------------------------ */

type ProjectRow = {
  id: string;
  owner: string;
  brand: string;
  domain: string;
  category: string;
  competitors: string;
  created_at: number;
};
function toProject(r: ProjectRow): Project {
  return {
    id: r.id,
    owner: r.owner,
    brand: r.brand,
    domain: r.domain,
    category: r.category,
    competitors: JSON.parse(r.competitors),
    createdAt: r.created_at,
  };
}

type AuditRow = {
  id: string;
  project_id: string;
  status: string;
  engines: string;
  prompt_count: number;
  visibility_score: number | null;
  progress_done: number;
  progress_total: number;
  error: string | null;
  created_at: number;
  completed_at: number | null;
};
function toAudit(r: AuditRow): Audit {
  return {
    id: r.id,
    projectId: r.project_id,
    status: r.status as AuditStatus,
    engines: JSON.parse(r.engines),
    promptCount: r.prompt_count,
    visibilityScore: r.visibility_score,
    progressDone: r.progress_done,
    progressTotal: r.progress_total,
    error: r.error,
    createdAt: r.created_at,
    completedAt: r.completed_at,
  };
}

type ResultRow = {
  id: string;
  audit_id: string;
  prompt: string;
  engine: string;
  answer: string;
  brand_mentioned: number;
  brand_cited: number;
  competitors_found: string;
  citations: string;
  web_search_used: number;
  created_at: number;
};
function toResult(r: ResultRow): AuditResult {
  return {
    id: r.id,
    auditId: r.audit_id,
    prompt: r.prompt,
    engine: r.engine,
    answer: r.answer,
    brandMentioned: !!r.brand_mentioned,
    brandCited: !!r.brand_cited,
    competitorsFound: JSON.parse(r.competitors_found),
    citations: JSON.parse(r.citations),
    webSearchUsed: !!r.web_search_used,
    createdAt: r.created_at,
  };
}

type AssetRow = {
  id: string;
  project_id: string;
  audit_id: string | null;
  prompt: string;
  type: string;
  title: string;
  body_md: string;
  body_html: string;
  schema_jsonld: string;
  created_at: number;
};
function toAsset(r: AssetRow): Asset {
  return {
    id: r.id,
    projectId: r.project_id,
    auditId: r.audit_id,
    prompt: r.prompt,
    type: r.type as AssetType,
    title: r.title,
    bodyMd: r.body_md,
    bodyHtml: r.body_html,
    schemaJsonld: r.schema_jsonld,
    createdAt: r.created_at,
  };
}

/* ------------------------------- projects ------------------------------- */

export function createProject(input: {
  brand: string;
  domain: string;
  category: string;
  competitors: string[];
  owner?: string;
}): Project {
  const id = nanoid(12);
  const now = Date.now();
  db()
    .prepare(
      `INSERT INTO projects (id, owner, brand, domain, category, competitors, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      id,
      input.owner ?? "local",
      input.brand,
      input.domain,
      input.category,
      JSON.stringify(input.competitors),
      now,
    );
  return getProject(id)!;
}

export function getProject(id: string): Project | null {
  const r = db().prepare("SELECT * FROM projects WHERE id = ?").get(id) as
    | ProjectRow
    | undefined;
  return r ? toProject(r) : null;
}

/* -------------------------------- audits -------------------------------- */

export function createAudit(input: {
  projectId: string;
  engines: string[];
  promptCount: number;
}): Audit {
  const id = nanoid(12);
  const now = Date.now();
  db()
    .prepare(
      `INSERT INTO audits (id, project_id, status, engines, prompt_count, progress_total, created_at)
       VALUES (?, ?, 'pending', ?, ?, ?, ?)`,
    )
    .run(
      id,
      input.projectId,
      JSON.stringify(input.engines),
      input.promptCount,
      input.promptCount * input.engines.length,
      now,
    );
  return getAudit(id)!;
}

export function getAudit(id: string): Audit | null {
  const r = db().prepare("SELECT * FROM audits WHERE id = ?").get(id) as
    | AuditRow
    | undefined;
  return r ? toAudit(r) : null;
}

export function setAuditStatus(id: string, status: AuditStatus, error?: string) {
  db()
    .prepare("UPDATE audits SET status = ?, error = ? WHERE id = ?")
    .run(status, error ?? null, id);
}

export function bumpAuditProgress(id: string, done: number) {
  db().prepare("UPDATE audits SET progress_done = ? WHERE id = ?").run(done, id);
}

export function completeAudit(id: string, visibilityScore: number) {
  db()
    .prepare(
      "UPDATE audits SET status = 'completed', visibility_score = ?, completed_at = ? WHERE id = ?",
    )
    .run(visibilityScore, Date.now(), id);
}

export function listProjectAudits(projectId: string): Audit[] {
  const rows = db()
    .prepare("SELECT * FROM audits WHERE project_id = ? ORDER BY created_at ASC")
    .all(projectId) as AuditRow[];
  return rows.map(toAudit);
}

export function liftSeries(projectId: string): LiftPoint[] {
  return listProjectAudits(projectId)
    .filter((a) => a.status === "completed" && a.visibilityScore !== null)
    .map((a) => ({
      auditId: a.id,
      at: a.completedAt ?? a.createdAt,
      visibilityScore: a.visibilityScore as number,
    }));
}

/* ---------------------------- audit results ----------------------------- */

export function insertResult(r: Omit<AuditResult, "id" | "createdAt">): AuditResult {
  const id = nanoid(12);
  const now = Date.now();
  db()
    .prepare(
      `INSERT INTO audit_results
        (id, audit_id, prompt, engine, answer, brand_mentioned, brand_cited,
         competitors_found, citations, web_search_used, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      id,
      r.auditId,
      r.prompt,
      r.engine,
      r.answer,
      r.brandMentioned ? 1 : 0,
      r.brandCited ? 1 : 0,
      JSON.stringify(r.competitorsFound),
      JSON.stringify(r.citations),
      r.webSearchUsed ? 1 : 0,
      now,
    );
  return { ...r, id, createdAt: now };
}

export function getAuditResults(auditId: string): AuditResult[] {
  const rows = db()
    .prepare("SELECT * FROM audit_results WHERE audit_id = ? ORDER BY created_at ASC")
    .all(auditId) as ResultRow[];
  return rows.map(toResult);
}

/* -------------------------------- assets -------------------------------- */

export function insertAsset(a: Omit<Asset, "id" | "createdAt">): Asset {
  const id = nanoid(12);
  const now = Date.now();
  db()
    .prepare(
      `INSERT INTO assets
        (id, project_id, audit_id, prompt, type, title, body_md, body_html, schema_jsonld, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      id,
      a.projectId,
      a.auditId,
      a.prompt,
      a.type,
      a.title,
      a.bodyMd,
      a.bodyHtml,
      a.schemaJsonld,
      now,
    );
  return { ...a, id, createdAt: now };
}

export function getAsset(id: string): Asset | null {
  const r = db().prepare("SELECT * FROM assets WHERE id = ?").get(id) as
    | AssetRow
    | undefined;
  return r ? toAsset(r) : null;
}

export function listProjectAssets(projectId: string): Asset[] {
  const rows = db()
    .prepare("SELECT * FROM assets WHERE project_id = ? ORDER BY created_at DESC")
    .all(projectId) as AssetRow[];
  return rows.map(toAsset);
}
