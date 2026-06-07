import { resolveEngines } from "@/lib/engines";
import { detect } from "@/lib/audit/detect";
import { generatePrompts } from "@/lib/audit/prompts";
import { scoreAudit } from "@/lib/audit/score";
import {
  bumpAuditProgress,
  completeAudit,
  getAudit,
  getAuditResults,
  getProject,
  insertResult,
  setAuditStatus,
} from "@/lib/repo";
import type { Project } from "@/lib/types";

/** Run async tasks with a bounded number in flight at once. */
async function mapPool<T, R>(
  items: T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let next = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (true) {
      const i = next++;
      if (i >= items.length) break;
      out[i] = await fn(items[i], i);
    }
  });
  await Promise.all(workers);
  return out;
}

/**
 * Execute an audit end-to-end: generate prompts, probe each engine for each
 * prompt, detect brand/competitor presence, persist every result, then score.
 * Writes progress to the DB as it goes so the UI can poll.
 */
export async function runAudit(auditId: string): Promise<void> {
  const audit = getAudit(auditId);
  if (!audit) throw new Error(`audit ${auditId} not found`);
  const project = getProject(audit.projectId);
  if (!project) throw new Error(`project ${audit.projectId} not found`);

  const engines = resolveEngines(audit.engines);
  if (engines.length === 0) {
    setAuditStatus(auditId, "error", "No answer-engine is configured. Set ANTHROPIC_API_KEY.");
    return;
  }

  setAuditStatus(auditId, "running");

  try {
    const prompts = await generatePrompts(project, audit.promptCount);

    // Build the full (prompt × engine) task grid.
    const tasks = prompts.flatMap((prompt) =>
      engines.map((engine) => ({ prompt, engine })),
    );

    let done = 0;
    await mapPool(tasks, 4, async ({ prompt, engine }) => {
      try {
        const res = await engine.ask(prompt);
        const d = detect(project, res.answer, res.citations);
        insertResult({
          auditId,
          prompt,
          engine: engine.id,
          answer: res.answer,
          brandMentioned: d.brandMentioned,
          brandCited: d.brandCited,
          competitorsFound: d.competitorsFound,
          citations: res.citations,
          webSearchUsed: res.webSearchUsed,
        });
      } catch (e) {
        // Record the failed probe as an empty result so scoring stays honest
        // (a brand that errors out is, for this prompt, simply not surfaced).
        insertResult({
          auditId,
          prompt,
          engine: engine.id,
          answer: `[engine error] ${(e as Error).message}`,
          brandMentioned: false,
          brandCited: false,
          competitorsFound: [],
          citations: [],
          webSearchUsed: false,
        });
      } finally {
        bumpAuditProgress(auditId, ++done);
      }
    });

    const results = getAuditResults(auditId);
    const score = scoreAudit(project, results);
    completeAudit(auditId, score.visibilityScore);
  } catch (e) {
    setAuditStatus(auditId, "error", (e as Error).message);
  }
}

/**
 * Fire-and-forget launcher. On the Node runtime the process stays alive after
 * the route responds, so the audit keeps running while the client polls.
 * (Swap for Inngest/queue in production for durability across deploys.)
 */
export function startAudit(auditId: string): void {
  void runAudit(auditId).catch((e) => {
    setAuditStatus(auditId, "error", (e as Error).message);
  });
}

export type { Project };
