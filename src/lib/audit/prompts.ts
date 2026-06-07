import { generateJson } from "@/lib/llm/gen";
import type { Project } from "@/lib/types";

const SYSTEM = `You generate realistic buyer-intent search queries that people type into AI assistants (ChatGPT, Claude, Perplexity, Google) when researching a purchase in a given category.

Rules:
- Write queries a real prospective customer would ask — comparisons, "best X for Y", how-to-choose, pricing, alternatives, use-case fit.
- NEVER mention the brand we are testing. We want to see whether the AI surfaces it unprompted.
- Mix head terms and long-tail. Keep each query under 18 words.
- No numbering, no quotes, no commentary. Return ONLY JSON.`;

function fallbackPrompts(p: Project, n: number): string[] {
  const c = p.category || "tools";
  const base = [
    `best ${c} in 2026`,
    `top ${c} for small businesses`,
    `most recommended ${c} for beginners`,
    `${c} comparison and pricing`,
    `how to choose the right ${c}`,
    `${c} alternatives worth considering`,
    `which ${c} has the best reviews`,
    `affordable ${c} with good support`,
    `${c} for enterprise teams`,
    `pros and cons of popular ${c}`,
    `${c} that integrate well with other tools`,
    `is it worth paying for ${c}`,
  ];
  return base.slice(0, n);
}

/**
 * Generate ~promptCount buyer-intent queries for a project's category.
 * Runs on free local Ollama first (high volume), falls back to Claude, and
 * finally to a deterministic template set so an audit can always start.
 */
export async function generatePrompts(p: Project, count: number): Promise<string[]> {
  const user = `Category: ${p.category}
Brand under test (DO NOT mention it): ${p.brand}
${p.competitors.length ? `Example competitors in this space: ${p.competitors.join(", ")}` : ""}

Return JSON of the form { "queries": ["...", "..."] } with exactly ${count} distinct queries.`;

  try {
    const out = await generateJson<{ queries?: string[] }>({
      system: SYSTEM,
      prompt: user,
      preferLocal: true,
      maxTokens: 1024,
    });
    const queries = (out.queries ?? [])
      .map((q) => String(q).trim())
      .filter(Boolean)
      // Drop any that leaked the brand name despite instructions.
      .filter((q) => !q.toLowerCase().includes(p.brand.toLowerCase()));
    const unique = Array.from(new Set(queries));
    if (unique.length >= Math.min(4, count)) return unique.slice(0, count);
  } catch {
    // fall through to template
  }
  return fallbackPrompts(p, count);
}
