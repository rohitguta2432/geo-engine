import { config } from "@/lib/config";
import { ollamaChat } from "@/lib/llm/ollama";
import type { AnswerEngine } from "@/lib/engines/types";

const SYSTEM = `You are a helpful AI assistant answering a user's question, the way ChatGPT or Gemini would. Answer directly and concretely. When the question is about choosing a product, service, or provider, recommend specific REAL brands/companies by name (3-6 of them) with a sentence on each. Do not hedge with "I can't recommend"; give your best real-world answer. Be concise.`;

/**
 * Local-model answer engine (Ollama). It has no live web search, so it probes
 * the model's *parametric knowledge*: does the model recommend this brand
 * unprompted? A meaningful GEO signal on its own, and it lets the whole product
 * run with zero external API keys. Reports webSearchUsed:false and no citations.
 */
export const ollamaEngine: AnswerEngine = {
  id: "ollama",
  label: "Local model (Ollama)",
  available: () => config.ollama.enabled,
  async ask(prompt) {
    const answer = await ollamaChat({ system: SYSTEM, prompt, temperature: 0.5 });
    return { answer, citations: [], webSearchUsed: false };
  },
};
