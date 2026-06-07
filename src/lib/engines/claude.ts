import { config } from "@/lib/config";
import { askClaudeWithWebSearch } from "@/lib/llm/anthropic";
import type { AnswerEngine } from "@/lib/engines/types";

export const claudeEngine: AnswerEngine = {
  id: "claude",
  label: "Claude (web search)",
  available: () => config.anthropic.enabled,
  async ask(prompt) {
    const r = await askClaudeWithWebSearch(prompt);
    return { answer: r.text, citations: r.citations, webSearchUsed: r.webSearchUsed };
  },
};
