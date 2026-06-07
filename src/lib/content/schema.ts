import type { Project } from "@/lib/types";

/**
 * Schema.org JSON-LD builders. Structured data is one of the strongest levers
 * for getting surfaced by AI answer-engines, so every generated asset ships
 * with the markup that best fits its shape (FAQ, comparison, list).
 */

function publisher(project: Project) {
  return {
    "@type": "Organization",
    name: project.brand,
    url: `https://${project.domain.replace(/^https?:\/\//, "")}`,
  };
}

export function faqPageSchema(
  project: Project,
  faqs: { question: string; answer: string }[],
): string {
  const doc = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    publisher: publisher(project),
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: f.answer },
    })),
  };
  return JSON.stringify(doc, null, 2);
}

export function articleSchema(
  project: Project,
  opts: { title: string; description: string },
): string {
  const doc = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: opts.title,
    description: opts.description,
    author: publisher(project),
    publisher: publisher(project),
    datePublished: new Date().toISOString().slice(0, 10),
  };
  return JSON.stringify(doc, null, 2);
}

export function itemListSchema(
  project: Project,
  opts: { title: string; items: { name: string; description: string }[] },
): string {
  const doc = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: opts.title,
    publisher: publisher(project),
    itemListElement: opts.items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      description: it.description,
    })),
  };
  return JSON.stringify(doc, null, 2);
}
