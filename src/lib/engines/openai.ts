import { config } from "@/lib/config";
import type { AnswerEngine } from "@/lib/engines/types";

/* eslint-disable @typescript-eslint/no-explicit-any */
export const openaiEngine: AnswerEngine = {
  id: "openai",
  label: "ChatGPT (web search)",
  available: () => config.openai.enabled,
  async ask(prompt) {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        authorization: `Bearer ${config.openai.apiKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: config.openai.model,
        messages: [{ role: "user", content: prompt }],
      }),
      signal: AbortSignal.timeout(60_000),
    });
    if (!res.ok) throw new Error(`openai ${res.status} ${await res.text()}`);
    const data: any = await res.json();
    const msg = data.choices?.[0]?.message ?? {};
    const answer: string = msg.content ?? "";
    const citations: string[] = (msg.annotations ?? [])
      .map((a: any) => a?.url_citation?.url)
      .filter(Boolean);
    return { answer, citations, webSearchUsed: true };
  },
};
