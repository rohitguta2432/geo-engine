import { config } from "@/lib/config";
import type { AnswerEngine } from "@/lib/engines/types";

/* eslint-disable @typescript-eslint/no-explicit-any */

/** Flatten SerpAPI's nested AI-Overview text_blocks into a single string. */
function flattenBlocks(blocks: any[]): string {
  const out: string[] = [];
  for (const b of blocks ?? []) {
    if (typeof b?.snippet === "string") out.push(b.snippet);
    if (Array.isArray(b?.list)) {
      for (const item of b.list) {
        if (typeof item?.snippet === "string") out.push(`- ${item.snippet}`);
      }
    }
    if (Array.isArray(b?.text_blocks)) out.push(flattenBlocks(b.text_blocks));
  }
  return out.filter(Boolean).join("\n");
}

/**
 * Google AI Overviews has no official API, so we read it through SerpAPI.
 * Gated on SERPAPI_KEY; absent that, this engine reports itself unavailable.
 */
export const googleAioEngine: AnswerEngine = {
  id: "google-aio",
  label: "Google AI Overview",
  available: () => config.google.aioEnabled,
  async ask(prompt) {
    const url = new URL("https://serpapi.com/search.json");
    url.searchParams.set("engine", "google");
    url.searchParams.set("q", prompt);
    url.searchParams.set("api_key", config.google.serpApiKey);
    const res = await fetch(url, { signal: AbortSignal.timeout(60_000) });
    if (!res.ok) throw new Error(`serpapi ${res.status} ${await res.text()}`);
    const data: any = await res.json();

    // The AI Overview may arrive inline or require a second page_token fetch.
    let aio: any = data.ai_overview;
    if (aio?.page_token && !aio?.text_blocks) {
      const f = new URL("https://serpapi.com/search.json");
      f.searchParams.set("engine", "google_ai_overview");
      f.searchParams.set("page_token", aio.page_token);
      f.searchParams.set("api_key", config.google.serpApiKey);
      const r2 = await fetch(f, { signal: AbortSignal.timeout(60_000) });
      if (r2.ok) aio = (await r2.json()).ai_overview ?? aio;
    }

    const answer = flattenBlocks(aio?.text_blocks ?? []);
    const citations: string[] = (aio?.references ?? [])
      .map((r: any) => r?.link)
      .filter(Boolean);
    return { answer, citations, webSearchUsed: true };
  },
};
