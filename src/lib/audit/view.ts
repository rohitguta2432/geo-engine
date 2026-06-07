import { scoreAudit } from "@/lib/audit/score";
import {
  getAudit,
  getAuditResults,
  getProject,
  liftSeries,
} from "@/lib/repo";
import type { Audit, AuditResult, AuditScore, LiftPoint, Project } from "@/lib/types";

export interface AuditView {
  audit: Audit;
  project: Project;
  score: AuditScore | null;
  lift: LiftPoint[];
  results: AuditResult[];
}

/** Compose everything the dashboard (and the GET route) needs for one audit. */
export function getAuditView(id: string): AuditView | null {
  const audit = getAudit(id);
  if (!audit) return null;
  const project = getProject(audit.projectId);
  if (!project) return null;
  const results = getAuditResults(id);
  const score = results.length ? scoreAudit(project, results) : null;
  const lift = liftSeries(project.id);
  return { audit, project, score, lift, results };
}
