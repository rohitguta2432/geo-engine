/**
 * Client-safe engine id → label map. Kept separate from the engine registry
 * (which imports the Anthropic SDK / server config) so UI components can label
 * engines without bundling server-only code.
 */
export const ENGINE_LABELS: Record<string, string> = {
  claude: "Claude (web search)",
  gemini: "Gemini (Google Search)",
  perplexity: "Perplexity",
  openai: "ChatGPT (web search)",
  "google-aio": "Google AI Overview",
  ollama: "Local model (Ollama)",
};

export function engineLabel(id: string): string {
  return ENGINE_LABELS[id] ?? id;
}
