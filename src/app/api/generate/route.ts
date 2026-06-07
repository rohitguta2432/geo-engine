import { NextResponse } from "next/server";
import { z } from "zod";
import { generateAsset } from "@/lib/content/generate";
import { currentPlan } from "@/lib/plan";
import { getProject, insertAsset, listProjectAssets } from "@/lib/repo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const Body = z.object({
  projectId: z.string().min(1),
  auditId: z.string().nullish(),
  prompt: z.string().min(1).max(400),
  type: z.enum(["comparison", "qa", "listicle"]).default("qa"),
});

const MONTH_MS = 30 * 24 * 60 * 60 * 1000;

export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const b = parsed.data;

  const project = getProject(b.projectId);
  if (!project) return NextResponse.json({ error: "project not found" }, { status: 404 });

  // Plan gating: cap assets per rolling month (unlimited on the local plan).
  const plan = currentPlan();
  const since = Date.now() - MONTH_MS;
  const usedThisMonth = listProjectAssets(project.id).filter((a) => a.createdAt >= since).length;
  if (usedThisMonth >= plan.assetsPerMonth) {
    return NextResponse.json(
      { error: `Asset limit reached for the ${plan.name} plan (${plan.assetsPerMonth}/mo).`, code: "plan_limit" },
      { status: 402 },
    );
  }

  try {
    const asset = await generateAsset({
      project,
      auditId: b.auditId ?? null,
      prompt: b.prompt,
      type: b.type,
    });
    const saved = insertAsset(asset);
    return NextResponse.json(saved);
  } catch (e) {
    return NextResponse.json(
      { error: `Content generation failed: ${(e as Error).message}` },
      { status: 502 },
    );
  }
}
