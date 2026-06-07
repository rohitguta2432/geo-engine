import { config } from "@/lib/config";
import { claudeComplete } from "@/lib/llm/anthropic";
import { ollamaChat } from "@/lib/llm/ollama";

/**
 * Unified generation. `preferLocal` routes cheap/high-volume work to free local
 * Ollama first and falls back to Claude; quality work goes to Claude first and
 * falls back to local. Either way, at least one provider must be configured.
 */
export async function generateText(opts: {
  system?: string;
  prompt: string;
  maxTokens?: number;
  preferLocal?: boolean;
  json?: boolean;
}): Promise<string> {
  const tryLocal = () =>
    ollamaChat({ system: opts.system, prompt: opts.prompt, json: opts.json });
  const tryClaude = () =>
    claudeComplete({ system: opts.system, prompt: opts.prompt, maxTokens: opts.maxTokens });

  const order: Array<() => Promise<string>> = [];
  if (opts.preferLocal) {
    if (config.ollama.enabled) order.push(tryLocal);
    if (config.anthropic.enabled) order.push(tryClaude);
  } else {
    if (config.anthropic.enabled) order.push(tryClaude);
    if (config.ollama.enabled) order.push(tryLocal);
  }
  if (order.length === 0) {
    throw new Error(
      "No LLM provider configured. Set ANTHROPIC_API_KEY or run Ollama (OLLAMA_HOST).",
    );
  }

  let lastErr: unknown;
  for (const fn of order) {
    try {
      const out = await fn();
      if (out && out.trim()) return out;
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr ?? new Error("generation failed");
}

/** Best-effort JSON extraction from a model response. */
export function extractJson<T>(raw: string): T {
  const trimmed = raw.trim();
  try {
    return JSON.parse(trimmed) as T;
  } catch {
    // Pull the largest {...} or [...] span.
    const start = trimmed.search(/[[{]/);
    const end = Math.max(trimmed.lastIndexOf("}"), trimmed.lastIndexOf("]"));
    if (start >= 0 && end > start) {
      return JSON.parse(trimmed.slice(start, end + 1)) as T;
    }
    throw new Error("no JSON found in model output");
  }
}

export async function generateJson<T>(opts: {
  system?: string;
  prompt: string;
  maxTokens?: number;
  preferLocal?: boolean;
}): Promise<T> {
  const raw = await generateText({ ...opts, json: true });
  return extractJson<T>(raw);
}
