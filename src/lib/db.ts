import Database from "better-sqlite3";
import { config } from "@/lib/config";

/**
 * SQLite is the zero-setup local default. For production, swap this module's
 * query helpers for Postgres (Supabase/Neon) — the repo layer is the only
 * caller, so the surface to change is small.
 */

const SCHEMA = `
CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  owner TEXT NOT NULL DEFAULT 'local',
  brand TEXT NOT NULL,
  domain TEXT NOT NULL,
  category TEXT NOT NULL,
  competitors TEXT NOT NULL DEFAULT '[]',
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS audits (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id),
  status TEXT NOT NULL DEFAULT 'pending',
  engines TEXT NOT NULL DEFAULT '[]',
  prompt_count INTEGER NOT NULL DEFAULT 0,
  visibility_score REAL,
  progress_done INTEGER NOT NULL DEFAULT 0,
  progress_total INTEGER NOT NULL DEFAULT 0,
  error TEXT,
  created_at INTEGER NOT NULL,
  completed_at INTEGER
);
CREATE INDEX IF NOT EXISTS idx_audits_project ON audits(project_id);

CREATE TABLE IF NOT EXISTS audit_results (
  id TEXT PRIMARY KEY,
  audit_id TEXT NOT NULL REFERENCES audits(id),
  prompt TEXT NOT NULL,
  engine TEXT NOT NULL,
  answer TEXT NOT NULL DEFAULT '',
  brand_mentioned INTEGER NOT NULL DEFAULT 0,
  brand_cited INTEGER NOT NULL DEFAULT 0,
  competitors_found TEXT NOT NULL DEFAULT '[]',
  citations TEXT NOT NULL DEFAULT '[]',
  web_search_used INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_results_audit ON audit_results(audit_id);

CREATE TABLE IF NOT EXISTS assets (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id),
  audit_id TEXT,
  prompt TEXT NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body_md TEXT NOT NULL DEFAULT '',
  body_html TEXT NOT NULL DEFAULT '',
  schema_jsonld TEXT NOT NULL DEFAULT '',
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_assets_project ON assets(project_id);
`;

type GlobalWithDb = typeof globalThis & { __geoDb?: Database.Database };

export function db(): Database.Database {
  const g = globalThis as GlobalWithDb;
  if (g.__geoDb) return g.__geoDb;
  const d = new Database(config.app.dbPath);
  d.pragma("journal_mode = WAL");
  d.exec(SCHEMA);
  g.__geoDb = d;
  return d;
}
