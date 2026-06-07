import { config } from "@/lib/config";
import type { AnswerEngine } from "@/lib/engines/types";

/* eslint-disable @typescript-eslint/no-explicit-any */
export const perplexityEngine: AnswerEngine = {
  id: "perplexity",
  label: "Perplexity",
  available: () => config.perplexity.enabled,
  async ask(prompt) {
    const res = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        authorization: `Bearer ${config.perplexity.apiKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: config.perplexity.model,
        messages: [{ role: "user", content: prompt }],
      }),
      signal: AbortSignal.timeout(60_000),
    });
    if (!res.ok) throw new Error(`perplexity ${res.status} ${await res.text()}`);
    const data: any = await res.json();
    const answer: string = data.choices?.[0]?.message?.content ?? "";
    const citations: string[] =
      data.citations ??
      (data.search_results ?? []).map((s: any) => s.url).filter(Boolean) ??
      [];
    return { answer, citations, webSearchUsed: true };
  },
};
