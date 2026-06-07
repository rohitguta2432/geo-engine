import { claudeEngine } from "@/lib/engines/claude";
import { geminiEngine } from "@/lib/engines/gemini";
import { perplexityEngine } from "@/lib/engines/perplexity";
import { openaiEngine } from "@/lib/engines/openai";
import { googleAioEngine } from "@/lib/engines/google-aio";
import { ollamaEngine } from "@/lib/engines/ollama";
import type { AnswerEngine } from "@/lib/engines/types";

/** Every engine we know how to probe, in display order. */
const ALL: AnswerEngine[] = [
  claudeEngine,
  geminiEngine,
  perplexityEngine,
  openaiEngine,
  googleAioEngine,
  ollamaEngine,
];

export function allEngines(): AnswerEngine[] {
  return ALL;
}

/** Only engines whose credentials are present and ready to run. */
export function availableEngines(): AnswerEngine[] {
  return ALL.filter((e) => e.available());
}

/** Resolve a caller-supplied id list to runnable engines (order preserved). */
export function resolveEngines(ids: string[]): AnswerEngine[] {
  if (!ids?.length) return availableEngines();
  return ALL.filter((e) => ids.includes(e.id) && e.available());
}

export { engineLabel } from "@/lib/engines/labels";

export type { AnswerEngine };
