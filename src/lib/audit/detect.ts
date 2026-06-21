import type { Project } from "@/lib/types";

/** Normalize any URL or bare domain to a lowercase registrable-ish host. */
export function host(u: string): string {
  const raw = u.trim();
  try {
    const parsed = new URL(raw.startsWith("http") ? raw : `https://${raw}`);
    return parsed.hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return raw
      .replace(/^https?:\/\//, "")
      .replace(/^www\./, "")
      .split("/")[0]
      .toLowerCase();
  }
}

/** Two hosts match if one is the other or a subdomain of it. */
export function hostMatch(a: string, b: string): boolean {
  if (!a || !b) return false;
  return a === b || a.endsWith(`.${b}`) || b.endsWith(`.${a}`);
}

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Whole-token, case-insensitive mention test that tolerates the punctuation
 * around brand names ("Notion.", "(Asana)", "MyFinancial,"). Avoids matching
 * substrings inside larger words.
 */
export function mentions(text: string, term: string): boolean {
  const t = term.trim();
  if (!t) return false;
  const re = new RegExp(`(^|[^a-z0-9])${escapeRe(t)}([^a-z0-9]|$)`, "i");
  return re.test(text);
}

/** The second-level label of a domain, e.g. myfinancial.in -> "myfinancial". */
export function domainRoot(domain: string): string {
  const h = host(domain);
  const parts = h.split(".");
  return parts.length >= 2 ? parts[parts.length - 2] : h;
}

export interface Detection {
  brandMentioned: boolean;
  brandCited: boolean;
  competitorsFound: string[];
}

/**
 * Inspect one engine answer for whether the brand showed up (by name or domain
 * root) and whether its domain was actually cited, plus which competitors the
 * answer names.
 */
export function detect(
  project: Project,
  answer: string,
  citations: string[],
): Detection {
  const brandHost = host(project.domain);
  const root = domainRoot(project.domain);

  const brandMentioned =
    mentions(answer, project.brand) || (root.length > 2 && mentions(answer, root));

  const brandCited = citations.some((c) => hostMatch(host(c), brandHost));

  const competitorsFound = project.competitors.filter((c) => mentions(answer, c));

  return { brandMentioned, brandCited, competitorsFound };
}
