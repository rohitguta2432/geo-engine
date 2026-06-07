import { marked } from "marked";
import { generateJson } from "@/lib/llm/gen";
import { articleSchema, faqPageSchema, itemListSchema } from "@/lib/content/schema";
import type { Asset, AssetType, Project } from "@/lib/types";

const GUARDRAIL = `You are a senior content strategist writing for the brand's OWN website to earn citations from AI answer-engines (ChatGPT, Claude, Perplexity, Google AI Overviews).

Principles:
- Be genuinely useful and accurate. AI engines cite content that directly, factually answers the query.
- Feature the brand prominently and honestly as a strong option, but do NOT disparage competitors — name them fairly where relevant.
- Do NOT invent specific prices, stats, awards, or features you cannot be sure of. Keep claims defensible and general where unsure.
- Write in clear, extractable prose: short paragraphs, concrete specifics, scannable structure.
- Return ONLY JSON, no commentary.`;

function htmlify(md: string): Promise<string> {
  return Promise.resolve(marked.parse(md) as string);
}

interface QaShape {
  title: string;
  intro: string;
  faqs: { question: string; answer: string }[];
}
interface ListShape {
  title: string;
  intro: string;
  items: { name: string; why: string }[];
}
interface CompareShape {
  title: string;
  metaDescription: string;
  bodyMd: string;
}

async function buildQa(project: Project, prompt: string) {
  const data = await generateJson<QaShape>({
    system: GUARDRAIL,
    prompt: `Brand: ${project.brand} (${project.domain})
Category: ${project.category}
Target query: "${prompt}"

Write an FAQ page that answers this query and the related questions a buyer would ask. Include ${project.brand} naturally in the answers where it genuinely fits.
Return JSON: { "title": "...", "intro": "1-2 sentence intro", "faqs": [ { "question": "...", "answer": "2-4 sentence answer" } ] } with 5-8 FAQs.`,
    maxTokens: 2048,
  });
  const md = [
    `# ${data.title}`,
    "",
    data.intro,
    "",
    ...data.faqs.flatMap((f) => [`## ${f.question}`, "", f.answer, ""]),
  ].join("\n");
  return {
    title: data.title,
    bodyMd: md,
    schemaJsonld: faqPageSchema(project, data.faqs),
  };
}

async function buildListicle(project: Project, prompt: string) {
  const data = await generateJson<ListShape>({
    system: GUARDRAIL,
    prompt: `Brand: ${project.brand} (${project.domain})
Category: ${project.category}
Target query: "${prompt}"
Known players: ${project.competitors.join(", ") || "(none provided)"}

Write a "best options" listicle that answers this query. Include ${project.brand} as one of the entries, positioned on its genuine strengths. Include real competitors too so the piece is credible.
Return JSON: { "title": "...", "intro": "1-2 sentences", "items": [ { "name": "Product/brand name", "why": "2-3 sentences on who it's best for" } ] } with 5-7 items.`,
    maxTokens: 2048,
  });
  const md = [
    `# ${data.title}`,
    "",
    data.intro,
    "",
    ...data.items.map((it, i) => `## ${i + 1}. ${it.name}\n\n${it.why}\n`),
  ].join("\n");
  return {
    title: data.title,
    bodyMd: md,
    schemaJsonld: itemListSchema(project, {
      title: data.title,
      items: data.items.map((it) => ({ name: it.name, description: it.why })),
    }),
  };
}

async function buildComparison(project: Project, prompt: string) {
  const data = await generateJson<CompareShape>({
    system: GUARDRAIL,
    prompt: `Brand: ${project.brand} (${project.domain})
Category: ${project.category}
Target query: "${prompt}"
Compare against: ${project.competitors.join(", ") || "the leading alternatives"}

Write a head-to-head comparison that answers this query. Include a markdown comparison TABLE (columns for the key decision criteria, a row per option including ${project.brand}), short framing before it, and a "Bottom line" verdict after. Do NOT include a top-level H1 — start with the intro paragraph.
Return JSON: { "title": "...", "metaDescription": "<=155 chars", "bodyMd": "markdown with a table and a Bottom line section" }`,
    maxTokens: 2560,
  });
  const md = `# ${data.title}\n\n${data.bodyMd}`;
  return {
    title: data.title,
    bodyMd: md,
    schemaJsonld: articleSchema(project, {
      title: data.title,
      description: data.metaDescription,
    }),
  };
}

/**
 * Generate one citation-optimized content asset for a gap prompt. Routed to
 * Claude first (quality) via generateJson, then rendered to HTML + JSON-LD.
 */
export async function generateAsset(input: {
  project: Project;
  auditId: string | null;
  prompt: string;
  type: AssetType;
}): Promise<Omit<Asset, "id" | "createdAt">> {
  const { project, type, prompt } = input;

  const built =
    type === "qa"
      ? await buildQa(project, prompt)
      : type === "listicle"
        ? await buildListicle(project, prompt)
        : await buildComparison(project, prompt);

  const bodyHtml = await htmlify(built.bodyMd);

  return {
    projectId: project.id,
    auditId: input.auditId,
    prompt,
    type,
    title: built.title,
    bodyMd: built.bodyMd,
    bodyHtml,
    schemaJsonld: built.schemaJsonld,
  };
}
