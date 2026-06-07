/**
 * Central config + feature flags. Everything optional degrades gracefully:
 * the app boots and runs an audit with just ANTHROPIC_API_KEY (+ local Ollama).
 */

function bool(v: string | undefined, dflt: boolean): boolean {
  if (v === undefined) return dflt;
  return v === "1" || v.toLowerCase() === "true";
}

/**
 * Ollama's own `OLLAMA_HOST` is a bind address like `0.0.0.0:11434` — no URL
 * scheme, and 0.0.0.0 is not a connect target. Normalize to a fetch()-able URL.
 */
function ollamaHost(v: string | undefined): string {
  let raw = (v || "http://127.0.0.1:11434").trim();
  if (!/^https?:\/\//i.test(raw)) raw = `http://${raw}`;
  return raw.replace("//0.0.0.0", "//127.0.0.1");
}

export const config = {
  anthropic: {
    apiKey: process.env.ANTHROPIC_API_KEY ?? "",
    baseURL: process.env.ANTHROPIC_BASE_URL || undefined,
    auditModel: process.env.GEO_AUDIT_MODEL || "claude-sonnet-4-6",
    contentModel: process.env.GEO_CONTENT_MODEL || "claude-sonnet-4-6",
    get enabled() {
      return !!process.env.ANTHROPIC_API_KEY;
    },
  },
  ollama: {
    host: ollamaHost(process.env.OLLAMA_HOST),
    model: process.env.GEO_OLLAMA_MODEL || "qwen3:14b",
    enabled: bool(process.env.GEO_OLLAMA_ENABLED, true),
  },
  perplexity: {
    apiKey: process.env.PERPLEXITY_API_KEY ?? "",
    model: process.env.GEO_PERPLEXITY_MODEL || "sonar",
    get enabled() {
      return !!process.env.PERPLEXITY_API_KEY;
    },
  },
  openai: {
    apiKey: process.env.OPENAI_API_KEY ?? "",
    model: process.env.GEO_OPENAI_MODEL || "gpt-4o-search-preview",
    get enabled() {
      return !!process.env.OPENAI_API_KEY;
    },
  },
  gemini: {
    apiKey: process.env.GEMINI_API_KEY ?? "",
    model: process.env.GEO_GEMINI_MODEL || "gemini-2.0-flash",
    get enabled() {
      return !!process.env.GEMINI_API_KEY;
    },
  },
  google: {
    // Google AI Overviews has no official API -> optional SERP provider.
    serpApiKey: process.env.SERPAPI_KEY ?? "",
    get aioEnabled() {
      return !!process.env.SERPAPI_KEY;
    },
    // Reuse an existing Indexing API service-account JSON if present.
    indexingSaPath: process.env.GOOGLE_INDEXING_SA || "",
    get indexingEnabled() {
      return !!process.env.GOOGLE_INDEXING_SA;
    },
  },
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY ?? "",
    priceStarter: process.env.STRIPE_PRICE_STARTER || "",
    priceGrowth: process.env.STRIPE_PRICE_GROWTH || "",
    pricePro: process.env.STRIPE_PRICE_PRO || "",
    get enabled() {
      return !!process.env.STRIPE_SECRET_KEY;
    },
  },
  app: {
    name: "EchoRank",
    promptsPerAudit: Number(process.env.GEO_PROMPTS_PER_AUDIT || 12),
    maxCompetitors: Number(process.env.GEO_MAX_COMPETITORS || 6),
    dbPath: process.env.GEO_DB_PATH || "./geo.db",
    baseUrl: process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000",
  },
} as const;

/** Which answer-engines can actually run given present credentials. */
export function activeEngineIds(): string[] {
  const ids: string[] = [];
  if (config.anthropic.enabled) ids.push("claude");
  if (config.gemini.enabled) ids.push("gemini");
  if (config.perplexity.enabled) ids.push("perplexity");
  if (config.openai.enabled) ids.push("openai");
  if (config.google.aioEnabled) ids.push("google-aio");
  if (config.ollama.enabled) ids.push("ollama");
  return ids;
}
