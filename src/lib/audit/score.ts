import { domainRoot, host, hostMatch } from "@/lib/audit/detect";
import type {
  AuditResult,
  AuditScore,
  CitationSource,
  GapPrompt,
  Project,
} from "@/lib/types";

function round(n: number): number {
  return Math.round(n * 10) / 10;
}

/**
 * Aggregate raw per-(prompt,engine) results into the headline Visibility Score,
 * a brand-vs-competitor leaderboard, and the gap prompts worth attacking.
 *
 * Visibility Score (0-100) blends three signals, each in [0,1]:
 *   - mentionRate: how often the brand shows up at all
 *   - citeRate:    how often the brand is an actual cited source (strongest GEO signal)
 *   - shareOfVoice: brand mentions / all brand+competitor mentions (competitive)
 */
export function scoreAudit(project: Project, results: AuditResult[]): AuditScore {
  const total = results.length || 1;

  const brandMentions = results.filter((r) => r.brandMentioned).length;
  const brandCitations = results.filter((r) => r.brandCited).length;

  // Mention tally per entity for the leaderboard / share-of-voice.
  const compMentions = new Map<string, number>();
  for (const name of project.competitors) compMentions.set(name, 0);
  for (const r of results) {
    for (const c of r.competitorsFound) {
      compMentions.set(c, (compMentions.get(c) ?? 0) + 1);
    }
  }
  const totalMentions =
    brandMentions + Array.from(compMentions.values()).reduce((a, b) => a + b, 0);

  const mentionRate = brandMentions / total;
  const citeRate = brandCitations / total;
  const shareOfVoice = totalMentions ? brandMentions / totalMentions : 0;

  const visibilityScore = round(
    100 * (0.4 * mentionRate + 0.4 * citeRate + 0.2 * shareOfVoice),
  );

  const leaderboard = [
    {
      name: project.brand,
      mentions: brandMentions,
      citations: brandCitations,
      share: round(totalMentions ? (100 * brandMentions) / totalMentions : 0),
    },
    ...project.competitors.map((name) => {
      const m = compMentions.get(name) ?? 0;
      return {
        name,
        mentions: m,
        citations: 0,
        share: round(totalMentions ? (100 * m) / totalMentions : 0),
      };
    }),
  ].sort((a, b) => b.mentions - a.mentions || b.citations - a.citations);

  return {
    visibilityScore,
    brandCitationRate: round(100 * citeRate),
    promptsTotal: results.length,
    promptsWithBrand: brandMentions,
    leaderboard,
    gaps: findGaps(results),
    sources: citationSources(project, results),
  };
}

/**
 * Roll every citation URL up to its domain and rank by how often the engines
 * cite it. Each domain is attributed to the brand, a tracked competitor (by
 * matching the domain's root label to a competitor name), or a neutral
 * third-party. The third-party rows are the actionable GEO target list — the
 * external sites to earn a mention on so the engines start citing you too.
 */
export function citationSources(
  project: Project,
  results: AuditResult[],
): CitationSource[] {
  const brandHost = host(project.domain);
  // Map a competitor's domain-root label back to its display name.
  const compByRoot = new Map<string, string>();
  for (const name of project.competitors) {
    const root = name.trim().toLowerCase();
    if (root) compByRoot.set(root, name);
  }

  interface Agg {
    count: number;
    prompts: Set<string>;
    engines: Set<string>;
  }
  const byDomain = new Map<string, Agg>();

  for (const r of results) {
    // De-dupe within a single answer so one engine repeating a URL counts once.
    const seen = new Set<string>();
    for (const url of r.citations) {
      const domain = host(url);
      if (!domain || seen.has(domain)) continue;
      seen.add(domain);
      const agg = byDomain.get(domain) ?? {
        count: 0,
        prompts: new Set<string>(),
        engines: new Set<string>(),
      };
      agg.count += 1;
      agg.prompts.add(r.prompt);
      agg.engines.add(r.engine);
      byDomain.set(domain, agg);
    }
  }

  const sources: CitationSource[] = Array.from(byDomain, ([domain, agg]) => {
    let owner: CitationSource["owner"] = "third-party";
    let ownerName: string | undefined;
    if (brandHost && hostMatch(domain, brandHost)) {
      owner = "brand";
      ownerName = project.brand;
    } else {
      const comp = compByRoot.get(domainRoot(domain));
      if (comp) {
        owner = "competitor";
        ownerName = comp;
      }
    }
    return {
      domain,
      count: agg.count,
      prompts: agg.prompts.size,
      engines: Array.from(agg.engines),
      owner,
      ownerName,
    };
  });

  // Most-cited first; break ties by breadth of prompts, then alphabetically.
  return sources.sort(
    (a, b) =>
      b.count - a.count ||
      b.prompts - a.prompts ||
      a.domain.localeCompare(b.domain),
  );
}

/**
 * A gap = a prompt where, across every engine probed, the brand never appeared
 * yet at least one competitor did. These are the queries to write content for.
 */
export function findGaps(results: AuditResult[]): GapPrompt[] {
  const byPrompt = new Map<string, AuditResult[]>();
  for (const r of results) {
    const arr = byPrompt.get(r.prompt) ?? [];
    arr.push(r);
    byPrompt.set(r.prompt, arr);
  }

  const gaps: GapPrompt[] = [];
  for (const [prompt, rows] of byPrompt) {
    const brandAnywhere = rows.some((r) => r.brandMentioned || r.brandCited);
    if (brandAnywhere) continue;

    const competitors = new Set<string>();
    const engines = new Set<string>();
    for (const r of rows) {
      if (r.competitorsFound.length) {
        engines.add(r.engine);
        for (const c of r.competitorsFound) competitors.add(c);
      }
    }
    if (competitors.size === 0) continue;

    gaps.push({
      prompt,
      competitorsFound: Array.from(competitors),
      engines: Array.from(engines),
    });
  }

  // Most-contested gaps first.
  return gaps.sort((a, b) => b.competitorsFound.length - a.competitorsFound.length);
}
