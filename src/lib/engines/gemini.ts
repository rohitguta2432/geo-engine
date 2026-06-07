import { config } from "@/lib/config";
import type { AnswerEngine } from "@/lib/engines/types";

/* eslint-disable @typescript-eslint/no-explicit-any */

const DOMAIN_RE = /^[a-z0-9-]+(\.[a-z0-9-]+)+$/i;

/**
 * Google Gemini with the `google_search` grounding tool — a real web-search
 * answer engine. Grounding returns redirect URIs plus the source site in
 * `web.title`; we prefer the title (the actual domain) so brand-citation
 * detection works, falling back to the redirect URI.
 */
export const geminiEngine: AnswerEngine = {
  id: "gemini",
  label: "Gemini (Google Search)",
  available: () => config.gemini.enabled,
  async ask(prompt) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${config.gemini.model}:generateContent?key=${config.gemini.apiKey}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        tools: [{ google_search: {} }],
      }),
      signal: AbortSignal.timeout(60_000),
    });
    if (!res.ok) throw new Error(`gemini ${res.status} ${await res.text()}`);
    const data: any = await res.json();

    const cand = data.candidates?.[0] ?? {};
    const answer: string = (cand.content?.parts ?? [])
      .map((p: any) => p?.text)
      .filter(Boolean)
      .join("");

    const chunks: any[] = cand.groundingMetadata?.groundingChunks ?? [];
    const citations = chunks
      .map((c) => {
        const w = c?.web;
        if (!w) return null;
        const title = String(w.title ?? "").trim();
        if (DOMAIN_RE.test(title)) return `https://${title}`;
        return w.uri ?? null;
      })
      .filter((x): x is string => Boolean(x));

    return { answer, citations, webSearchUsed: chunks.length > 0 };
  },
};
