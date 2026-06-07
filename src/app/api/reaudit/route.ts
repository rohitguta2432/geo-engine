import { NextResponse } from "next/server";
import { z } from "zod";
import { activeEngineIds, config } from "@/lib/config";
import { startAudit } from "@/lib/audit/run";
import { currentPlan } from "@/lib/plan";
import { createAudit, getProject } from "@/lib/repo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const Body = z.object({
  projectId: z.string().min(1),
  engines: z.array(z.string()).optional(),
  promptCount: z.number().int().positive().max(300).optional(),
});

/** Re-run an audit for an existing project to measure visibility lift over time. */
export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const b = parsed.data;

  const project = getProject(b.projectId);
  if (!project) return NextResponse.json({ error: "project not found" }, { status: 404 });

  const available = activeEngineIds();
  if (available.length === 0) {
    return NextResponse.json(
      { error: "No answer-engine is configured. Set ANTHROPIC_API_KEY." },
      { status: 400 },
    );
  }
  const engines = b.engines?.length
    ? b.engines.filter((id) => available.includes(id))
    : available;
  if (engines.length === 0) {
    return NextResponse.json({ error: "None of the requested engines are available." }, { status: 400 });
  }

  const plan = currentPlan();
  const promptCount = Math.min(
    b.promptCount ?? config.app.promptsPerAudit,
    plan.promptsPerAudit,
  );

  const audit = createAudit({ projectId: project.id, engines, promptCount });
  startAudit(audit.id);

  return NextResponse.json({ projectId: project.id, auditId: audit.id });
}
