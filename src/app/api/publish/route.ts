import { NextResponse } from "next/server";
import { z } from "zod";
import { publishIndexing } from "@/lib/publish/indexing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const Body = z.object({
  urls: z.array(z.string().url()).min(1).max(100),
  type: z.enum(["URL_UPDATED", "URL_DELETED"]).default("URL_UPDATED"),
});

/** Ping Google's Indexing API for freshly-published asset URLs. */
export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  try {
    const out = await publishIndexing(parsed.data.urls, parsed.data.type);
    return NextResponse.json(out);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }
}
