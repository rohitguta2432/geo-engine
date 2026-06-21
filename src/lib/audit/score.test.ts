import { describe, expect, it } from "vitest";
import { citationSources, scoreAudit } from "@/lib/audit/score";
import type { AuditResult, Project } from "@/lib/types";

const project: Project = {
  id: "p1",
  owner: "local",
  brand: "Acme",
  domain: "acme.com",
  category: "project management",
  competitors: ["Asana", "Notion"],
  createdAt: 0,
};

let seq = 0;
function result(p: Partial<AuditResult>): AuditResult {
  return {
    id: `r${seq++}`,
    auditId: "a1",
    prompt: "q",
    engine: "claude",
    answer: "",
    brandMentioned: false,
    brandCited: false,
    competitorsFound: [],
    citations: [],
    webSearchUsed: false,
    createdAt: 0,
    ...p,
  };
}

describe("citationSources", () => {
  it("ranks domains by citation count, most-cited first", () => {
    const results = [
      result({ prompt: "q1", citations: ["https://g2.com/a", "https://reddit.com/x"] }),
      result({ prompt: "q2", engine: "openai", citations: ["https://g2.com/b"] }),
    ];
    const sources = citationSources(project, results);
    expect(sources.map((s) => s.domain)).toEqual(["g2.com", "reddit.com"]);
    expect(sources[0]).toMatchObject({ count: 2, prompts: 2, owner: "third-party" });
    expect(sources[0].engines.sort()).toEqual(["claude", "openai"]);
  });

  it("de-dupes a domain repeated within one answer", () => {
    const results = [
      result({
        prompt: "q1",
        citations: ["https://g2.com/a", "https://www.g2.com/b", "http://g2.com/c"],
      }),
    ];
    const [g2] = citationSources(project, results);
    expect(g2).toMatchObject({ domain: "g2.com", count: 1, prompts: 1 });
  });

  it("attributes domains to the brand and to tracked competitors", () => {
    const results = [
      result({ prompt: "q1", citations: ["https://acme.com/pricing"] }),
      result({ prompt: "q2", citations: ["https://www.asana.com/feature"] }),
      result({ prompt: "q3", citations: ["https://techcrunch.com/post"] }),
    ];
    const byDomain = Object.fromEntries(
      citationSources(project, results).map((s) => [s.domain, s]),
    );
    expect(byDomain["acme.com"]).toMatchObject({ owner: "brand", ownerName: "Acme" });
    expect(byDomain["asana.com"]).toMatchObject({ owner: "competitor", ownerName: "Asana" });
    expect(byDomain["techcrunch.com"]).toMatchObject({ owner: "third-party" });
    expect(byDomain["techcrunch.com"].ownerName).toBeUndefined();
  });

  it("returns an empty list when no answer carried citations", () => {
    expect(citationSources(project, [result({})])).toEqual([]);
  });

  it("is surfaced on the full AuditScore", () => {
    const score = scoreAudit(project, [
      result({ prompt: "q1", citations: ["https://g2.com/a"] }),
    ]);
    expect(score.sources).toHaveLength(1);
    expect(score.sources[0].domain).toBe("g2.com");
  });
});
