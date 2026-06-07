import { NextResponse } from "next/server";
import { getAuditView } from "@/lib/audit/view";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const view = getAuditView(id);
  if (!view) return NextResponse.json({ error: "audit not found" }, { status: 404 });
  return NextResponse.json(view);
}
